import { isDateOnly, type DateOnly } from '@/domain/date-only';
import { AppError } from '@/domain/errors';
import type { DateType } from '@/domain/models';

/** 사용자가 OCR 확인 화면에서 직접 고른 값. 이 타입을 거치지 않으면 OCR 날짜를 저장할 수 없다. */
export interface ConfirmedLabelDate {
  labelDate: DateOnly;
  labelDateType: DateType;
  dateSource: 'OCR_CONFIRMED';
}

export function confirmLabelDate(input: { date?: string; type?: DateType; userConfirmed: boolean }): ConfirmedLabelDate {
  if (!input.userConfirmed) throw new AppError('unconfirmed-date', '날짜를 확인한 뒤 저장해 주세요.');
  if (!isDateOnly(input.date)) throw new AppError('validation', '날짜를 다시 확인해 주세요.');
  if (!input.type || input.type === 'UNKNOWN') throw new AppError('unconfirmed-date', '날짜 종류를 선택해 주세요.');
  return { labelDate: input.date, labelDateType: input.type, dateSource: 'OCR_CONFIRMED' };
}
