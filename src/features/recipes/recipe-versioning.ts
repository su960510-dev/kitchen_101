import type { RecipeIngredient, RecipeSnapshot, RecipeStep } from '@/domain/models';

/** 덮어쓰지 않고 최근 5개 버전을 남긴다. 정착으로 지정한 대표 버전은 별도로 보존한다. */
export const MAX_RECIPE_VERSIONS = 5;

export function makeSnapshot(title: string, baseServings: number, ingredients: RecipeIngredient[], steps: RecipeStep[]): RecipeSnapshot {
  return {
    title,
    baseServings,
    ingredients: ingredients.map(({ id: _id, recipeId: _r, ...rest }) => rest),
    steps: steps.map(({ id: _id, recipeId: _r, ...rest }) => rest),
  };
}
