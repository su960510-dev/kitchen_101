import { addDays, todayKst } from '@/domain/date-only';
import type { DateType, FoodInventoryItem, InventoryCategory, RecipeCategory, RecipeDifficulty } from '@/domain/models';
import { newId } from '@/domain/validation';
import { normalizeIngredient } from '@/features/fridge-matching/ingredient-normalizer';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import type { SqlDb } from '@/infrastructure/database/sql-types';

/**
 * 예시 체험 데이터(사용자가 선택할 때만 생성). 모든 항목은 isSample=true 로 실제 재고와 분리되고,
 * 화면에 `예시` 표시가 붙으며 알림·백업에 포함되지 않는다. 날짜는 UX 보드를 보여 주기 위한 데모 전용 값이다.
 * 레시피 문구는 이 프로젝트에서 직접 작성했다.
 */
interface SampleItem {
  name: string;
  category: InventoryCategory;
  days?: number;
  type?: DateType;
  reminderDays?: number;
  asset?: string;
  mom?: boolean;
  receivedDaysAgo?: number;
  quantity?: number;
  unit?: string;
}

const ITEMS: SampleItem[] = [
  { name: '토마토', category: 'VEGETABLE', days: 3, type: 'SELL_BY', asset: 'tomato', quantity: 3, unit: '개' },
  { name: '상추', category: 'VEGETABLE', days: 4, type: 'SELL_BY', asset: 'lettuce' },
  { name: '계란', category: 'DAIRY', days: 9, type: 'USE_BY', asset: 'eggs', quantity: 10, unit: '개' },
  { name: '대파', category: 'VEGETABLE' },
  { name: '양파', category: 'VEGETABLE' },
  { name: '돼지고기', category: 'MEAT', days: 20, type: 'USE_BY' },
  { name: '두부', category: 'GRAIN', days: 16, type: 'USE_BY' },
  { name: '김치', category: 'SIDE_DISH', days: 14, type: 'USE_BY', asset: 'kimchi' },
  { name: '멸치볶음', category: 'SIDE_DISH', reminderDays: 5, mom: true, receivedDaysAgo: 2 },
  { name: '콩자반', category: 'SIDE_DISH', mom: true, receivedDaysAgo: 2 },
  { name: '참기름', category: 'SAUCE' },
  { name: '즉석밥', category: 'PACKAGED', days: 90, type: 'BEST_BEFORE', quantity: 2, unit: '개' },
];

interface SampleRecipe {
  title: string;
  category: RecipeCategory;
  servings: number;
  minutes: number;
  difficulty: RecipeDifficulty;
  asset: string;
  settled?: boolean;
  ingredients: { name: string; quantity?: number; unit?: string; text?: string; asset?: string }[];
  steps: string[];
}

const RECIPES: SampleRecipe[] = [
  {
    title: '우리집 김치찌개',
    category: '국·찌개',
    servings: 4,
    minutes: 30,
    difficulty: '중',
    asset: 'kimchi-stew',
    settled: true,
    ingredients: [
      { name: '김치', quantity: 300, unit: 'g' },
      { name: '돼지고기', quantity: 200, unit: 'g' },
      { name: '두부', quantity: 1, unit: '모' },
      { name: '대파', quantity: 1, unit: '대' },
    ],
    steps: ['돼지고기와 김치를 냄비에 넣고 볶아요.', '물을 붓고 끓여요.', '두부와 대파를 넣고 한소끔 더 끓여요.'],
  },
  {
    title: '간단한 계란볶음밥',
    category: '밥·면',
    servings: 2,
    minutes: 15,
    difficulty: '하',
    asset: 'egg-rice',
    ingredients: [
      { name: '계란', quantity: 3, unit: '개', asset: 'ing-eggs' },
      { name: '밥', quantity: 2, unit: '공기', asset: 'ing-rice' },
      { name: '대파', quantity: 1, unit: '대', asset: 'ing-green-onion' },
      { name: '소금', text: '약간' },
    ],
    steps: ['대파를 송송 썰어요.', '계란과 밥을 넣어 함께 볶아요.', '소금으로 간을 맞춰요.'],
  },
  {
    title: '매콤 제육볶음',
    category: '한식',
    servings: 3,
    minutes: 25,
    difficulty: '중',
    asset: 'jeyuk',
    ingredients: [
      { name: '돼지고기', quantity: 400, unit: 'g' },
      { name: '양파', quantity: 1, unit: '개' },
      { name: '대파', quantity: 1, unit: '대' },
      { name: '고추장', quantity: 2, unit: '큰술' },
    ],
    steps: ['고기에 양념을 버무려요.', '양파와 함께 센 불에 볶아요.', '대파를 넣고 마무리해요.'],
  },
  {
    title: '된장찌개',
    category: '국·찌개',
    servings: 3,
    minutes: 20,
    difficulty: '하',
    asset: 'doenjang-stew',
    ingredients: [
      { name: '된장', quantity: 2, unit: '큰술' },
      { name: '두부', quantity: 1, unit: '모' },
      { name: '양파', quantity: 1, unit: '개' },
      { name: '대파', quantity: 1, unit: '대' },
    ],
    steps: ['물에 된장을 풀어 끓여요.', '양파와 두부를 넣어요.', '대파를 넣고 조금 더 끓여요.'],
  },
  {
    title: '냉장고 속 재료로 간단한 볶음밥',
    category: '밥·면',
    servings: 2,
    minutes: 15,
    difficulty: '하',
    asset: 'fried-rice',
    ingredients: [
      { name: '계란', quantity: 2, unit: '개', asset: 'ing-eggs' },
      { name: '대파', quantity: 1, unit: '대', asset: 'ing-green-onion' },
      { name: '밥', quantity: 1, unit: '공기', asset: 'ing-rice' },
      { name: '참기름', quantity: 1, unit: '스푼', asset: 'ing-sesame-oil' },
    ],
    steps: ['재료를 손질해요.', '달군 팬에 대파를 볶아 향을 내요.', '계란을 풀어 넣고 반쯤 익으면 밥을 넣어 볶아요.', '불을 끄고 참기름을 둘러 마무리해요.'],
  },
  {
    title: '토마토 달걀볶음',
    category: '한식',
    servings: 2,
    minutes: 10,
    difficulty: '하',
    asset: 'tomato-egg',
    ingredients: [
      { name: '토마토', quantity: 2, unit: '개', asset: 'tomato' },
      { name: '달걀', quantity: 3, unit: '개', asset: 'ing-eggs' },
      { name: '대파', quantity: 1, unit: '대', asset: 'ing-green-onion' },
      { name: '소금', text: '약간' },
    ],
    steps: ['토마토를 한입 크기로 썰어요.', '달걀을 먼저 스크램블해 덜어 둬요.', '토마토를 볶다가 달걀을 넣고 소금으로 간해요.'],
  },
];

