# 식품 안전·날짜 정책

앱은 식품 안전 판정 시스템이 아니다. 날짜와 정보를 정리해 사용자의 판단을 돕는다.

## 구현된 규칙과 코드 위치

| 규칙 | 위치 | 테스트 |
| --- | --- | --- |
| 날짜 유형 11종 분리 | `domain/models` | `status-calculator.test.ts` |
| 기한으로 읽는 유형은 USE_BY, SELL_BY, BEST_BEFORE뿐 | `food-safety/date-policy.ts` | 제조일·포장일·구입일·받은 날짜 경과 처리 없음 검증 |
| `UNKNOWN` 날짜는 임박·경과로 계산하지 않음 | `status-calculator.ts` | 동일 |
| OCR 날짜는 사용자 확인 후에만 저장 | `ocr-review-service.ts` | `date-candidate-parser.test.ts` |
| 2자리 연도는 세기를 확정하지 않음 | `date-candidate-parser.ts` | 동일 |
| 엄마표 반찬에 기본 기한 없음, 받은 날짜 필수 | `inventory-service.ts` | `repositories.test.ts` |
| 표시 날짜 경과 재료는 추천 근거에서 제외 | `recipe-matcher.ts` | `recipe-matcher.test.ts` |
| 개인 알림일 경과 재료는 검토 필요로 표시 | `recipe-matcher.ts` | 동일 |
| 알림 문구 구분, OCR 원문 미포함 | `notification-reconciler.ts` | `notification-reconciler.test.ts` |

## 구매일 기준 추정 보관 기한 (2026-11-10, 사용자 결정)

프롬프트 §2.3의 금지를 사용자가 명시적으로 바꿨다(`DECISIONS.md` D-17). 포장 날짜가 없고 구매일이 있으며, 출처가 확인된 품목 데이터가 있을 때만 `추정 보관 기한`을 만든다. 계산은 `food-safety/storage-estimate.ts` 한 곳에 있고 테스트는 `storage-estimate.test.ts`다. 데이터는 USDA FoodKeeper 기반 50개 품목이다(D-20).

## 금지 사항

`반찬 = N일`, `냉동 시 연장` 같은 일괄 계산과 출처 없는 기간 값은 코드 어디에도 없다. `scripts/verify-food-guidance.ts`가 `만료`, 안전 단정 문구, 출처 없는 참고 데이터를 검사한다.

## 품목 보관 기간 데이터

`STORAGE_GUIDANCE`는 `storage-guidance.data.ts`(자동 생성, 50개 품목)다. 값을 추가하려면 `scripts/build-storage-guidance.mjs`의 매핑을 고치고 다시 실행한다. 직접 값을 넣으려면 출처 URL, 출처의 품목명, 확인일이 필요하고 `npm run verify:food-guidance`가 이를 검사한다. 데이터가 없는 품목은 `날짜를 직접 정해 주세요`라고 안내한다.

## UI

- 뱃지는 색상, 아이콘, 글자를 함께 쓴다. 색상 대비와 색각 시뮬레이션 측정은 아직 하지 않았다(`DESIGN_QA.md`).
- 내 관리 알림은 `내 알림 N일 후`로 표기해 포장 날짜와 구분한다.
- 날짜 없음은 위험 상태가 아니라 `날짜 미등록`이다.
