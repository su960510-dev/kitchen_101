import type { FoodInventoryItem } from '@/domain/models';
import { attentionBanner } from '@/features/inventory/attention-banner';

const item = (over: Partial<FoodInventoryItem>): FoodInventoryItem => ({
  id: 'a', name: '파프리카', category: 'VEGETABLE', storageLocation: 'FRIDGE', notifyEnabled: false, isMomSideDish: false, isOpened: false, isSample: false, createdAt: '', updatedAt: '', ...over,
});

describe('attentionBanner', () => {
  it('names estimated dates as 추정 보관 기한', () => {
    expect(attentionBanner([item({ labelDate: '2026-11-08', labelDateType: 'ESTIMATED_FROM_PURCHASE' })], '2026-11-10', 7)?.title).toBe('추정 보관 기한이 지났어요!');
    expect(attentionBanner([item({ labelDate: '2026-11-13', labelDateType: 'ESTIMATED_FROM_PURCHASE' })], '2026-11-10', 7)?.title).toBe('3일 후 추정 보관 기한이에요!');
  });
  it('keeps the label wording for printed dates', () => {
    expect(attentionBanner([item({ labelDate: '2026-11-08', labelDateType: 'USE_BY' })], '2026-11-10', 7)?.title).toBe('표시 날짜가 지났어요!');
    expect(attentionBanner([item({ labelDate: '2026-11-10', labelDateType: 'USE_BY' })], '2026-11-10', 7)?.title).toBe('오늘이 표시 날짜예요!');
    expect(attentionBanner([item({ labelDate: '2026-11-13', labelDateType: 'USE_BY' })], '2026-11-10', 7)?.title).toBe('3일 후 표시 날짜예요!');
  });
});