export async function seedSampleData(db: SqlDb, now = new Date()): Promise<void> {
  const today = todayKst(now);
  const iso = now.toISOString();
  await db.withTransactionAsync(async () => {
    for (const [index, s] of ITEMS.entries()) {
      const item: FoodInventoryItem = {
        id: `sample_item_${index}`,
        name: s.name,
        normalizedIngredientId: normalizeIngredient(s.name),
        category: s.category,
        storageLocation: 'FRIDGE',
        quantity: s.quantity,
        unit: s.unit,
        labelDate: s.days != null ? addDays(today, s.days) : undefined,
        labelDateType: s.days != null ? s.type : undefined,
        personalReminderDate: s.reminderDays != null ? addDays(today, s.reminderDays) : undefined,
        receivedDate: s.receivedDaysAgo != null ? addDays(today, -s.receivedDaysAgo) : undefined,
        dateSource: s.days != null ? 'MANUAL' : undefined,
        notifyEnabled: false,
        isMomSideDish: s.mom ?? false,
        isOpened: false,
        sampleAssetKey: s.asset,
        isSample: true,
        createdAt: iso,
        updatedAt: iso,
      };
      await inventoryRepository.upsert(db, item);
    }
    for (const [index, r] of RECIPES.entries()) {
      const id = `sample_recipe_${index}`;
      const created = new Date(now.getTime() + index).toISOString();
      await recipeRepository.upsertRecipe(db, {
        id,
        title: r.title,
        category: r.category,
        baseServings: r.servings,
        cookMinutes: r.minutes,
        difficulty: r.difficulty,
        sampleAssetKey: r.asset,
        isSettled: r.settled ?? false,
        settledAt: r.settled ? iso : undefined,
        isSample: true,
        createdAt: created,
        updatedAt: created,
      });
      await recipeRepository.replaceIngredients(
        db,
        id,
        r.ingredients.map((i, order) => ({
          id: newId('ing_'),
          recipeId: id,
          ingredientId: normalizeIngredient(i.name),
          displayName: i.name,
          quantity: i.quantity,
          unit: i.unit,
          quantityText: i.text,
          isScalable: i.quantity != null,
          sampleAssetKey: i.asset,
          sortOrder: order,
        })),
      );
      await recipeRepository.replaceSteps(
        db,
        id,
        r.steps.map((instruction, order) => ({ id: newId('stp_'), recipeId: id, instruction, sortOrder: order })),
      );
    }
  });
}

export async function removeSampleData(db: SqlDb): Promise<void> {
  await db.withTransactionAsync(async () => {
    await inventoryRepository.removeSamples(db);
    await recipeRepository.removeSamples(db);
  });
}

export async function hasSampleData(db: SqlDb): Promise<boolean> {
  const row = await db.getFirstAsync<{ c: number }>('SELECT (SELECT COUNT(*) FROM inventory_items WHERE is_sample = 1) + (SELECT COUNT(*) FROM recipes WHERE is_sample = 1) AS c');
  return (row?.c ?? 0) > 0;
}
