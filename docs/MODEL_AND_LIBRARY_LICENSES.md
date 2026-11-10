# 모델과 라이브러리 라이선스

확인일 2026-11-03. 설치된 `node_modules`의 `package.json` 기준이며 `npm run audit:licenses`로 다시 생성할 수 있다.

## 런타임 의존성

| 패키지 | SPDX |
| --- | --- |
| expo@58.0.22 | MIT |
| expo-clipboard@58.0.4 | MIT |
| expo-constants@58.0.14 | MIT |
| expo-document-picker@58.0.4 | MIT |
| expo-file-system@58.0.13 | MIT |
| expo-font@58.0.11 | MIT |
| expo-image@58.0.18 | MIT |
| expo-image-picker@58.0.10 | MIT |
| expo-linking@58.0.15 | MIT |
| expo-notifications@58.1.7 | MIT |
| expo-router@58.0.29 | MIT |
| expo-sharing@58.0.21 | MIT |
| expo-splash-screen@58.0.12 | MIT |
| expo-sqlite@58.0.15 | MIT |
| expo-status-bar@58.0.4 | MIT |
| expo-system-ui@58.0.7 | MIT |
| react@19.3.0 | MIT |
| react-dom@19.3.0 | MIT |
| react-native@0.88.1 | MIT |
| react-native-safe-area-context@5.10.1 | MIT |
| react-native-screens@4.30.1 | MIT |
| react-native-svg@15.16.0 | MIT |
| react-native-web@0.21.4 | MIT |

## 검토 메모

- 런타임 직접 의존성은 모두 MIT다.
- `node-forge`는 `BSD-3-Clause OR GPL-2.0` 이중 라이선스로, BSD를 선택할 수 있고 Expo 개발 도구 경로의 의존성이다.
- 집계의 `LGPL-3.0-or-later` 1건은 이미지 추출 스크립트에만 쓰는 `sharp`의 libvips이며, `--no-save`로 설치해 package.json과 앱에 포함되지 않는다.
- Apple Vision: iOS SDK 프레임워크. 별도 번들 없음. Apple 개발자 약관을 따른다.
- Google ML Kit: 미사용. Android OCR 구현 시 Google 이용약관, 앱 크기, 모델 전달 방식을 따로 검토한다. 오픈소스 라이브러리와 조건이 같지 않다.
- 폰트: 시스템 폰트만 사용. 아이콘: 직접 그린 벡터.

## 데이터

- USDA FSIS FoodKeeper Data: CC0 1.0 (data.gov 메타데이터 기준). 앱에는 50개 품목의 일수 요약만 포함한다. 사본 저장소 jelera/food-shelflife-db에는 라이선스 표기가 없으며, 데이터 자체는 USDA 원본이라고 명시되어 있다.
