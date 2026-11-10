import { parseRecipeText, type ParsedRecipeText } from '../recipe-text-parser';

import { richness } from './html-extract';

/** YouTube 링크에서 영상 ID. 영상 자체(소리·자막)는 다루지 않는다. */
export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host !== 'youtube.com') return null;
    if (u.pathname === '/watch') return u.searchParams.get('v');
    const m = /^\/(shorts|embed|live)\/([\w-]{6,})/.exec(u.pathname);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

export interface YoutubeSources {
  title?: string;
  channelId?: string;
  description?: string;
  comments: { text: string; authorChannelId?: string; likeCount: number }[];
}

export type YoutubePick = { parsed: ParsedRecipeText; source: '설명란' | '작성자 댓글' | '인기 댓글' } | null;

/**
 * 설명란과 메인 댓글 가운데 레시피가 가장 잘 정리되는 글을 고른다.
 * 메인 댓글은 영상 작성자가 단 댓글을 먼저, 없으면 공감이 가장 많은 댓글을 본다.
 */
export function pickYoutubeRecipe(sources: YoutubeSources): YoutubePick {
  const candidates: { text: string; source: '설명란' | '작성자 댓글' | '인기 댓글' }[] = [];
  if (sources.description) candidates.push({ text: sources.description, source: '설명란' });
  const own = sources.comments.find((c) => sources.channelId && c.authorChannelId === sources.channelId);
  if (own) candidates.push({ text: own.text, source: '작성자 댓글' });
  const top = [...sources.comments].sort((a, b) => b.likeCount - a.likeCount)[0];
  if (top && top !== own) candidates.push({ text: top.text, source: '인기 댓글' });

  let best: YoutubePick = null;
  for (const c of candidates) {
    const parsed = parseRecipeText(c.text);
    if (parsed.ingredients.length === 0) continue;
    if (!best || richness(parsed) > richness(best.parsed)) best = { parsed, source: c.source };
  }
  if (best && sources.title && !best.parsed.title) best.parsed.title = sources.title;
  return best;
}

/** YouTube Data API v3 응답을 공통 형태로 바꾼다. 댓글 HTML(<br>, 링크)은 텍스트로 바꾼다. */
export function toYoutubeSources(video: unknown, threads: unknown): YoutubeSources {
  const item = (video as { items?: { snippet?: { title?: string; description?: string; channelId?: string } }[] })?.items?.[0]?.snippet;
  const threadItems = (threads as { items?: unknown[] })?.items ?? [];
  const comments = threadItems
    .map((t) => (t as { snippet?: { topLevelComment?: { snippet?: { textDisplay?: string; textOriginal?: string; authorChannelId?: { value?: string }; likeCount?: number } } } }).snippet?.topLevelComment?.snippet)
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => ({
      text: c.textOriginal ?? (c.textDisplay ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''),
      authorChannelId: c.authorChannelId?.value,
      likeCount: c.likeCount ?? 0,
    }));
  return { title: item?.title, channelId: item?.channelId, description: item?.description, comments };
}
