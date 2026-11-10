# 테스트

## 실행

```bash
npm test
npm run typecheck
npm run lint
npm run verify:food-guidance
npm run audit:licenses
```

## 현황 (2026-11-03)

| 항목 | 결과 |
| --- | --- |
| Jest 11개 파일 126개 | 통과 |
| TypeScript strict | 통과 |
| ESLint | 통과 |
| `expo-doctor` 20개 | 통과 |
| `expo prebuild` iOS·Android (`--no-install`) | 통과 |
| `expo export` iOS·Android Hermes 번들 | 통과 |
| `xcodebuild` iOS 기기 빌드 | 통과 (Swift OCR 모듈 컴파일 포함) |
| 웹 미리보기 | 온보딩, 예시 시드, 직접 등록, 달력, 소진, 새로고침 후 유지, 복구, 설정 확인 |

## 플랫폼별 검증

| 환경 | 상태 |
| --- | --- |
| iOS 시뮬레이터 | **미검증** (Xcode 라이선스 미동의로 실행 불가) |
| iOS 실기기 | iPhone XS(iOS 18.7.11), 무료 개인 팀 서명 Release 빌드 설치·실행 확인 (2026-11-10). 기능별 확인은 사용자 테스트 대기 |
| Android 에뮬레이터 | **미검증** |
| Android 실기기 | **미검증** (연결된 기기 없음) |

웹 미리보기는 UI 확인용이며 iOS 완료의 근거가 아니다. 웹에는 OCR, 알림, 앱 파일 저장이 없다.

## 아직 실행하지 않은 것

- Vision OCR 실제 인식
- 실제 알림 예약·전달, 권한 거부 흐름
- 카메라·사진 선택기
- JSON 내보내기·복원 UI (서비스 로직은 통합 테스트 통과)
- 비행기 모드, 강제 종료 후 복원
- 100/500/1,000개 실기기 성능. 데스크톱에서 1,000개 필터링이 500ms 안에 끝나는지만 확인

## 테스트 구성

- `tests/unit`: 날짜, 상태 계산, 날짜 파서, 인원수 조절, 매칭, 알림 계획, 링크
- `tests/integration`: 실제 SQLite로 마이그레이션, 재고, 레시피, 예시 데이터, 백업
