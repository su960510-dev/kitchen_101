import type { FoodInventoryItem, Recipe, RecipeIngredient } from '@/domain/models';
import { normalizeIngredient } from '@/features/fridge-matching/ingredient-normalizer';
import { bestCoverage, matchRecipes } from '@/features/fridge-matching/recipe-matcher';

const today = '2026-11-03';
const options = { today, leadDays: 3 };
const item = (name: string, over: Partial<FoodInventoryItem> = {}): FoodInventoryItem => ({
  id: name,
  name,
  category: 'VEGETABLE',
  storageLocation: 'FRIDGE',
  notifyEnabled: false,
  isMomSideDish: false,
  isOpened: false,
  isSample: false,
  createdAt: '',
  updatedAt: '',
  ...over,
});
const recipe = (id: string, over: Partial<Recipe> = {}): Recipe => ({ id, title: id, category: '한식', baseServings: 2, isSettled: false, isSample: false, createdAt: '', updatedAt: '', ...over });
const ing = (recipeId: string, displayName: string, over: Partial<RecipeIngredient> = {}): RecipeIngredient => ({ id: recipeId + displayName, recipeId, displayName, quantity: 1, unit: '개', isScalable: true, sortOrder: 0, ...over });

describe('ingredient normalizer', () => {
  it('maps synonyms and keeps unrelated names apart', () => {
    expect(normalizeIngredient('달걀')).toBe('계란');
    expect(normalizeIngredient('즉석밥')).toBe('밥');
    expect(normalizeIngredient('대파')).toBe('대파');
    expect(normalizeIngredient('파')).toBe('파');
  });
  it('prefers the user dictionary', () => {
    expect(normalizeIngredient('엄마김치', { 엄마김치: '김치' })).toBe('김치');
  });
});

describe('matchRecipes', () => {
  it('reports the coverage as the reason', () => {
    const [m] = matchRecipes([recipe('r')], [ing('r', '계란'), ing('r', '두부')], [item('달걀')], options);
    expect(m.reasons[0]).toBe('필요 재료 2개 중 1개 보유');
    expect(m.unregistered).toEqual(['두부']);
    expect(m.isReady).toBe(false);
  });

  it('excludes label-expired ingredients and says so', () => {
    const [m] = matchRecipes([recipe('r')], [ing('r', '계란'), ing('r', '두부')], [item('계란'), item('두부', { labelDate: '2026-11-01', labelDateType: 'USE_BY' })], options);
    expect(m.availableCount).toBe(1);
    expect(m.excludedExpired).toEqual(['두부']);
    expect(m.reasons.join()).toContain('두부은(는) 표시 날짜가 지나 제외했어요');
  });

  it('does not recommend a recipe that only has expired stock', () => {
    const matches = matchRecipes([recipe('r')], [ing('r', '두부')], [item('두부', { labelDate: '2026-11-01', labelDateType: 'USE_BY' })], options);
    expect(matches).toHaveLength(0);
  });

  it('does not count ingredients past the personal reminder as available', () => {
    const [m] = matchRecipes([recipe('r')], [ing('r', '계란'), ing('r', '두부')], [item('계란'), item('두부', { personalReminderDate: '2026-11-01' })], options);
    expect(m.availableCount).toBe(1);
    expect(m.reviewNeeded).toEqual(['두부']);
  });

  it('ranks recipes using due ingredients higher and explains why', () => {
    const matches = matchRecipes(
      [recipe('plain'), recipe('due')],
      [ing('plain', '계란'), ing('due', '토마토')],
      [item('계란'), item('토마토', { labelDate: '2026-11-05', labelDateType: 'SELL_BY' })],
      options,
    );
    expect(matches[0].recipe.id).toBe('due');
    expect(matches[0].dueIngredients).toEqual(['토마토']);
    expect(matches[0].reasons).toContain('토마토의 관리 날짜가 가까워요');
  });

  it('applies the settled bonus and filter', () => {
    const ingredients = [ing('a', '계란'), ing('b', '계란')];
    const stock = [item('계란')];
    const matches = matchRecipes([recipe('a'), recipe('b', { isSettled: true })], ingredients, stock, options);
    expect(matches[0].recipe.id).toBe('b');
    expect(matchRecipes([recipe('a'), recipe('b', { isSettled: true })], ingredients, stock, { ...options, settledOnly: true })).toHaveLength(1);
  });

  it('marks approximate matches instead of silently treating them as equal', () => {
    const [m] = matchRecipes([recipe('r')], [ing('r', '대파')], [item('파')], options);
    expect(m.availableCount).toBe(1);
    expect(m.approximate[0]).toContain('대파');
  });

  it('flags insufficient quantity for the target servings', () => {
    const [m] = matchRecipes([recipe('r')], [ing('r', '계란', { quantity: 2, unit: '개' })], [item('계란', { quantity: 3, unit: '개' })], { ...options, targetServings: 4 });
    expect(m.insufficient).toEqual(['계란']);
    expect(m.isReady).toBe(false);
  });

  it('keeps non-quantified ingredients out of coverage', () => {
    const [m] = matchRecipes([recipe('r')], [ing('r', '계란'), ing('r', '소금', { quantity: undefined, unit: undefined, quantityText: '약간', isScalable: false })], [item('계란')], options);
    expect(m.requiredCount).toBe(1);
    expect(m.uncounted).toEqual(['소금']);
    expect(m.isReady).toBe(true);
  });

  it('skips excluded ingredients and link-only recipes', () => {
    expect(matchRecipes([recipe('r')], [ing('r', '계란')], [item('계란')], { ...options, excludedIngredients: ['달걀'] })).toHaveLength(0);
    expect(matchRecipes([recipe('link')], [], [item('계란')], options)).toHaveLength(0);
  });

  it('chooses the fullest coverage for the home card', () => {
    const matches = matchRecipes([recipe('half'), recipe('full')], [ing('half', '계란'), ing('half', '두부'), ing('full', '계란')], [item('계란')], options);
    expect(bestCoverage(matches)?.recipe.id).toBe('full');
  });
});
