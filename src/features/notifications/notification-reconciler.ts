import { addDays, diffDays, kstMorning, todayKst, type DateOnly } from '@/domain/date-only';
import type { FoodInventoryItem } from '@/domain/models';
import { DATE_TYPE_LABELS, isLabelDeadline } from '@/features/food-safety/date-policy';

/** iOS는 앱당 예약 알림을 64개로 제한한다. 여유를 두고 가까운 순으로만 예약한다. */
export const MAX_SCHEDULED = 60;

export interface PlannedNotification {
  /** 항목·종류·발송일을 담아 날짜가 바뀌면 다른 식별자가 된다. */
  identifier: string;
  itemId: string;
  kind: 'LABEL' | 'PERSONAL';
  fireAt: Date;
  title: string;
  body: string;
}

export interface NotificationPort {
  scheduledIdentifiers(): Promise<string[]>;
  schedule(plan: PlannedNotification): Promise<void>;
  cancel(identifier: string): Promise<void>;
}

function nextFireDay(target: DateOnly, leadDays: number, now: Date): DateOnly | null {
  const today = todayKst(now);
  if (diffDays(today, target) < 0) return null;
  const preferred = addDays(target, -leadDays);
  const candidate = diffDays(today, preferred) >= 0 ? preferred : today;
  if (kstMorning(candidate).getTime() > now.getTime()) return candidate;
  const tomorrow = addDays(candidate, 1);
  return diffDays(tomorrow, target) >= 0 ? tomorrow : null;
}

/** 재고에서 있어야 할 알림을 계산한다. 문구에 OCR 원문이나 메모를 넣지 않는다. */
export function planNotifications(items: FoodInventoryItem[], leadDays: number, now = new Date()): PlannedNotification[] {
  const plans: PlannedNotification[] = [];
  for (const item of items) {
    if (!item.notifyEnabled || item.isSample || item.consumedAt || item.discardedAt) continue;
    if (item.labelDate && isLabelDeadline(item.labelDateType)) {
      const day = nextFireDay(item.labelDate, leadDays, now);
      if (day) {
        const label = DATE_TYPE_LABELS[item.labelDateType!];
        plans.push({
          identifier: `label:${item.id}:${item.labelDate}:${day}`,
          itemId: item.id,
          kind: 'LABEL',
          fireAt: kstMorning(day),
          title: `${item.name} 포장 표시 날짜 확인`,
          body: `${label} ${item.labelDate}. 제품 표시와 보관 조건을 확인하세요.`,
        });
      }
    }
    if (item.personalReminderDate) {
      const day = nextFireDay(item.personalReminderDate, 0, now);
      if (day) {
        plans.push({
          identifier: `personal:${item.id}:${item.personalReminderDate}:${day}`,
          itemId: item.id,
          kind: 'PERSONAL',
          fireAt: kstMorning(day),
          title: `${item.name} 관리 알림`,
          body: '내가 설정한 관리 알림 날짜예요.',
        });
      }
    }
  }
  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_SCHEDULED);
}

export function diffSchedule(planned: PlannedNotification[], existing: string[]): { toSchedule: PlannedNotification[]; toCancel: string[] } {
  const wanted = new Set(planned.map((p) => p.identifier));
  const present = new Set(existing);
  return {
    toSchedule: planned.filter((p) => !present.has(p.identifier)),
    toCancel: existing.filter((id) => !wanted.has(id)),
  };
}

/** 앱 시작과 재고 변경 후 DB 기준으로 OS 예약 상태를 맞춘다. */
export async function reconcileNotifications(items: FoodInventoryItem[], leadDays: number, port: NotificationPort, now = new Date()): Promise<void> {
  const { toSchedule, toCancel } = diffSchedule(planNotifications(items, leadDays, now), await port.scheduledIdentifiers());
  for (const id of toCancel) await port.cancel(id);
  for (const plan of toSchedule) await port.schedule(plan);
}
