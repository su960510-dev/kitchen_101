import type { FoodInventoryItem } from '@/domain/models';
import { diffSchedule, MAX_SCHEDULED, planNotifications, reconcileNotifications, type NotificationPort, type PlannedNotification } from '@/features/notifications/notification-reconciler';

const now = new Date('2026-11-03T03:00:00Z'); // 12:00 KST
const item = (over: Partial<FoodInventoryItem>): FoodInventoryItem => ({
  id: 'a',
  name: '두부',
  category: 'PACKAGED',
  storageLocation: 'FRIDGE',
  notifyEnabled: true,
  isMomSideDish: false,
  isOpened: false,
  isSample: false,
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('planNotifications', () => {
  it('schedules only when the user opted in', () => {
    expect(planNotifications([item({ notifyEnabled: false, labelDate: '2026-11-10', labelDateType: 'USE_BY' })], 3, now)).toHaveLength(0);
  });

  it('does not schedule for samples or finished items', () => {
    const base = { labelDate: '2026-11-10', labelDateType: 'USE_BY' as const };
    expect(planNotifications([item({ ...base, isSample: true }), item({ ...base, consumedAt: 'x' }), item({ ...base, discardedAt: 'x' })], 3, now)).toHaveLength(0);
  });

  it('fires lead days before at 09:00 KST', () => {
    const [p] = planNotifications([item({ labelDate: '2026-11-10', labelDateType: 'USE_BY' })], 3, now);
    expect(p.fireAt.toISOString()).toBe('2026-11-07T00:00:00.000Z');
    expect(p.kind).toBe('LABEL');
  });

  it('moves a passed lead day to the next morning', () => {
    const [p] = planNotifications([item({ labelDate: '2026-11-05', labelDateType: 'USE_BY' })], 7, now);
    expect(p.fireAt.toISOString()).toBe('2026-11-04T00:00:00.000Z');
  });

  it('skips dates already passed', () => {
    expect(planNotifications([item({ labelDate: '2026-11-01', labelDateType: 'USE_BY' })], 3, now)).toHaveLength(0);
  });

  it('does not notify for non-deadline date types', () => {
    expect(planNotifications([item({ labelDate: '2026-11-10', labelDateType: 'MANUFACTURED_ON' })], 3, now)).toHaveLength(0);
  });

  it('uses different copy for label dates and personal reminders', () => {
    const plans = planNotifications([item({ labelDate: '2026-11-10', labelDateType: 'USE_BY', personalReminderDate: '2026-11-08' })], 3, now);
    const label = plans.find((p) => p.kind === 'LABEL')!;
    const personal = plans.find((p) => p.kind === 'PERSONAL')!;
    expect(label.body).toContain('소비기한');
    expect(personal.body).toContain('내가 설정한');
    expect(personal.body).not.toContain('소비기한');
  });

  it('never exposes the OCR text or note', () => {
    const [p] = planNotifications([item({ labelDate: '2026-11-10', labelDateType: 'USE_BY', ocrText: 'SECRET', note: 'SECRET' })], 3, now);
    expect(p.title + p.body).not.toContain('SECRET');
  });

  it('caps the number of schedules under the iOS limit, nearest first', () => {
    const many = Array.from({ length: 100 }, (_, i) => item({ id: `i${i}`, labelDate: `2027-0${(i % 9) + 1}-15`, labelDateType: 'USE_BY' }));
    expect(planNotifications(many, 3, now)).toHaveLength(MAX_SCHEDULED);
  });
});

describe('reconcile', () => {
  const plan = { identifier: 'keep', itemId: 'a', kind: 'LABEL', fireAt: now, title: '', body: '' } as PlannedNotification;

  it('computes the diff', () => {
    expect(diffSchedule([plan], ['keep', 'old'])).toEqual({ toSchedule: [], toCancel: ['old'] });
  });

  function fakePort(initial: string[]): NotificationPort & { ids: Set<string> } {
    const ids = new Set(initial);
    return {
      ids,
      scheduledIdentifiers: async () => [...ids],
      schedule: async (p) => void ids.add(p.identifier),
      cancel: async (id) => void ids.delete(id),
    };
  }

  it('reschedules when the date changes and cancels when consumed', async () => {
    const port = fakePort([]);
    await reconcileNotifications([item({ labelDate: '2026-11-10', labelDateType: 'USE_BY' })], 3, port, now);
    const first = [...port.ids];
    expect(first).toHaveLength(1);

    await reconcileNotifications([item({ labelDate: '2026-11-12', labelDateType: 'USE_BY' })], 3, port, now);
    expect([...port.ids]).not.toEqual(first);
    expect(port.ids.size).toBe(1);

    await reconcileNotifications([item({ labelDate: '2026-11-12', labelDateType: 'USE_BY', consumedAt: 'x' })], 3, port, now);
    expect(port.ids.size).toBe(0);
  });
});
