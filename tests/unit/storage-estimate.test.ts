import type { StorageGuidance } from '@/features/food-safety/reference-guidance';
import { computeStatus } from '@/features/food-safety/status-calculator';
import { statusMessage } from '@/features/food-safety/safety-copy';
import { estimateFromPurchase } from '@/features/food-safety/storage-estimate';
import { buildItem } from '@/features/inventory/inventory-service';
import { planNotifications } from '@/features/notifications/notification-reconciler';

// 테스트 전용 값. 실제 데이터는 reference-guidance.ts 의 출처 있는 값만 쓴다.
const guidance: StorageGuidance[] = [
  { id: 'test-tomato', names: ['토마토'], category: 'VEGETABLE', days: { FRIDGE: 5 }, sourceName: '테스트', sourceItem: 'x', sourceUrl: 'https://example.test', lastVerifiedOn: '2026-11-10' },
];
const base = { name: '토마토', category: 'VEGETABLE' as const, storageLocation: 'FRIDGE' as const };

describe('estimateFromPurchase', () => {
  it('adds the item-specific days to the purchase date', () => {
    expect(estimateFromPurchase({ ...base, purchaseDate: '2026-11-10' }, guidance)).toMatchObject({ date: '2026-11-15', days: 5 });
  });
  it('makes no date without data for the item or storage', () => {
    expect(estimateFromPurchase({ ...base, name: '김치', purchaseDate: '2026-11-10' }, guidance)).toBeNull();
    expect(estimateFromPurchase({ ...base, storageLocation: 'FREEZER', purchaseDate: '2026-11-10' }, guidance)).toBeNull();
    expect(estimateFromPurchase({ ...base }, guidance)).toBeNull();
  });
  it('matches through synonyms', () => {
    expect(estimateFromPurchase({ ...base, name: '방울토마토', purchaseDate: '2026-11-10' }, guidance)?.date).toBe('2026-11-15');
  });
});

describe('buildItem with estimates', () => {
  it('fills an estimated date only when there is no label date', () => {
    const item = buildItem({ ...base, purchaseDate: '2026-11-10' }, null, new Date(), guidance);
    expect(item).toMatchObject({ labelDate: '2026-11-15', labelDateType: 'ESTIMATED_FROM_PURCHASE', dateSource: 'AUTO_ESTIMATE' });
    const labeled = buildItem({ ...base, purchaseDate: '2026-11-10', labelDate: '2026-11-20', labelDateType: 'USE_BY' }, null, new Date(), guidance);
    expect(labeled).toMatchObject({ labelDate: '2026-11-20', labelDateType: 'USE_BY', dateSource: 'MANUAL' });
  });
  it('respects opt-out and never applies to 엄마표 반찬', () => {
    expect(buildItem({ ...base, purchaseDate: '2026-11-10', autoEstimate: false }, null, new Date(), guidance).labelDate).toBeUndefined();
    expect(buildItem({ ...base, purchaseDate: '2026-11-10', isMomSideDish: true, receivedDate: '2026-11-10' }, null, new Date(), guidance).labelDate).toBeUndefined();
  });
  it('recomputes when the purchase date changes', () => {
    const first = buildItem({ ...base, purchaseDate: '2026-11-10' }, null, new Date(), guidance);
    const next = buildItem({ ...base, id: first.id, purchaseDate: '2026-11-12' }, first, new Date(), guidance);
    expect(next.labelDate).toBe('2026-11-17');
  });
  it('flows into status, copy and notifications as its own type', () => {
    const item = buildItem({ ...base, purchaseDate: '2026-11-10', notifyEnabled: true }, null, new Date(), guidance);
    expect(computeStatus(item, '2026-11-16', 3).primary).toBe('EXPIRED_LABEL_DATE');
    expect(statusMessage('EXPIRED_LABEL_DATE', item.labelDateType)).toContain('추정 기한');
    const [plan] = planNotifications([item], 3, new Date('2026-11-10T03:00:00Z'));
    expect(plan.body).toContain('추정 보관 기한');
  });
});
