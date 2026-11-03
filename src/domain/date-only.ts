/**
 * 날짜 전용(`YYYY-MM-DD`) 유틸. 식품 날짜는 시각이 없는 값이라 UTC timestamp로 바꾸지 않는다.
 * "오늘"은 KST 고정(+09:00)으로 계산한다. 포장에 인쇄된 한국 날짜와 맞추기 위함이며,
 * 기기 시간대가 달라도 표시 날짜가 하루 밀리지 않는다. (docs/DECISIONS.md D-05)
 */
export type DateOnly = string;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function isValidYmd(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

export function toDateOnly(year: number, month: number, day: number): DateOnly | null {
  if (!isValidYmd(year, month, day)) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== 'string') return false;
  const m = PATTERN.exec(value);
  return !!m && isValidYmd(Number(m[1]), Number(m[2]), Number(m[3]));
}

function toEpochDay(date: DateOnly): number {
  const m = PATTERN.exec(date);
  if (!m) throw new Error('invalid date-only value');
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS);
}

function fromEpochDay(day: number): DateOnly {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function todayKst(now: Date = new Date()): DateOnly {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: DateOnly, days: number): DateOnly {
  return fromEpochDay(toEpochDay(date) + days);
}

/** `to - from` 일수. 양수면 `to`가 미래. */
export function diffDays(from: DateOnly, to: DateOnly): number {
  return toEpochDay(to) - toEpochDay(from);
}

export function weekdayKo(date: DateOnly): string {
  return WEEKDAYS[new Date(toEpochDay(date) * DAY_MS).getUTCDay()];
}

/** `10.30 (금)` */
export function formatMonthDay(date: DateOnly): string {
  return `${date.slice(5, 7)}.${date.slice(8, 10)} (${weekdayKo(date)})`;
}

/** `2026.11.05 (목)` */
export function formatFull(date: DateOnly): string {
  return `${date.slice(0, 4)}.${date.slice(5, 7)}.${date.slice(8, 10)} (${weekdayKo(date)})`;
}

/** 해당 날짜 09:00 KST의 절대 시각(알림 예약용). */
export function kstMorning(date: DateOnly, hour = 9): Date {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+09:00`);
}
