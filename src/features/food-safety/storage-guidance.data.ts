// 자동 생성 파일. 수정하지 말고 scripts/build-storage-guidance.mjs 를 고친 뒤 다시 실행한다.
// 출처: USDA FSIS FoodKeeper (CC0). 개월은 30일, 주는 7일로 환산했다.
import type { StorageGuidance } from './reference-guidance';

export const FOODKEEPER_GUIDANCE: StorageGuidance[] = [
  {
    "id": "eggs",
    "names": [
      "계란",
      "달걀"
    ],
    "category": "DAIRY",
    "days": {
      "FRIDGE": 21
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Eggs (in shell)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "lettuce-leaf",
    "names": [
      "상추",
      "시금치",
      "쌈채소"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 3
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Lettuce (leaf, spinach)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "lettuce-head",
    "names": [
      "양상추",
      "로메인"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 7
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Lettuce (iceberg, romaine)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "greens",
    "names": [
      "깻잎",
      "청경채",
      "부추"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 300
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Greens",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "onion",
    "names": [
      "양파"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 60,
      "FREEZER": 300,
      "PANTRY": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Onions (yellow, white, red, etc.)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "green-onion",
    "names": [
      "대파",
      "파",
      "쪽파"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 300,
      "PANTRY": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Onions (spring or green)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "garlic",
    "names": [
      "마늘"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 30,
      "PANTRY": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Garlic",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "ginger",
    "names": [
      "생강"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 14,
      "FREEZER": 180,
      "PANTRY": 2
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Ginger root",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "potato",
    "names": [
      "감자"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 300,
      "PANTRY": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Potatoes",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "sweet-potato",
    "names": [
      "고구마"
    ],
    "category": "VEGETABLE",
    "days": {
      "PANTRY": 14
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Yams/sweet potatoes",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "carrot",
    "names": [
      "당근"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 14,
      "FREEZER": 300
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Carrots, parsnips",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "cucumber",
    "names": [
      "오이"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 4
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Cucumbers",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "mushroom",
    "names": [
      "버섯",
      "표고버섯",
      "양송이",
      "팽이버섯",
      "새송이"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 300
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Mushrooms",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "cabbage",
    "names": [
      "양배추",
      "배추"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 300
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Cabbage",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "broccoli",
    "names": [
      "브로콜리"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 300
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Broccoli and broccoli raab (rapini)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "celery",
    "names": [
      "셀러리"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 300
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Celery",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "corn",
    "names": [
      "옥수수"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 240
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Corn on the cob",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "eggplant",
    "names": [
      "가지"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 4,
      "FREEZER": 180,
      "PANTRY": 1
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Eggplant",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "pepper",
    "names": [
      "피망",
      "파프리카",
      "고추",
      "청양고추"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 4,
      "FREEZER": 180
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Peppers",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "radish",
    "names": [
      "무",
      "래디시"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 10
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Radishes",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "summer-squash",
    "names": [
      "애호박",
      "호박",
      "주키니"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 4,
      "FREEZER": 300,
      "PANTRY": 1
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Squash (summer and zucchini)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "winter-squash",
    "names": [
      "단호박"
    ],
    "category": "VEGETABLE",
    "days": {
      "FRIDGE": 30,
      "FREEZER": 300,
      "PANTRY": 14
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Squash (winter)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "tomato",
    "names": [
      "토마토"
    ],
    "category": "VEGETABLE",
    "days": {
      "FREEZER": 60
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Tomatoes",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "apple",
    "names": [
      "사과"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 28,
      "FREEZER": 240,
      "PANTRY": 21
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Apples",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "banana",
    "names": [
      "바나나"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 60
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Bananas",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "grape",
    "names": [
      "포도"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 30,
      "PANTRY": 1
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Grapes",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "citrus",
    "names": [
      "귤",
      "오렌지",
      "레몬",
      "자몽"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 10,
      "PANTRY": 10
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Citrus fruit (lemon, lime, orange, grapefruit, tangerines, clementines)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "kiwi",
    "names": [
      "키위"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 3
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Kiwi fruit",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "melon",
    "names": [
      "수박",
      "참외",
      "멜론"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 14,
      "FREEZER": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Melons",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "stone-fruit",
    "names": [
      "복숭아",
      "자두",
      "배"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 60
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Peaches, nectarines, plums, pears, sapote",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "strawberry",
    "names": [
      "딸기"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 2,
      "FREEZER": 240
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Strawberries",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "blueberry",
    "names": [
      "블루베리"
    ],
    "category": "FRUIT",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 240
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Blueberries",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "pork",
    "names": [
      "돼지고기"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 120
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Pork (shoulder)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "pork-ground",
    "names": [
      "다진 돼지고기",
      "돼지고기 다짐육"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 90
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Pork (ground)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "beef",
    "names": [
      "소고기"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 120
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Beef (steaks)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "beef-ground",
    "names": [
      "다진 소고기",
      "소고기 다짐육"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 90
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Beef (ground)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "chicken",
    "names": [
      "닭고기",
      "닭가슴살",
      "닭다리",
      "닭"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 270
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Chicken parts (legs or thighs)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "fish-fatty",
    "names": [
      "생선",
      "고등어",
      "연어",
      "삼치",
      "갈치"
    ],
    "category": "SEAFOOD",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 60
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Fatty fish (bluefish, catfish, mackerel, mullet, salmon, tuna, etc.)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "fish-lean",
    "names": [
      "대구",
      "명태",
      "동태",
      "가자미"
    ],
    "category": "SEAFOOD",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 180
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Lean fish (cod, flounder, haddock, halibut, sole, etc.)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "shrimp",
    "names": [
      "새우"
    ],
    "category": "SEAFOOD",
    "days": {
      "FRIDGE": 1,
      "FREEZER": 180
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Shrimp, crayfish",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "tofu",
    "names": [
      "두부"
    ],
    "category": "GRAIN",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 150
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Tofu",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "butter",
    "names": [
      "버터"
    ],
    "category": "DAIRY",
    "days": {
      "FRIDGE": 30,
      "FREEZER": 180
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Butter",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "yogurt",
    "names": [
      "요거트",
      "요구르트"
    ],
    "category": "DAIRY",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Yogurt",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "cheese-slice",
    "names": [
      "치즈",
      "슬라이스치즈"
    ],
    "category": "DAIRY",
    "days": {
      "FRIDGE": 21
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Cheese (processed slices)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "milk",
    "names": [
      "우유"
    ],
    "category": "DAIRY",
    "days": {
      "FREEZER": 90
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Milk (plain or flavored)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "bacon",
    "names": [
      "베이컨"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Bacon",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "ham",
    "names": [
      "햄"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 3,
      "FREEZER": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Ham (fully cooked, slices, half, or spiral cut)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "sausage",
    "names": [
      "소시지"
    ],
    "category": "MEAT",
    "days": {
      "FRIDGE": 7,
      "FREEZER": 30
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Sausage (fully cooked smoked links, kielbasa)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "bread",
    "names": [
      "식빵",
      "빵"
    ],
    "category": "GRAIN",
    "days": {
      "FREEZER": 90,
      "PANTRY": 14
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Commercial bread products (including pan breads, flat breads, rolls, and buns)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  },
  {
    "id": "rice-raw",
    "names": [
      "쌀"
    ],
    "category": "GRAIN",
    "days": {
      "PANTRY": 730
    },
    "sourceName": "USDA FoodKeeper",
    "sourceItem": "Rice (white or wild)",
    "sourceUrl": "https://catalog.data.gov/dataset/fsis-foodkeeper-data",
    "lastVerifiedOn": "2026-11-10"
  }
];
