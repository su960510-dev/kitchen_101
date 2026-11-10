import type { DateOnly } from '@/domain/date-only';
import type { FoodInventoryItem } from '@/domain/models';
import { computeStatus } from '@/features/food-safety/status-calculator';

export interface BannerCopy {
  title: string;
  subtitle: string;
  imageKey?: string;
  imageUri?: string;
}

/** 보드의 "N일 후 ..." 배너. `만료`로 단정하지 않고 표시 날짜·내 알림을 구분해 말한다. */
export function attentionBanner(attention: FoodInventoryItem[], today: DateOnly, leadDays: number): BannerCopy | null {
  const first = attention[0];
  if (!first) return null;
  const s = computeStatus(first, today, leadDays);
  // 구매일로 계산한 날짜는 포장 표시 날짜와 구분해 '추정 보관 기한'이라고 쓴다.
  const kind = first.labelDateType === 'ESTIMATED_FROM_PURCHASE' ? '추정 보관 기한' : '표시 날짜';
  let title: string;
  if (s.labelDaysLeft != null && s.labelDaysLeft < 0) title = `${kind}이 지났어요!`.replace('날짜이', '날짜가');
  else if (s.labelDaysLeft === 0) title = `오늘이 ${kind}이에요!`.replace('날짜이에요', '날짜예요');
  else if (s.labelDaysLeft != null && s.all.includes('LABEL_DATE_SOON')) title = `${s.labelDaysLeft}일 후 ${kind}이에요!`.replace('날짜이에요', '날짜예요');
  else title = '내 관리 알림이 다가와요';
  const names = attention.slice(0, 2).map((i) => i.name).join(', ');
  const extra = attention.length - 2;
  return {
    title,
    subtitle: extra > 0 ? `${names} 외 ${extra}개` : names,
    imageKey: first.sampleAssetKey === 'tomato' ? 'tomato-banner' : first.sampleAssetKey,
    imageUri: first.localPhotoUri,
  };
}
