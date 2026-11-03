import type { FoodInventoryItem } from '@/domain/models';
import { computeStatus, isAttentionStatus } from '@/features/food-safety/status-calculator';
import { statusMessage } from '@/features/food-safety/safety-copy';

const today = '2026-11-03';
const base: Pick<FoodInventoryItem, 'isOpened'> = { isOpened: false };

describe('computeStatus', () => {
  it('separates label states', () => {
    expect(computeStatus({ ...base, labelDate: '2026-11-02', labelDateType: 'USE_BY' }, today, 3).primary).toBe('EXPIRED_LABEL_DATE');
    expect(computeStatus({ ...base, labelDate: '2026-11-03', labelDateType: 'SELL_BY' }, today, 3).primary).toBe('LABEL_DATE_TODAY');
    expect(computeStatus({ ...base, labelDate: '2026-11-06', labelDateType: 'BEST_BEFORE' }, today, 3).primary).toBe('LABEL_DATE_SOON');
    expect(computeStatus({ ...base, labelDate: '2026-11-20', labelDateType: 'USE_BY' }, today, 3).primary).toBeNull();
  });

  it.each(['MANUFACTURED_ON', 'PACKED_ON', 'PURCHASED_ON', 'RECEIVED_ON'] as const)('never treats %s as a deadline', (type) => {
    const s = computeStatus({ ...base, labelDate: '2020-01-01', labelDateType: type }, today, 3);
    expect(s.labelDaysLeft).toBeNull();
    expect(s.all).not.toContain('EXPIRED_LABEL_DATE');
  });

  it('marks a date without a confirmed type as unconfirmed, not as expired', () => {
    const s = computeStatus({ ...base, labelDate: '2020-01-01', labelDateType: 'UNKNOWN' }, today, 3);
    expect(s.primary).toBe('DATE_UNCONFIRMED');
    expect(s.all).not.toContain('EXPIRED_LABEL_DATE');
  });

  it('shows no date as 날짜 미등록 and not as an attention state', () => {
    const s = computeStatus(base, today, 3);
    expect(s.primary).toBe('NO_DATE');
    expect(isAttentionStatus(s.primary)).toBe(false);
  });

  it('keeps the personal reminder separate from the label date', () => {
    const s = computeStatus({ ...base, labelDate: '2026-11-20', labelDateType: 'USE_BY', personalReminderDate: '2026-11-04' }, today, 3);
    expect(s.labelDaysLeft).toBe(17);
    expect(s.primary).toBe('PERSONAL_REMINDER_DUE');
  });

  it('does not derive any date from a mom side dish receipt date', () => {
    const s = computeStatus({ ...base, labelDate: undefined, personalReminderDate: undefined }, today, 3);
    expect(s.reminderDaysLeft).toBeNull();
    expect(s.labelDaysLeft).toBeNull();
  });

  it('flags opened items for a storage check', () => {
    const s = computeStatus({ isOpened: true, labelDate: '2026-12-01', labelDateType: 'USE_BY' }, today, 3);
    expect(s.primary).toBe('OPENED_CHECK_REQUIRED');
    expect(statusMessage('OPENED_CHECK_REQUIRED')).toContain('제조사 보관 지침');
  });

  it('uses the printed term in the message and never claims safety', () => {
    expect(statusMessage('EXPIRED_LABEL_DATE', 'USE_BY')).toBe('표시된 소비기한이 지났어요. 제품 표시와 보관 지침을 확인하세요.');
    expect(statusMessage('EXPIRED_LABEL_DATE', 'SELL_BY')).toContain('유통기한이');
  });
});
