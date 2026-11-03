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

## 금지 사항

`구입일 + N일`, `반찬 = N일`, `냉동 시 연장` 계산은 코드 어디에도 없다. `scripts/verify-food-guidance.ts`가 `만료`, 안전 단정 문구, 출처 없는 참고 데이터를 검사한다.

## 참고 알림 기간

검수된 데이터가 없어 `REFERENCE_GUIDANCE`는 비어 있다. 앱은 `날짜 직접 설정`만 안내한다. 추가하려면 공신력 있는 출처, 식품 유형, 보관 온도, 개봉·조리 조건, 마지막 확인일이 모두 있어야 한다.

## UI

- 뱃지는 색상, 아이콘, 글자를 함께 쓴다. 색상 대비와 색각 시뮬레이션 측정은 아직 하지 않았다(`DESIGN_QA.md`).
- 내 관리 알림은 `내 알림 N일 후`로 표기해 포장 날짜와 구분한다.
- 날짜 없음은 위험 상태가 아니라 `날짜 미등록`이다.
