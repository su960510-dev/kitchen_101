import type { DateType, InventoryStatus } from '@/domain/models';

import { DATE_TYPE_LABELS } from './date-policy';

function josaIGa(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${word}${hasBatchim ? '이' : '가'}`;
}

/** 상태 안내 문구. 안전을 판정하지 않고, 표시 확인을 안내한다. */
export function statusMessage(status: InventoryStatus, labelType?: DateType): string {
  const label = labelType ? DATE_TYPE_LABELS[labelType] : '표시 날짜';
  switch (status) {
    case 'EXPIRED_LABEL_DATE':
      return `표시된 ${josaIGa(label)} 지났어요. 제품 표시와 보관 지침을 확인하세요.`;
    case 'LABEL_DATE_TODAY':
      return '오늘 표시 날짜예요. 포장 상태와 보관 조건을 확인하세요.';
    case 'LABEL_DATE_SOON':
      return `표시된 ${josaIGa(label)} 다가와요. 제품 표시와 보관 조건을 확인하세요.`;
    case 'PERSONAL_REMINDER_DUE':
      return '내가 설정한 관리 알림 날짜가 다가와요.';
    case 'NO_DATE':
      return '날짜 미등록 항목이에요. 필요하면 직접 입력해 주세요.';
    case 'DATE_UNCONFIRMED':
      return '날짜를 확인하지 못했어요. 직접 입력해 주세요.';
    case 'OPENED_CHECK_REQUIRED':
      return '개봉 후에는 포장지 날짜만으로 안전이 보장되지 않을 수 있어요. 제조사 보관 지침을 확인하세요.';
  }
}

export const SAFETY_COPY = {
  appCannotInspect: '앱은 냄새·곰팡이·온도 이탈·오염 같은 식품의 실제 상태를 검사할 수 없어요. 먹기 전에 직접 확인해 주세요.',
  ocrIsCandidate: '인식된 날짜는 후보일 뿐이에요. 포장을 직접 보고 날짜와 종류를 확인한 뒤 저장해 주세요.',
  personalReminderNote: '관리 알림은 내가 정한 일정이에요. 안전을 보증하는 날짜가 아니에요.',
  momSideDishNote: '엄마표는 출처 표시예요. 신선도나 안전을 보증하지 않아요. 알림 날짜는 직접 정해 주세요.',
  fridgePickNote: '추천은 등록된 재료와 내 레시피를 비교한 결과예요. 실제 섭취 안전을 보장하지 않아요.',
  sampleNote: '예시 데이터예요. 표시된 날짜는 화면 설명용이며 실제 식품 날짜가 아니에요.',
  allergyNote: '알레르기 안전을 보증하지 않아요. 포장 표시를 꼭 확인해 주세요.',
} as const;

/** 목록 뱃지 문구. */
export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${-daysLeft}일 지남`;
  if (daysLeft === 0) return '오늘';
  return `${daysLeft}일 후`;
}
