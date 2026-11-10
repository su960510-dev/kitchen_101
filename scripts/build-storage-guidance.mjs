// FoodKeeper CSV → 품목별 구매 후 보관 기간(일). 실행: node scripts/build-storage-guidance.mjs
// 기간이 범위면 짧은 쪽을 쓰고, 원문에 없는 보관 방법은 비워 둔다(추정하지 않음).
import fs from 'node:fs';

const CSV = 'data/foodkeeper/ingredients.csv';
const OUT = 'src/features/food-safety/storage-guidance.data.ts';
const VERIFIED_ON = '2026-11-10';
const SOURCE_URL = 'https://catalog.data.gov/dataset/fsis-foodkeeper-data';

// [id, 한국어 이름들, 카테고리, FoodKeeper 품목명 앞부분(Name + (Name_subtitle))]
const MAP = [
  ['eggs', ['계란', '달걀'], 'DAIRY', 'Eggs (in shell)'],
  ['lettuce-leaf', ['상추', '시금치', '쌈채소'], 'VEGETABLE', 'Lettuce (leaf, spinach)'],
  ['lettuce-head', ['양상추', '로메인'], 'VEGETABLE', 'Lettuce (iceberg, romaine)'],
  ['greens', ['깻잎', '청경채', '부추'], 'VEGETABLE', 'Greens'],
  ['onion', ['양파'], 'VEGETABLE', 'Onions (yellow, white, red, etc.)'],
  ['green-onion', ['대파', '파', '쪽파'], 'VEGETABLE', 'Onions (spring or green)'],
  ['garlic', ['마늘'], 'VEGETABLE', 'Garlic'],
  ['ginger', ['생강'], 'VEGETABLE', 'Ginger root'],
  ['potato', ['감자'], 'VEGETABLE', 'Potatoes'],
  ['sweet-potato', ['고구마'], 'VEGETABLE', 'Yams/sweet potatoes'],
  ['carrot', ['당근'], 'VEGETABLE', 'Carrots, parsnips'],
  ['cucumber', ['오이'], 'VEGETABLE', 'Cucumbers'],
  ['mushroom', ['버섯', '표고버섯', '양송이', '팽이버섯', '새송이'], 'VEGETABLE', 'Mushrooms'],
  ['cabbage', ['양배추', '배추'], 'VEGETABLE', 'Cabbage'],
  ['broccoli', ['브로콜리'], 'VEGETABLE', 'Broccoli and broccoli raab (rapini)'],
  ['celery', ['셀러리'], 'VEGETABLE', 'Celery'],
  ['corn', ['옥수수'], 'VEGETABLE', 'Corn on the cob'],
  ['eggplant', ['가지'], 'VEGETABLE', 'Eggplant'],
  ['pepper', ['피망', '파프리카', '고추', '청양고추'], 'VEGETABLE', 'Peppers'],
  ['radish', ['무', '래디시'], 'VEGETABLE', 'Radishes'],
  ['summer-squash', ['애호박', '호박', '주키니'], 'VEGETABLE', 'Squash (summer and zucchini)'],
  ['winter-squash', ['단호박'], 'VEGETABLE', 'Squash (winter)'],
  ['tomato', ['토마토'], 'VEGETABLE', 'Tomatoes'],
  ['apple', ['사과'], 'FRUIT', 'Apples'],
  ['banana', ['바나나'], 'FRUIT', 'Bananas'],
  ['grape', ['포도'], 'FRUIT', 'Grapes'],
  ['citrus', ['귤', '오렌지', '레몬', '자몽'], 'FRUIT', 'Citrus fruit'],
  ['kiwi', ['키위'], 'FRUIT', 'Kiwi fruit'],
  ['melon', ['수박', '참외', '멜론'], 'FRUIT', 'Melons'],
  ['stone-fruit', ['복숭아', '자두', '배'], 'FRUIT', 'Peaches, nectarines, plums, pears, sapote'],
  ['strawberry', ['딸기'], 'FRUIT', 'Strawberries'],
  ['blueberry', ['블루베리'], 'FRUIT', 'Blueberries'],
  ['pork', ['돼지고기'], 'MEAT', 'Pork (shoulder)'],
  ['pork-ground', ['다진 돼지고기', '돼지고기 다짐육'], 'MEAT', 'Pork (ground)'],
  ['beef', ['소고기'], 'MEAT', 'Beef (steaks)'],
  ['beef-ground', ['다진 소고기', '소고기 다짐육'], 'MEAT', 'Beef (ground)'],
  ['chicken', ['닭고기', '닭가슴살', '닭다리', '닭'], 'MEAT', 'Chicken parts (legs or thighs)'],
  ['fish-fatty', ['생선', '고등어', '연어', '삼치', '갈치'], 'SEAFOOD', 'Fatty fish'],
  ['fish-lean', ['대구', '명태', '동태', '가자미'], 'SEAFOOD', 'Lean fish (cod'],
  ['shrimp', ['새우'], 'SEAFOOD', 'Shrimp, crayfish'],
  ['tofu', ['두부'], 'GRAIN', 'Tofu'],
  ['butter', ['버터'], 'DAIRY', 'Butter'],
  ['yogurt', ['요거트', '요구르트'], 'DAIRY', 'Yogurt'],
  ['cheese-slice', ['치즈', '슬라이스치즈'], 'DAIRY', 'Cheese (processed slices)'],
  ['milk', ['우유'], 'DAIRY', 'Milk (plain or flavored)'],
  ['bacon', ['베이컨'], 'MEAT', 'Bacon'],
  ['ham', ['햄'], 'MEAT', 'Ham (fully cooked, slices, half, or spiral cut)'],
  ['sausage', ['소시지'], 'MEAT', 'Sausage (fully cooked smoked links, kielbasa)'],
  ['bread', ['식빵', '빵'], 'GRAIN', 'Commercial bread products'],
  ['rice-raw', ['쌀'], 'GRAIN', 'Rice (white or wild)'],
];

