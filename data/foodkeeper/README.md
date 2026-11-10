# FoodKeeper 데이터

- 원 출처: USDA FSIS FoodKeeper Data — https://catalog.data.gov/dataset/fsis-foodkeeper-data (CC0 1.0)
- 이 파일: 위 데이터의 제품 시트를 CSV로 옮긴 공개 사본 `lib/seeds/ingredients.csv`
  (https://github.com/jelera/food-shelflife-db, 2019-06-26 커밋). FSIS 서버가 자동 다운로드를 막아 사본을 썼다.
- 받은 날: 2026-11-10. 앱에는 이 파일을 넣지 않고 `scripts/build-storage-guidance.mjs`가 만든 요약만 넣는다.
- 미국 기준 데이터다. 김치·반찬 같은 한국 음식은 없다. 2019년 이후 FSIS 갱신(최종 2025-01-22)과 다를 수 있어 출시 전 원본과 대조한다.
