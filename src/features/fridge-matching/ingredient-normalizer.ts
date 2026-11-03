import { APPROXIMATE_INGREDIENTS, INGREDIENT_SYNONYMS } from '@/domain/policies/recipe-match-policy';

function clean(name: string): string {
  return name.replace(/\(.*?\)/g, '').replace(/\s+/g, '').toLowerCase();
}

const ALIAS_TO_ID = new Map<string, string>();
for (const [id, aliases] of Object.entries(INGREDIENT_SYNONYMS)) {
  ALIAS_TO_ID.set(clean(id), id);
  aliases.forEach((a) => ALIAS_TO_ID.set(clean(a), id));
}

/** 표시 이름을 표준 재료 ID로 바꾼다. 사전에 없으면 공백을 뺀 이름 자체가 ID다. 사용자 사전이 우선한다. */
export function normalizeIngredient(name: string, userSynonyms: Record<string, string> = {}): string {
  const key = clean(name);
  const user = userSynonyms[key];
  if (user) return clean(user);
  return ALIAS_TO_ID.get(key) ?? key;
}

/** 근사 일치면 true. 같은 재료로 단정하지 않고 추천 이유에 드러낸다. */
export function isApproximateMatch(a: string, b: string): boolean {
  return APPROXIMATE_INGREDIENTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
