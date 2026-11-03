import { isDateOnly } from '../date-only';
import { AppError } from '../errors';

const OPTIONAL_DATE_LABEL = '날짜 형식이 올바르지 않아요.';

export function requireName(value: string, label: string): string {
  const name = value.trim();
  if (!name) throw new AppError('validation', `${label}을(를) 입력해 주세요.`);
  if (name.length > 80) throw new AppError('validation', `${label}은(는) 80자 이내로 입력해 주세요.`);
  return name;
}

export function optionalDate(value: string | undefined | null): string | undefined {
  if (value == null || value === '') return undefined;
  if (!isDateOnly(value)) throw new AppError('validation', OPTIONAL_DATE_LABEL);
  return value;
}

export function optionalQuantity(value: number | undefined | null): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value) || value < 0) throw new AppError('validation', '수량은 0 이상의 숫자로 입력해 주세요.');
  return value;
}

export function requirePositiveInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 99) throw new AppError('validation', `${label}은(는) 1~99 사이로 입력해 주세요.`);
  return value;
}

export function newId(prefix = ''): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${random}`;
}
