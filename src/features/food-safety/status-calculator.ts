import { diffDays, type DateOnly } from '@/domain/date-only';
import type { FoodInventoryItem, InventoryStatus } from '@/domain/models';

import { isLabelDeadline } from './date-policy';

type StatusInput = Pick<FoodInventoryItem, 'labelDate' | 'labelDateType' | 'personalReminderDate' | 'isOpened'>;

export interface StatusResult {
  /** 대표 상태. 표시 날짜가 충분히 남은 경우 null. */
  primary: InventoryStatus | null;
  /** 해당되는 모든 상태(상세 화면 안내용). 표시 날짜 → 개인 알림 → 개봉 순. */
  all: InventoryStatus[];
  /** 포장 표시 기한까지 남은 일수. 표시 기한이 없으면 null. */
  labelDaysLeft: number | null;
  /** 개인 관리 알림일까지 남은 일수. 없으면 null. */
  reminderDaysLeft: number | null;
}

export function computeStatus(item: StatusInput, today: DateOnly, leadDays: number): StatusResult {
  const all: InventoryStatus[] = [];
  const hasDeadline = !!item.labelDate && isLabelDeadline(item.labelDateType);
  const labelDaysLeft = hasDeadline ? diffDays(today, item.labelDate!) : null;
  const reminderDaysLeft = item.personalReminderDate ? diffDays(today, item.personalReminderDate) : null;

  if (labelDaysLeft != null) {
    if (labelDaysLeft < 0) all.push('EXPIRED_LABEL_DATE');
    else if (labelDaysLeft === 0) all.push('LABEL_DATE_TODAY');
    else if (labelDaysLeft <= leadDays) all.push('LABEL_DATE_SOON');
  } else if (item.labelDate && item.labelDateType === 'UNKNOWN') {
    // 종류가 확정되지 않은 날짜는 임박/경과로 계산하지 않는다.
    all.push('DATE_UNCONFIRMED');
  }
  if (reminderDaysLeft != null && reminderDaysLeft <= leadDays) all.push('PERSONAL_REMINDER_DUE');
  if (item.isOpened) all.push('OPENED_CHECK_REQUIRED');
  if (labelDaysLeft == null && reminderDaysLeft == null && !all.includes('DATE_UNCONFIRMED')) all.push('NO_DATE');

  const primary = all.find((s) => s !== 'OPENED_CHECK_REQUIRED' || all.length === 1) ?? null;
  return { primary, all, labelDaysLeft, reminderDaysLeft };
}

/** 대시보드에서 "확인이 필요한 항목"으로 묶는 상태. 날짜 미등록은 위험 상태가 아니다. */
export function isAttentionStatus(status: InventoryStatus | null): boolean {
  return status === 'EXPIRED_LABEL_DATE' || status === 'LABEL_DATE_TODAY' || status === 'LABEL_DATE_SOON' || status === 'PERSONAL_REMINDER_DUE';
}
