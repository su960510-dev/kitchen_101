# 디자인 시스템

UX 보드를 그대로 재현한다. 코드: `src/design-system`. 보드 폰 폭 268pt를 390pt 기기로 환산했다.

## 색상 (라이트)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| background | `#F9F7F4` | 오프화이트 배경 |
| surface | `#FFFFFF` | 카드 |
| ink / sub / hint | `#2B2B2B` / `#85827D` / `#A8A5A0` | 글자 |
| green / greenSoft | `#5EA84F` / `#E7F2DF` | 포인트, 선택 칩, 정착완료 |
| primary | `#2F2F2F` | 검정 pill 버튼 |
| alertBg / alertText / alertIcon | `#FDEBE6` / `#C5402E` / `#F4735C` | 임박 배너 |
| soonBg / soonText | `#FCE9B8` / `#B85A10` | 임박 뱃지 |
| neutralBg / neutralText | `#EFEDEA` / `#66635E` | 일반 뱃지 |
| personalBg / personalText | `#E7F2DF` / `#3F7F33` | 내 관리 알림 |

다크 테마는 `darkColors`. 배경을 지운 이미지는 `imagePlate` 받침 위에 둔다.

## 컴포넌트

`Header`, `UnderlineTabs`, `PrimaryButton`(높이 56 pill), `SecondaryButton`, `Card`, `Chip`, `Stepper`, `TextField`, `ToggleRow`, `RowLink`, `InventoryRow`, `AlertBanner`, `RecipeRowCard`, `Pill`, `FoodThumb`, `AppImage`, `BottomSheet`, `OptionSheet`, `CalendarSheet`, `DateRow`, `Icon`, `LogoMark`, `GroupIcon`.

## 규칙

- 시스템 폰트만 사용한다.
- 카드 그림자는 `softShadow` 하나로 통일한다.
- 터치 영역은 44pt 이상을 목표로 한다.
- 애니메이션을 최소화한다. 시트는 페이드, 이미지 전환 효과 없음.

## 이미지 자산

`assets/images/{food,recipes,illustrations,app}`. 재생성: `npm i --no-save sharp && node scripts/extract-board-assets.mjs`.
