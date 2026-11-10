import { addDays, type DateOnly } from '@/domain/date-only';
import type { StorageLocation } from '@/domain/models';
import { normalizeIngredient } from '@/features/fridge-matching/ingredient-normalizer';

import { STORAGE_GUIDANCE, type StorageGuidance } from './reference-guidance';

export interface StorageEstimate {
  date: DateOnly;
  days: number;
  guidanceId: string;
  sourceName: string;
}

export function findGuidance(name: string, guidance: StorageGuidance[] = STORAGE_GUIDANCE): StorageGuidance | undefined {
  const id = normalizeIngredient(name);
  return guidance.find((g) => g.names.some((n) => normalizeIngredient(n) === id));
}

/** 구매일 + 품목·보관 방법별 기간. 해당 데이터가 없으면 null 이며 날짜를 만들지 않는다. */
export function estimateFromPurchase(
  input: { name: string; storageLocation: StorageLocation; purchaseDate?: DateOnly },
  guidance: StorageGuidance[] = STORAGE_GUIDANCE,
): StorageEstimate | null {
  if (!input.purchaseDate) return null;
  const g = findGuidance(input.name, guidance);
  const days = g?.days[input.storageLocation];
  if (!g || days == null) return null;
  return { date: addDays(input.purchaseDate, days), days, guidanceId: g.id, sourceName: g.sourceName };
}
