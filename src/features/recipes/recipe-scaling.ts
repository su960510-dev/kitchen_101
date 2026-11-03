import type { RecipeIngredient } from '@/domain/models';

/** 낱개 단위: 계산 결과가 정수가 아니면 반올림 여부를 사용자가 확인한다. */
const COUNT_UNITS = new Set(['개', '알', '쪽', '마리', '대', '장', '모', '줄기', '뿌리', '송이', '봉', '캔', '공기']);

export interface ScaledIngredient {
  ingredient: RecipeIngredient;
  /** 표시용 문구 */
  displayAmount: string;
  /** 자동 계산 값. 비정량이면 undefined. 원본 ingredient 는 변경하지 않는다. */
  scaledQuantity?: number;
  wasScaled: boolean;
  /** 낱개 수량이 소수로 나와 사용자의 반올림 확인이 필요함 */
  needsRoundingCheck: boolean;
  roundedSuggestion?: number;
}

export function formatQuantity(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function scaleIngredient(ingredient: RecipeIngredient, baseServings: number, targetServings: number): ScaledIngredient {
  if (!ingredient.isScalable || ingredient.quantity == null) {
    const amount = ingredient.quantityText ?? (ingredient.quantity != null ? `${formatQuantity(ingredient.quantity)}${ingredient.unit ?? ''}` : '');
    return { ingredient, displayAmount: amount, wasScaled: false, needsRoundingCheck: false, scaledQuantity: ingredient.quantity ?? undefined };
  }
  const scaled = Math.round(((ingredient.quantity * targetServings) / baseServings) * 1000) / 1000;
  const isCount = !!ingredient.unit && COUNT_UNITS.has(ingredient.unit);
  const needsRoundingCheck = isCount && !Number.isInteger(scaled);
  return {
    ingredient,
    displayAmount: `${formatQuantity(scaled)}${ingredient.unit ?? ''}`,
    scaledQuantity: scaled,
    wasScaled: baseServings !== targetServings,
    needsRoundingCheck,
    roundedSuggestion: needsRoundingCheck ? Math.max(1, Math.round(scaled)) : undefined,
  };
}

export function scaleIngredients(ingredients: RecipeIngredient[], baseServings: number, targetServings: number): ScaledIngredient[] {
  return ingredients.map((i) => scaleIngredient(i, baseServings, targetServings));
}

/** 정의된 변환만 허용한다. 질량↔부피처럼 재료 밀도가 필요한 변환은 null. */
const UNIT_GROUPS: Record<string, number>[] = [
  { g: 1, kg: 1000 },
  { ml: 1, L: 1000 },
  { 작은술: 1, 큰술: 3 },
];

export function convertUnit(value: number, from: string, to: string): number | null {
  if (from === to) return value;
  const group = UNIT_GROUPS.find((g) => from in g && to in g);
  if (!group) return null;
  return (value * group[from]) / group[to];
}