function parse(t) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { r.push(f); f = ''; }
    else if (ch === '\n') { r.push(f); rows.push(r); r = []; f = ''; } else if (ch !== '\r') f += ch;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}
const UNIT = { Days: 1, Day: 1, Weeks: 7, Week: 7, Months: 30, Month: 30, Years: 365, Year: 365 };
const [header, ...rows] = parse(fs.readFileSync(CSV, 'utf8'));
const col = Object.fromEntries(header.map((k, i) => [k, i]));
const fullName = (r) => r[col.Name] + (r[col.Name_subtitle] ? ` (${r[col.Name_subtitle]})` : '');
function minDays(r, prefixes) {
  for (const p of prefixes) {
    const min = r[col[`${p}_Min`]], metric = r[col[`${p}_Metric`]];
    if (min && UNIT[metric]) return Math.round(Number(min) * UNIT[metric]);
  }
  return undefined;
}

const entries = MAP.map(([id, names, category, fkName]) => {
  const norm = (r) => fullName(r).replace(/\s+/g, ' ');
  // 이름이 정확히 같은 행을 먼저 찾고, 긴 이름만 앞부분으로 찾는다(예: Garlic 과 Garlic (chopped...) 구분).
  const row = rows.find((r) => norm(r) === fkName) ?? rows.find((r) => norm(r).startsWith(fkName));
  if (!row) throw new Error(`FoodKeeper 품목 없음: ${fkName}`);
  // 구매일 기준(DOP_) 값을 먼저 쓰고, 없으면 일반 값을 쓴다.
  const days = {};
  const fridge = minDays(row, ['DOP_Refrigerate', 'Refrigerate']);
  const freezer = minDays(row, ['DOP_Freeze', 'Freeze']);
  const pantry = minDays(row, ['DOP_Pantry', 'Pantry']);
  if (fridge != null) days.FRIDGE = fridge;
  if (freezer != null) days.FREEZER = freezer;
  if (pantry != null) days.PANTRY = pantry;
  return { id, names, category, days, sourceName: 'USDA FoodKeeper', sourceItem: fullName(row).replace(/\s+/g, ' '), sourceUrl: SOURCE_URL, lastVerifiedOn: VERIFIED_ON };
});

const body = `// 자동 생성 파일. 수정하지 말고 scripts/build-storage-guidance.mjs 를 고친 뒤 다시 실행한다.
// 출처: USDA FSIS FoodKeeper (CC0). 개월은 30일, 주는 7일로 환산했다.
import type { StorageGuidance } from './reference-guidance';

export const FOODKEEPER_GUIDANCE: StorageGuidance[] = ${JSON.stringify(entries, null, 2)};
`;
fs.writeFileSync(OUT, body);
console.log(`${entries.length}개 품목 → ${OUT}`);
for (const e of entries) console.log(`${e.names[0]}\t냉장 ${e.days.FRIDGE ?? '-'}\t냉동 ${e.days.FREEZER ?? '-'}\t상온 ${e.days.PANTRY ?? '-'}\t${e.sourceItem.slice(0, 40)}`);
