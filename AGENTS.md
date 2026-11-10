Expo SDK 58 / React Native 앱. Expo API는 SDK마다 바뀌므로 코드를 쓰기 전에 `package.json`의 버전에 맞는 문서를 확인한다.

## 명령

```bash
npx expo install <package>   # 패키지 설치는 항상 이 명령으로
npm test
npm run typecheck
npm run lint
npm run verify:food-guidance
```

## 규칙

- 라우트는 `app/`, 그 외 코드는 `src/`. `ios/`, `android/`는 생성물이라 직접 고치지 않는다.
- `expo.name`을 한글로 바꾸지 않는다. 표시 이름은 `plugins/with-display-name.js` 설정이다.
- 서버, 로그인, 원격 AI, 분석, 광고 SDK를 넣지 않는다.
- 포장 표시 날짜와 개인 관리 알림을 합치지 않는다. 계산으로 만드는 날짜는 `storage-estimate.ts`의 구매일 기준 추정 보관 기한뿐이며, 출처 있는 품목 데이터로만 계산한다(D-17).
- OCR 날짜는 `confirmLabelDate`를 거치지 않으면 저장하지 않는다.
- 사용자 내용을 로그에 남기지 않는다. `logError`를 쓴다.
- SQL은 저장소에서만, 파라미터 바인딩으로 쓴다.
- 결정은 `docs/DECISIONS.md`에, 작업 내역은 `README.md` 하단 `## 작업 내역 (Work Log)`에 마지막으로 기록한다.
- 실제 기기에서 확인하지 않은 기능을 완료로 보고하지 않는다. 결과는 `docs/TESTING.md`에 기록한다.
- `expo-notifications`보다 앞에 `plugins/with-local-notifications-only.js`를 둔다. 순서를 바꾸면 무료 Apple 팀 서명이 깨진다.
