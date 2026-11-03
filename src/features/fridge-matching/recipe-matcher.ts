import type { DateOnly } from '@/domain/date-only';
import type { FoodInventoryItem, Recipe, RecipeIngredient } from '@/domain/models';
import { RECIPE_MATCH_POLICY as P } from '@/domain/policies/recipe-match-policy';
import { computeStatus } from '@/features/food-safety/status-calculator';

import { isApproximateMatch, normalizeIngredient } from './ingredient-normalizer';

export interface RecipeMatch {
  recipe: Recipe;
  /** 비교한 필수 재료 수(약간·적당량 같은 비정량 재료 제외) */
  requiredCount: number;
  availableCount: number;
  /** 재고에 등록되지 않은 재료. 실제로 없다는 뜻은 아니다. */
  unregistered: string[];
  /** 수량이 필요량보다 적게 등록된 재료 */
  insufficient: string[];
  /** 비정량 재료(집에 있는지 직접 확인) */
  uncounted: string[];
  /** 관리 날짜가 가까운 보유 재료 */
  dueIngredients: string[];
  /** 표시 날짜가 지나 추천 근거에서 뺀 재료 */
  excludedExpired: string[];
  /** 개인 알림 날짜가 지나 검토가 필요한 재료 */
  reviewNeeded: string[];
  /** 근사 일치("파"→"대파") 설명 */
  approximate: string[];
  reasons: string[];
  isReady: boolean;
  /** 정렬 전용. UI에 노출하지 않는다. */
  score: number;
}

export interface MatchOptions {
  today: DateOnly;
  leadDays: number;
  excludedIngredients?: string[];
  userSynonyms?: Record<string, string>;
  settledOnly?: boolean;
  maxMinutes?: number;
  targetServings?: number;
}

interface StockEntry {
  id: string;
  item: FoodInventoryItem;
  expired: boolean;
  reminderPassed: boolean;
  due: boolean;
}

function buildStock(items: FoodInventoryItem[], o: MatchOptions): StockEntry[] {
  const excluded = new Set((o.excludedIngredients ?? []).map((e) => normalizeIngredient(e, o.userSynonyms)));
  return items
    .filter((i) => !i.consumedAt && !i.discardedAt)
    .map((item) => {
      const id = normalizeIngredient(item.name, o.userSynonyms);
      const s = computeStatus(item, o.today, o.leadDays);
      return {
        id,
        item,
        expired: s.all.includes('EXPIRED_LABEL_DATE'),
        reminderPassed: s.reminderDaysLeft != null && s.reminderDaysLeft < 0,
        due: s.all.includes('LABEL_DATE_TODAY') || s.all.includes('LABEL_DATE_SOON') || (s.all.includes('PERSONAL_REMINDER_DUE') && (s.reminderDaysLeft ?? 0) >= 0),
      };
    })
    .filter((e) => !excluded.has(e.id));
}

