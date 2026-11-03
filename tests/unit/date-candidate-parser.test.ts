import { parseLabelLines, suggestProductNames } from '@/features/food-label-ocr/date-candidate-parser';
import { confirmLabelDate } from '@/features/food-label-ocr/ocr-review-service';

const lines = (...texts: string[]) => texts.map((text) => ({ text }));

describe('parseLabelLines', () => {
  it.each([
    ['2026.11.03'],
    ['2026-11-03'],
    ['2026/11/03'],
    ['2026년 11월 3일까지'],
    ['20261103'],
  ])('reads %s as a value but leaves the type unknown', (text) => {
    const { candidates } = parseLabelLines(lines(text));
    expect(candidates).toHaveLength(1);
    expect(candidates[0].candidateDate).toBe('2026-11-03');
    expect(candidates[0].candidateDateType).toBe('UNKNOWN');
    expect(candidates[0].confirmed).toBe(false);
  });

  it('links nearby keywords and keeps both dates apart', () => {
    const { candidates } = parseLabelLines(lines('소비기한 2026.11.03 / 제조일 2026.10.20'));
    const byDate = Object.fromEntries(candidates.map((c) => [c.candidateDate, c.candidateDateType]));
    expect(byDate).toEqual({ '2026-11-03': 'USE_BY', '2026-10-20': 'MANUFACTURED_ON' });
  });

  it('does not confuse 제조일 with 소비기한 across lines', () => {
    const { candidates } = parseLabelLines(lines('제조일 2026.10.20', '소비기한 2026.11.03'));
    expect(candidates.find((c) => c.candidateDate === '2026-10-20')?.candidateDateType).toBe('MANUFACTURED_ON');
    expect(candidates.find((c) => c.candidateDate === '2026-11-03')?.candidateDateType).toBe('USE_BY');
  });

  it('preserves 유통기한 instead of rewriting it to 소비기한', () => {
    expect(parseLabelLines(lines('유통기한 2026.11.05 까지')).candidates[0].candidateDateType).toBe('SELL_BY');
  });

  it('links a keyword on the neighboring line by geometry', () => {
    const { candidates } = parseLabelLines([
      { text: '소비기한', boundingBox: { x: 0.1, y: 0.2, width: 0.2, height: 0.04 } },
      { text: '2026.11.03', boundingBox: { x: 0.1, y: 0.25, width: 0.3, height: 0.04 } },
      { text: '제조원 주식회사', boundingBox: { x: 0.1, y: 0.8, width: 0.3, height: 0.04 } },
    ]);
    expect(candidates[0].candidateDateType).toBe('USE_BY');
  });

  it('ignores a far-away keyword', () => {
    const { candidates } = parseLabelLines([
      { text: '소비기한', boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.03 } },
      { text: '2026.11.03', boundingBox: { x: 0.1, y: 0.8, width: 0.3, height: 0.03 } },
    ]);
    expect(candidates[0].candidateDateType).toBe('UNKNOWN');
  });

  it('rejects impossible dates', () => {
    const { candidates, rejected } = parseLabelLines(lines('소비기한 2026.02.30'));
    expect(candidates).toHaveLength(0);
    expect(rejected).toEqual(['2026.02.30']);
  });

  it('never decides the century of a 2-digit year', () => {
    const [c] = parseLabelLines(lines('소비기한 26.11.03')).candidates;
    expect(c.candidateDate).toBeUndefined();
    expect(c.needsYearConfirmation).toBe(true);
    expect(c.suggestedDate).toBe('2026-11-03');
  });

  it('shows every date when there are several', () => {
    expect(parseLabelLines(lines('2026.11.03 2026.12.01', '2027.01.01')).candidates).toHaveLength(3);
  });

  it('ignores barcode digits', () => {
    expect(parseLabelLines(lines('8801234567890')).candidates).toHaveLength(0);
  });

  it('surfaces 별도표기 and 개봉 후 notices without inventing a date', () => {
    const { candidates, notices } = parseLabelLines(lines('별도표기일까지', '개봉 후 냉장보관'));
    expect(candidates).toHaveLength(0);
    expect(notices).toEqual(['SEE_SEPARATE_MARKING', 'OPENED_STORAGE_GUIDANCE']);
  });

  it('tolerates broken spacing inside keywords', () => {
    expect(parseLabelLines(lines('소 비 기 한: 2026.11.03')).candidates[0].candidateDateType).toBe('USE_BY');
  });

  it('suggests product names without dates or barcodes', () => {
    expect(suggestProductNames(lines('소비기한 2026.11.03', '8801234567890', '맛있는 두부', '냉장보관'))).toEqual(['맛있는 두부']);
  });
});

describe('confirmLabelDate', () => {
  it('refuses to save without user confirmation', () => {
    expect(() => confirmLabelDate({ date: '2026-11-03', type: 'USE_BY', userConfirmed: false })).toThrow('확인');
  });
  it('refuses an unknown type', () => {
    expect(() => confirmLabelDate({ date: '2026-11-03', type: 'UNKNOWN', userConfirmed: true })).toThrow('종류');
  });
  it('accepts a confirmed value and tags its source', () => {
    expect(confirmLabelDate({ date: '2026-11-03', type: 'USE_BY', userConfirmed: true })).toEqual({ labelDate: '2026-11-03', labelDateType: 'USE_BY', dateSource: 'OCR_CONFIRMED' });
  });
});
