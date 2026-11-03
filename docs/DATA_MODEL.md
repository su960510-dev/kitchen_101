# 데이터 모델

타입: `src/domain/models/index.ts`. 스키마: `src/infrastructure/database/migrations/index.ts` (`PRAGMA user_version`으로 버전 관리).

| 테이블 | 내용 |
| --- | --- |
| `inventory_items` | 식재료. 구입·받은·개봉·조리·표시·개인 알림 날짜를 각각 별도 컬럼으로 저장 |
| `recipes` | 레시피 원본. `source_url`, 직접 쓴 제목, 정착 상태, 대표 버전 |
| `recipe_ingredients` | 재료명, 수량, 단위, 비정량 표현, `is_scalable` |
| `recipe_steps` | 조리 단계와 단계별 개인 메모 |
| `recipe_cook_logs` | 조리 기록 |
| `recipe_versions` | 변경 이력 스냅샷(JSON) |
| `ingredient_synonyms` | 사용자 동의어 사전 |
| `settings` | `HouseholdSettings` JSON |

## 원칙

- 날짜는 `YYYY-MM-DD` 문자열. UTC timestamp로 변환하지 않는다.
- `label_date`와 `personal_reminder_date`는 절대 합치지 않는다.
- 어떤 날짜도 다른 날짜에서 계산해 채우지 않는다.
- 이미지 바이너리는 DB에 넣지 않고 앱 전용 폴더의 URI만 저장한다. 파일이 없어져도 화면은 대체 표시로 넘어간다.
- `date_source`: `MANUAL` / `OCR_CONFIRMED` / `IMPORTED_BACKUP`.
- `ocr_text`는 사용자가 보관을 선택할 때만 저장하고 데이터 관리에서 일괄 삭제할 수 있다.
- `is_sample=1`은 실제 재고와 분리한다.
- 인원수 계산 값은 저장하지 않고 화면에서 파생한다. 원본 재료량이 바뀌지 않는다.
