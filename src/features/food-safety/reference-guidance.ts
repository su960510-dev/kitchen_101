import type { InventoryCategory, StorageLocation } from '@/domain/models';

/**
 * 품목별 구매 후 보관 기간. 사용자 요청(2026-11-10)으로 구매일 기준 추정 기한을 자동 설정한다(DECISIONS D-17).
 * 공개 출처에서 확인한 값만 넣는다. 출처 없는 수치를 추가하지 않으며 scripts/verify-food-guidance.ts 가 검사한다.
 * 기간이 범위로 주어지면 짧은 쪽을 쓴다. 이 값은 안전을 보증하지 않는다.
 */
export interface StorageGuidance {
  id: string;
  /** 한국어 품목명(정규화 전). 첫 번째가 대표 이름. */
  names: string[];
  category: InventoryCategory;
  /** 구매일로부터의 일수. 출처에 없는 보관 방법은 비워 두고 추정하지 않는다. */
  days: Partial<Record<StorageLocation, number>>;
  sourceName: string;
  sourceItem: string;
  sourceUrl: string;
  lastVerifiedOn: string;
}

export const STORAGE_GUIDANCE: StorageGuidance[] = [];
