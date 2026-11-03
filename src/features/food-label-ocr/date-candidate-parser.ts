import { toDateOnly } from '@/domain/date-only';
import type { DateType, OcrCandidate } from '@/domain/models';

import { findKeywords, findNotices, type LabelNotice } from './label-keyword-classifier';
import type { OcrTextLine } from './ocr-contracts';

/**
 * OCR 라인에서 날짜 값과 날짜 유형 후보를 뽑는다. 무엇도 확정하지 않는다.
 * confirmed 는 항상 false 이고, 주변 키워드가 없으면 UNKNOWN 으로 둔다.
 */
export interface ParsedLabel {
  candidates: OcrCandidate[];
  /** 달력에 없는 날짜처럼 거부한 원문. */
  rejected: string[];
  notices: LabelNotice[];
}

interface RawMatch {
  index: number;
  end: number;
  text: string;
  date?: string;
  suggested?: string;
  invalid: boolean;
  ambiguous: boolean;
}

const FULL = /(?<!\d)(\d{4})\s*(?:[.\-/]|년)\s*(\d{1,2})\s*(?:[.\-/]|월)\s*(\d{1,2})\s*일?(?!\d)/g;
const SHORT = /(?<!\d)(\d{2})\s*(?:[.\-/]|년)\s*(\d{1,2})\s*(?:[.\-/]|월)\s*(\d{1,2})\s*일?(?!\d)/g;
const COMPACT = /(?<!\d)(20\d{2})(\d{2})(\d{2})(?!\d)/g;

function findDates(text: string): RawMatch[] {
  const matches: RawMatch[] = [];
  const overlaps = (i: number, e: number) => matches.some((m) => i < m.end && e > m.index);
  for (const pattern of [FULL, COMPACT]) {
    for (const m of text.matchAll(pattern)) {
      const end = m.index + m[0].length;
      if (overlaps(m.index, end)) continue;
      const date = toDateOnly(Number(m[1]), Number(m[2]), Number(m[3])) ?? undefined;
      matches.push({ index: m.index, end, text: m[0].trim(), date, invalid: !date, ambiguous: false });
    }
  }
  for (const m of text.matchAll(SHORT)) {
    const end = m.index + m[0].length;
    if (overlaps(m.index, end)) continue;
    const suggested = toDateOnly(2000 + Number(m[1]), Number(m[2]), Number(m[3])) ?? undefined;
    matches.push({ index: m.index, end, text: m[0].trim(), suggested, invalid: !suggested, ambiguous: true });
  }
  return matches.sort((a, b) => a.index - b.index);
}

/** 같은 줄에서 날짜와 키워드를 잇는다: 직전 날짜 이후의 가장 가까운 앞 키워드, 없으면 다음 날짜 전 뒤 키워드. */
function typeInSameLine(text: string, dates: RawMatch[], position: number): DateType | null {
  const keywords = findKeywords(text);
  const date = dates[position];
  const prevEnd = position > 0 ? dates[position - 1].end : 0;
  const nextStart = position < dates.length - 1 ? dates[position + 1].index : text.length;
  const before = keywords.filter((k) => k.end <= date.index && k.index >= prevEnd);
  if (before.length) return before[before.length - 1].type;
  const after = keywords.filter((k) => k.index >= date.end && k.end <= nextStart);
  return after.length ? after[0].type : null;
}

/** 키워드만 있는 줄을 좌표(없으면 줄 순서)로 찾아 잇는다. 날짜가 없는 표 형태 라벨 대응. */
function typeFromNeighborLine(lines: OcrTextLine[], lineIndex: number): DateType | null {
  const line = lines[lineIndex];
  const box = line.boundingBox;
  let best: { type: DateType; distance: number } | null = null;
  lines.forEach((other, i) => {
    if (i === lineIndex || findDates(other.text).length > 0) return;
    const keywords = findKeywords(other.text);
    if (!keywords.length) return;
    let distance: number;
    if (box && other.boundingBox) {
      const lineHeight = Math.max(box.height, other.boundingBox.height);
      const dy = Math.abs(box.y + box.height / 2 - (other.boundingBox.y + other.boundingBox.height / 2));
      if (dy > lineHeight * 2.2) return;
      distance = dy;
    } else {
      if (i !== lineIndex - 1) return;
      distance = 1;
    }
    if (!best || distance < best.distance) best = { type: keywords[keywords.length - 1].type, distance };
  });
  return (best as { type: DateType } | null)?.type ?? null;
}

export function parseLabelLines(lines: OcrTextLine[]): ParsedLabel {
  const candidates: (OcrCandidate & { order: number; linked: boolean })[] = [];
  const rejected: string[] = [];
  const notices = new Set<LabelNotice>();
  let order = 0;

  lines.forEach((line, lineIndex) => {
    findNotices(line.text).forEach((n) => notices.add(n));
    const dates = findDates(line.text);
    dates.forEach((date, position) => {
      if (date.invalid) {
        rejected.push(date.text);
        return;
      }
      const type = typeInSameLine(line.text, dates, position) ?? (dates.length === 1 ? typeFromNeighborLine(lines, lineIndex) : null);
      candidates.push({
        id: `ocr-${order}`,
        rawText: line.text,
        candidateDate: date.date,
        candidateDateType: type ?? 'UNKNOWN',
        confidence: line.confidence,
        confirmed: false,
        needsYearConfirmation: date.ambiguous || undefined,
        suggestedDate: date.suggested,
        order: order++,
        linked: !!type,
      });
    });
  });

  candidates.sort((a, b) => Number(b.linked) - Number(a.linked) || (b.confidence ?? 0) - (a.confidence ?? 0) || a.order - b.order);
  return {
    candidates: candidates.map(({ order: _o, linked: _l, ...rest }) => rest),
    rejected,
    notices: [...notices],
  };
}

/** 상품명 입력을 돕는 후보. 날짜·기한 문구·숫자뿐인 줄(바코드 등)은 뺀다. */
export function suggestProductNames(lines: OcrTextLine[], limit = 3): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of lines) {
    const text = line.text.trim();
    if (text.length < 2 || text.length > 30) continue;
    if (findDates(text).length || findKeywords(text).length || findNotices(text).length) continue;
    if (!/[가-힣a-zA-Z]/.test(text) || /까지|보관|원재료|영양|mg|kcal/i.test(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    names.push(text);
    if (names.length >= limit) break;
  }
  return names;
}