export function matchRecipe(recipe: Recipe, ingredients: RecipeIngredient[], stock: StockEntry[], o: MatchOptions): RecipeMatch {
  const required = ingredients.filter((i) => i.isScalable || i.quantityText == null);
  const uncounted = ingredients.filter((i) => !required.includes(i)).map((i) => i.displayName);
  const m: Pick<RecipeMatch, 'unregistered' | 'insufficient' | 'dueIngredients' | 'excludedExpired' | 'reviewNeeded' | 'approximate'> = {
    unregistered: [],
    insufficient: [],
    dueIngredients: [],
    excludedExpired: [],
    reviewNeeded: [],
    approximate: [],
  };
  let available = 0;
  const ratio = o.targetServings ? o.targetServings / recipe.baseServings : 1;

  for (const ingredient of required) {
    const id = normalizeIngredient(ingredient.displayName, o.userSynonyms);
    const candidates = stock.filter((e) => e.id === id || isApproximateMatch(e.id, id));
    const usable = candidates.filter((e) => !e.expired && !e.reminderPassed);
    if (usable.length === 0) {
      const expired = candidates.find((e) => e.expired);
      const review = candidates.find((e) => e.reminderPassed && !e.expired);
      if (expired) m.excludedExpired.push(ingredient.displayName);
      else if (review) m.reviewNeeded.push(ingredient.displayName);
      m.unregistered.push(ingredient.displayName);
      continue;
    }
    const hit = usable.find((e) => e.id === id) ?? usable[0];
    if (hit.id !== id) m.approximate.push(`${hit.item.name}을(를) ${ingredient.displayName}(으)로 봤어요`);
    if (hit.due) m.dueIngredients.push(ingredient.displayName);
    const need = ingredient.quantity != null ? ingredient.quantity * ratio : null;
    if (need != null && hit.item.quantity != null && hit.item.unit && hit.item.unit === ingredient.unit && hit.item.quantity < need) {
      m.insufficient.push(ingredient.displayName);
    }
    available++;
  }

  const requiredCount = required.length;
  const missingCount = requiredCount - available;
  const coverage = requiredCount === 0 ? 0 : available / requiredCount;
  const dueBonus = Math.min(P.DUE_BONUS_CAP, m.dueIngredients.length * P.DUE_BONUS_PER_INGREDIENT);
  const score = coverage * P.COVERAGE_WEIGHT + dueBonus + (recipe.isSettled ? P.SETTLED_BONUS : 0) - missingCount * P.MISSING_PENALTY_PER_INGREDIENT;

  const reasons = [`필요 재료 ${requiredCount}개 중 ${available}개 보유`];
  m.dueIngredients.forEach((name) => reasons.push(`${name}의 관리 날짜가 가까워요`));
  if (recipe.isSettled) reasons.push('우리 집 정착 레시피');
  m.excludedExpired.forEach((name) => reasons.push(`${name}은(는) 표시 날짜가 지나 제외했어요. 상태를 확인해 주세요`));
  m.reviewNeeded.forEach((name) => reasons.push(`${name}은(는) 내 관리 알림일이 지나 검토가 필요해요`));
  m.approximate.forEach((text) => reasons.push(text));

  return {
    recipe,
    requiredCount,
    availableCount: available,
    uncounted,
    ...m,
    reasons,
    isReady: requiredCount > 0 && missingCount === 0 && m.insufficient.length === 0,
    score,
  };
}

/** 구조화된 재료가 있는 내 레시피만 비교한다(링크만 저장한 항목 제외). 재료가 하나도 겹치지 않으면 뺀다. */
export function matchRecipes(recipes: Recipe[], allIngredients: RecipeIngredient[], items: FoodInventoryItem[], o: MatchOptions): RecipeMatch[] {
  const stock = buildStock(items, o);
  const byRecipe = new Map<string, RecipeIngredient[]>();
  allIngredients.forEach((i) => byRecipe.set(i.recipeId, [...(byRecipe.get(i.recipeId) ?? []), i]));
  return recipes
    .filter((r) => (byRecipe.get(r.id)?.length ?? 0) > 0)
    .filter((r) => !o.settledOnly || r.isSettled)
    .filter((r) => !o.maxMinutes || ((r.prepMinutes ?? 0) + (r.cookMinutes ?? 0)) <= o.maxMinutes)
    .map((r) => matchRecipe(r, byRecipe.get(r.id)!, stock, o))
    .filter((match) => match.availableCount > 0)
    .sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title, 'ko'));
}

/** 홈의 추천: 지금 재료로 가장 많이 채워지는 레시피. 파먹기는 날짜 보너스가 포함된 score 순. */
export function bestCoverage(matches: RecipeMatch[]): RecipeMatch | undefined {
  const minutes = (m: RecipeMatch) => (m.recipe.prepMinutes ?? 0) + (m.recipe.cookMinutes ?? 0);
  return [...matches].sort(
    (a, b) => b.availableCount / b.requiredCount - a.availableCount / a.requiredCount || b.requiredCount - a.requiredCount || minutes(a) - minutes(b),
  )[0];
}
