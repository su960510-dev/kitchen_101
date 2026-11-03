import type { RecipeIngredient } from '@/domain/models';
import { convertUnit, scaleIngredient, scaleIngredients } from '@/features/recipes/recipe-scaling';

const ing = (over: Partial<RecipeIngredient>): RecipeIngredient => ({ id: 'i', recipeId: 'r', displayName: '재료', isScalable: true, sortOrder: 0, ...over });

describe('recipe scaling', () => {
  it.each([
    [2, 1, 100],
    [2, 2, 200],
    [2, 4, 400],
  ])('scales %d인 → %d인', (base, target, expected) => {
    expect(scaleIngredient(ing({ quantity: 200, unit: 'g' }), base, target).scaledQuantity).toBe(expected);
  });

  it('leaves non-quantified ingredients untouched', () => {
    const r = scaleIngredient(ing({ quantityText: '약간', isScalable: false }), 2, 8);
    expect(r.displayAmount).toBe('약간');
    expect(r.wasScaled).toBe(false);
  });

  it('does not mutate the original ingredient', () => {
    const original = ing({ quantity: 2, unit: '개' });
    const frozen = Object.freeze({ ...original });
    scaleIngredients([frozen], 2, 4);
    expect(frozen.quantity).toBe(2);
  });

  it('asks for a rounding check on fractional counts', () => {
    const r = scaleIngredient(ing({ quantity: 3, unit: '개' }), 2, 3);
    expect(r.displayAmount).toBe('4.5개');
    expect(r.needsRoundingCheck).toBe(true);
    expect(r.roundedSuggestion).toBe(5);
  });

  it('does not ask for rounding on mass units', () => {
    expect(scaleIngredient(ing({ quantity: 100, unit: 'g' }), 3, 2).needsRoundingCheck).toBe(false);
  });

  it('only converts defined unit pairs', () => {
    expect(convertUnit(1.5, 'kg', 'g')).toBe(1500);
    expect(convertUnit(1, '큰술', '작은술')).toBe(3);
    expect(convertUnit(100, 'g', 'ml')).toBeNull();
    expect(convertUnit(1, '컵', 'g')).toBeNull();
  });
});
