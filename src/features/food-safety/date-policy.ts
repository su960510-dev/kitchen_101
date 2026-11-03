import type { DateType } from '@/domain/models';

/** 포장에 인쇄되어 기한처럼 읽는 날짜. 제조일·구입일 등은 절대 여기에 넣지 않는다. */
const LABEL_DEADLINE_TYPES: DateType[] = ['USE_BY', 'SELL_BY', 'BEST_BEFORE'];

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
  UNKNOWN: '종류 확인 필요',
};

/** OCR 확인 화면과 직접 입력에서 고를 수 있는 포장 표시 날짜 종류. */
export const SELECTABLE_LABEL_TYPES: DateType[] = ['USE_BY', 'SELL_BY', 'BEST_BEFORE', 'MANUFACTURED_ON', 'PACKED_ON'];

/**
 * 자동 기한 산출 금지(§2.3): 이 모듈에는 `구입일 + N일`, `반찬 = N일`, `냉동 = 연장` 같은
 * 계산을 두지 않는다. 참고 기간을 추가하려면 reference-guidance.ts 의 검수 절차를 따른다.
 */
