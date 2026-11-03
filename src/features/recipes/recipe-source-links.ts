import { AppError } from '@/domain/errors';

/**
 * 외부 레시피 링크. URL과 사용자가 직접 쓴 제목·메모만 저장한다.
 * 페이지 본문·사진·영상·자막을 가져오지 않으며, 저장 시 네트워크 요청을 보내지 않는다.
 */
export function normalizeRecipeUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new AppError('validation', '링크를 입력해 주세요.');
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new AppError('validation', '올바른 링크가 아니에요.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new AppError('validation', 'http 또는 https 링크만 저장할 수 있어요.');
  if (!url.hostname.includes('.')) throw new AppError('validation', '올바른 링크가 아니에요.');
  return url.toString();
}

export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function isYouTube(url: string): boolean {
  return /(^|\.)(youtube\.com|youtu\.be)$/.test(sourceHost(url));
}
