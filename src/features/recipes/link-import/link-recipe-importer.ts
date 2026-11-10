import { AppError } from '@/domain/errors';

import type { ParsedRecipeText } from '../recipe-text-parser';
import { normalizeRecipeUrl } from '../recipe-source-links';
import { parseRecipeText } from '../recipe-text-parser';

import { extractBodyText, extractJsonLdRecipe, pageTitle, richness } from './html-extract';
import { pickYoutubeRecipe, toYoutubeSources, youtubeVideoId } from './youtube';

export type ImportSource = '레시피 구조 데이터' | '본문' | '설명란' | '작성자 댓글' | '인기 댓글';

export interface LinkImportResult {
  url: string;
  parsed: ParsedRecipeText;
  source: ImportSource;
}

const TIMEOUT_MS = 12_000;
const MAX_BYTES = 3_000_000;

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'text/html,application/json' } });
    if (!res.ok) throw new AppError('unknown', `페이지를 열지 못했어요. (${res.status})`);
    const text = await res.text();
    return text.length > MAX_BYTES ? text.slice(0, MAX_BYTES) : text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('unknown', '페이지를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', error);
  } finally {
    clearTimeout(timer);
  }
}

/** 네이버 블로그 PC 주소는 본문이 iframe 안에 있어 모바일 주소로 바꿔 연다. */
export function readableUrl(url: string): string {
  const u = new URL(url);
  if (u.hostname === 'blog.naver.com') {
    const [, id, logNo] = u.pathname.split('/');
    const queryId = u.searchParams.get('blogId');
    const queryLog = u.searchParams.get('logNo');
    if (queryId && queryLog) return `https://m.blog.naver.com/${queryId}/${queryLog}`;
    if (id && logNo) return `https://m.blog.naver.com/${id}/${logNo}`;
  }
  return url;
}

export function parsePage(html: string): { parsed: ParsedRecipeText; source: ImportSource } | null {
  const structured = extractJsonLdRecipe(html);
  if (structured && structured.ingredients.length) return { parsed: structured, source: '레시피 구조 데이터' };
  const body = parseRecipeText(extractBodyText(html));
  if (richness(body) === 0) return structured ? { parsed: structured, source: '레시피 구조 데이터' } : null;
  // 본문 첫 줄보다 페이지 제목이 정확하다.
  body.title = pageTitle(html) ?? body.title;
  return { parsed: body, source: '본문' };
}

/**
 * 사용자가 누른 링크 하나만 연다. 본문·설명란·메인 댓글의 글에서 재료와 순서만 뽑아 초안으로 돌려주고,
 * 페이지 원문·사진·영상은 저장하지 않는다.
 */
export async function importRecipeFromLink(input: string, youtubeApiKey?: string): Promise<LinkImportResult> {
  const url = normalizeRecipeUrl(input);
  const videoId = youtubeVideoId(url);
  if (videoId) {
    if (!youtubeApiKey) throw new AppError('unknown', 'YouTube 불러오기 설정이 아직 없어요. 설명란이나 고정 댓글의 레시피를 복사해 붙여넣어 주세요.');
    const base = 'https://www.googleapis.com/youtube/v3';
    const key = encodeURIComponent(youtubeApiKey);
    const video = JSON.parse(await fetchText(`${base}/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${key}`));
    let threads: unknown = { items: [] };
    try {
      threads = JSON.parse(await fetchText(`${base}/commentThreads?part=snippet&order=relevance&maxResults=20&textFormat=plainText&videoId=${encodeURIComponent(videoId)}&key=${key}`));
    } catch {
      // 댓글이 꺼진 영상이면 설명란만 본다.
    }
    const pick = pickYoutubeRecipe(toYoutubeSources(video, threads));
    if (!pick) throw new AppError('unknown', '설명란과 메인 댓글에서 재료를 찾지 못했어요. 레시피 글을 복사해 붙여넣어 주세요.');
    return { url, parsed: pick.parsed, source: pick.source };
  }
  const page = parsePage(await fetchText(readableUrl(url)));
  if (!page) throw new AppError('unknown', '본문에서 재료와 순서를 찾지 못했어요. 레시피 글을 복사해 붙여넣어 주세요.');
  return { url, ...page };
}
