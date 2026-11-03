# 아키텍처

Expo SDK 58 + React Native + TypeScript strict. 서버·로그인·원격 AI 없이 기기 안에서 동작한다.

## 계층과 의존 방향

```
app/ (Expo Router 화면)
  └─> src/design-system (토큰·공통 컴포넌트)
  └─> src/hooks (앱 상태, 포커스 로더)
  └─> src/features (유스케이스·정책)
        └─> src/domain (순수 타입·날짜·정책 값)
        └─> src/infrastructure (SQLite, 파일, 알림 어댑터)
modules/food-label-ocr (Swift, Apple Vision)  <─ features/food-label-ocr/providers
```

- `src/domain`, `features/food-safety`, `features/food-label-ocr`의 파서, `recipe-scaling`, `recipe-matcher`, `notification-reconciler`는 React Native에 의존하지 않아 Jest로 바로 검증한다.
- 화면은 SQL을 만들지 않는다. SQL은 `infrastructure/database/repositories`에만 있고 항상 파라미터 바인딩을 쓴다.
- `SqlDb` 인터페이스 덕분에 저장소·서비스 테스트를 실제 SQLite(`node:sqlite`)로 돌린다.
- OCR은 `FoodLabelOcrProvider` 계약 뒤에 있다. 네이티브 모듈이 없으면(Expo Go, 웹, Android 미구현) `available: false`가 되어 직접 입력으로 이어진다.
- 알림은 DB가 기준이다. `planNotifications`가 있어야 할 알림을 계산하고 `reconcileNotifications`가 OS 예약 상태를 맞춘다. 앱 시작과 데이터 변경 때 실행한다.

## 슈퍼프롬프트 구조에서 바꾼 점

자세한 이유는 `DECISIONS.md`.

| 프롬프트 §10 | 실제 | 이유 |
| --- | --- | --- |
| `jubu-1dan/` | 저장소 루트(`kitchen_101/`) | 사용자가 지정한 저장소 |
| `features/inventory/inventory-repository.ts`와 `infrastructure/.../repositories` 양쪽 | `infrastructure`로 일원화 | 위치 중복 제거 |
| `features/fridge-matching/recipe-match-policy.ts`와 `domain/policies` 양쪽 | `domain/policies`로 일원화 | §7.3이 한 곳 관리를 요구 |
| `android-mlkit-provider.ts` | 만들지 않음 | Android OCR은 Phase 6. 빈 구현을 두지 않음(§10) |
| `cooking-log/`, `onboarding/`, `share-intake/` | 레시피 서비스, 화면으로 흡수 / 미구현 | 실제 필요한 폴더만 생성(§10) |
| — | `features/backup`, `features/sample-data`, `plugins/` 추가 | §8.4, §11.4와 앱 이름 문제 대응 |
| — | `app/about.tsx` 추가 | 설정의 개인정보·출처·라이선스(§8.1) |
