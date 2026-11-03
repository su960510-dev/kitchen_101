import { addDays, diffDays, formatFull, formatMonthDay, isDateOnly, isValidYmd, kstMorning, todayKst, toDateOnly } from '@/domain/date-only';

describe('date-only', () => {
  it('rejects impossible calendar dates', () => {
    expect(isValidYmd(2026, 2, 30)).toBe(false);
    expect(toDateOnly(2026, 13, 1)).toBeNull();
    expect(isDateOnly('2026-02-30')).toBe(false);
    expect(isDateOnly('2028-02-29')).toBe(true);
  });

  it('keeps the KST date across the UTC midnight boundary', () => {
    expect(todayKst(new Date('2026-11-02T14:59:59Z'))).toBe('2026-11-02');
    expect(todayKst(new Date('2026-11-02T15:00:00Z'))).toBe('2026-11-03');
  });

  it('computes day differences without timezone drift', () => {
    expect(diffDays('2026-10-30', '2026-11-05')).toBe(6);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('formats with the real weekday', () => {
    expect(formatMonthDay('2026-10-30')).toBe('10.30 (금)');
    expect(formatFull('2026-11-05')).toBe('2026.11.05 (목)');
  });

  it('builds the 09:00 KST instant', () => {
    expect(kstMorning('2026-11-05').toISOString()).toBe('2026-11-05T00:00:00.000Z');
  });
});
