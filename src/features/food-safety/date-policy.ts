import type { DateType } from '@/domain/models';

/**
 * 기한처럼 읽는 날짜. 포장 표시 기한 3종과, 사용자 요청으로 추가한 구매일 기준 추정 기한(D-17).
 * 제조일·구입일 자체는 절대 여기에 넣지 않는다.
 */
const LABEL_DEADLINE_TYPES: DateType[] = ['USE_BY', 'SELL_BY', 'BEST_BEFORE', 'ESTIMATED_FROM_PURCHASE'];

export function isLabelDeadline(type: DateType | undefined): boolean {
  return !!type && LABEL_DEADLINE_TYPES.includes(type);
}

export const DATE_TYPE_LABELS: Record<DateType, string> = {
  USE_BY: '소비기한',
  SELL_BY: '유통기한',
  BEST_BEFORE: '품질유지기한',
  MANUFACTURED_ON: '제조일자',
  PACKED_ON: '포장일자',
  PURCHASED_ON: '구입일',
  RECEIVED_ON: '받은 날짜',
  OPENED_ON: '개봉일',
  COOKED_ON: '조리일',
  PERSONAL_REMINDER: '내 관리 알림',
  ESTIMATED_FROM_PURCHASE: '추정 보관 기한',
  UNKNOWN: '종류 확인 필요',
};

/** OCR 확인 화면과 직접 입력에서 고를 수 있는 포장 표시 날짜 종류. */
export const SELECTABLE_LABEL_TYPES: DateType[] = ['USE_BY', 'SELL_BY', 'BEST_BEFORE', 'MANUFACTURED_ON', 'PACKED_ON'];

/**
 * 구매일 기준 추정 기한은 storage-estimate.ts 한 곳에서만, 출처가 있는 품목 데이터로 계산한다.
 * `반찬 = N일`, `냉동 = 연장` 같은 일괄 규칙은 두지 않는다. 포장 표시 날짜가 있으면 그 날짜가 우선한다.
 */
