/**
 * 제품군별 참고 알림 기간. 출처·조건·확인일이 검수된 항목만 추가한다(§2.3).
 * 현재 검수를 마친 데이터가 없으므로 비어 있고, 앱은 `날짜 직접 설정`만 안내한다.
 * 출처 없는 수치를 여기에 넣지 않는다. scripts/verify-food-guidance.ts 가 이를 검사한다.
 */
export interface ReferenceGuidance {
  foodType: string;
  storageCondition: string;
  openedOrCookedCondition: string;
  suggestedReminderDays: number;
  sourceUrl: string;
  lastVerifiedOn: string;
}

export const REFERENCE_GUIDANCE: ReferenceGuidance[] = [];
