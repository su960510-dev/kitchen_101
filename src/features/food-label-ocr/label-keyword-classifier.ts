import type { DateType } from '@/domain/models';

/** OCR 원문에서 띄어쓰기가 깨져도 잡을 수 있게 글자 사이 공백을 허용한다. */
function spaced(word: string): string {
  return word.split('').join('\\s*');
}

const RULES: { type: DateType; words: string[] }[] = [
  { type: 'USE_BY', words: ['소비기한', '소비기간'] },
  { type: 'SELL_BY', words: ['유통기한', '유통기간'] },
  { type: 'BEST_BEFORE', words: ['품질유지기한', '품질유지'] },
  { type: 'MANUFACTURED_ON', words: ['제조일자', '제조일', '제조년월일', '제조'] },
  { type: 'PACKED_ON', words: ['포장일자', '포장일', '가공일자', '가공일'] },
  { type: 'PURCHASED_ON', words: ['구입일', '구매일'] },
  { type: 'OPENED_ON', words: ['개봉일'] },
];

const KEYWORD_PATTERN = new RegExp(
  RULES.flatMap((r) => r.words)
    .sort((a, b) => b.length - a.length)
    .map(spaced)
    .join('|'),
  'g',
);

export interface KeywordHit {
  type: DateType;
  index: number;
  end: number;
}

export function findKeywords(text: string): KeywordHit[] {
  const hits: KeywordHit[] = [];
  for (const m of text.matchAll(KEYWORD_PATTERN)) {
    const word = m[0].replace(/\s/g, '');
    const rule = RULES.find((r) => r.words.includes(word));
    if (rule) hits.push({ type: rule.type, index: m.index, end: m.index + m[0].length });
  }
  return hits;
}

export type LabelNotice = 'SEE_SEPARATE_MARKING' | 'OPENED_STORAGE_GUIDANCE';

export function findNotices(text: string): LabelNotice[] {
  const notices: LabelNotice[] = [];
  if (/별도\s*표[기시]/.test(text)) notices.push('SEE_SEPARATE_MARKING');
  if (/개봉\s*후/.test(text)) notices.push('OPENED_STORAGE_GUIDANCE');
  return notices;
}
