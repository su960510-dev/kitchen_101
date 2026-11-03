# 비용과 배포

확인일 2026-11-03. 무료 개발과 무료 배포·운영은 다르다. 영구 무료를 보장하지 않으며 출시 시점에 다시 확인한다.

| 항목 | 내용 | 출처 |
| --- | --- | --- |
| 서버·LLM API | 필요 없음. OCR은 온디바이스, 계산은 규칙 기반 | 설계 |
| iOS 개발 | Mac과 Xcode 필요. 시뮬레이터·개인 실기기 개발은 무료 계정으로 시작 가능 | |
| Apple Developer Program | 연 US$99 | [Apple](https://developer.apple.com/programs/) |
| Google Play Console | 1회 US$25. 개인 계정은 앱 테스트와 기기 검증 요건을 충족해야 공개 가능 | [Google](https://support.google.com/googleplay/android-developer/answer/6112435) |
| EAS 무료 플랜 | Android 15회, iOS 15회 빌드, 저우선 대기열(혼잡 시 90분 이상 가능), 빌드 45분 제한, macOS 동시 1개 | [Expo](https://expo.dev/pricing) |
| 네이티브 OCR 앱 용량 | Apple Vision은 OS 내장이라 모델 번들 없음. 실측은 안 함 | |
| Android ML Kit | 번들 모델은 용량 증가, 비번들은 첫 실행 전 다운로드 필요. 미구현 | 프롬프트 §4.3 |
| 네트워크 사용 | 외부 링크 열기만. 백업 공유는 사용자가 고른 앱에 달림 | |
| 동기화·가족 공유(미래) | 서버 비용 발생 가능. 현재 범위 아님 | |

## 설정 메모

`app.json`의 `owner`는 이전 앱들과 같은 EAS 계정 `lcm2`로 두었다. `eas init`은 외부 프로젝트 생성이라 실행하지 않아 `projectId`가 없다. 저장소 계정(`su960510-dev`)과 다르므로 다른 EAS 계정을 쓴다면 `owner`를 바꾼다.
