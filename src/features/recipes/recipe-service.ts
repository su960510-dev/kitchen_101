import { todayKst } from '@/domain/date-only';
import { AppError } from '@/domain/errors';
import type { Recipe, RecipeCategory, RecipeDetail, RecipeDifficulty, RecipeIngredient, RecipeStep, RecipeVersion } from '@/domain/models';
import { newId, requireName, requirePositiveInt } from '@/domain/validation';
import { normalizeIngredient } from '@/features/fridge-matching/ingredient-normalizer';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import type { SqlDb } from '@/infrastructure/database/sql-types';

import { normalizeRecipeUrl } from './recipe-source-links';
import { makeSnapshot, MAX_RECIPE_VERSIONS } from './recipe-versioning';

export interface IngredientInput {
  displayName: string;
  quantity?: number;
  unit?: string;
  quantityText?: string;
  note?: string;
}

export interface RecipeInput {
  id?: string;
  title: string;
  category: RecipeCategory;
  baseServings: number;
  prepMinutes?: number;
  cookMinutes?: number;
  difficulty?: RecipeDifficulty;
  sourceUrl?: string;
  userProvidedSourceTitle?: string;
  note?: string;
  imageUri?: string;
  ingredients: IngredientInput[];
  steps: { instruction: string; personalNote?: string }[];
}

function buildIngredients(recipeId: string, inputs: IngredientInput[], previous: RecipeIngredient[] = []): RecipeIngredient[] {
  return inputs
    .filter((i) => i.displayName.trim())
    .map((i, index) => {
      const quantityText = i.quantityText?.trim() || undefined;
      const hasNumber = i.quantity != null && Number.isFinite(i.quantity) && i.quantity > 0;
      const name = i.displayName.trim();
      return {
        id: newId('ing_'),
        recipeId,
        ingredientId: normalizeIngredient(name),
        displayName: name,
        quantity: hasNumber ? i.quantity : undefined,
        unit: hasNumber ? i.unit?.trim() || undefined : undefined,
        quantityText: hasNumber ? undefined : quantityText,
        isScalable: hasNumber,
        note: i.note?.trim() || undefined,
        sampleAssetKey: previous.find((p) => p.displayName === name)?.sampleAssetKey,
        sortOrder: index,
      };
    });
}

function buildSteps(recipeId: string, inputs: RecipeInput['steps']): RecipeStep[] {
  return inputs
    .filter((s) => s.instruction.trim())
    .map((s, index) => ({
      id: newId('stp_'),
      recipeId,
      instruction: s.instruction.trim(),
      sortOrder: index,
      personalNote: s.personalNote?.trim() || undefined,
    }));
}

async function addVersion(db: SqlDb, recipeId: string, label: string, title: string, baseServings: number, ingredients: RecipeIngredient[], steps: RecipeStep[], now: Date): Promise<RecipeVersion> {
  const version: RecipeVersion = {
    id: newId('ver_'),
    recipeId,
    label,
    snapshot: makeSnapshot(title, baseServings, ingredients, steps),
    createdAt: now.toISOString(),
  };
  await recipeRepository.insertVersion(db, version, MAX_RECIPE_VERSIONS);
  return version;
}

export async function saveRecipe(db: SqlDb, input: RecipeInput, now = new Date()): Promise<Recipe> {
  const existing = input.id ? await recipeRepository.get(db, input.id) : null;
  const iso = now.toISOString();
  const id = existing?.recipe.id ?? input.id ?? newId('rec_');
  const recipe: Recipe = {
    id,
    title: requireName(input.title, '레시피 이름'),
    category: input.category,
    baseServings: requirePositiveInt(input.baseServings, '기준 인원수'),
    prepMinutes: input.prepMinutes,
    cookMinutes: input.cookMinutes,
    difficulty: input.difficulty,
    sourceUrl: input.sourceUrl ? normalizeRecipeUrl(input.sourceUrl) : undefined,
    userProvidedSourceTitle: input.userProvidedSourceTitle?.trim() || undefined,
    note: input.note?.trim() || undefined,
    imageUri: input.imageUri,
    sampleAssetKey: existing?.recipe.sampleAssetKey,
    tags: existing?.recipe.tags,
    isSettled: existing?.recipe.isSettled ?? false,
    settledAt: existing?.recipe.settledAt,
    settledVersionId: existing?.recipe.settledVersionId,
    isSample: existing?.recipe.isSample ?? false,
    createdAt: existing?.recipe.createdAt ?? iso,
    updatedAt: iso,
  };
  const ingredients = buildIngredients(id, input.ingredients, existing?.ingredients);
  const steps = buildSteps(id, input.steps);
  await db.withTransactionAsync(async () => {
    await recipeRepository.upsertRecipe(db, recipe);
    await recipeRepository.replaceIngredients(db, id, ingredients);
    await recipeRepository.replaceSteps(db, id, steps);
    await addVersion(db, id, existing ? '수정' : '처음 등록', recipe.title, recipe.baseServings, ingredients, steps, now);
  });
  return recipe;
}

/** 링크 저장: URL, 직접 쓴 제목, 메모만 저장한다. */
export async function saveLinkRecipe(db: SqlDb, input: { url: string; title: string; note?: string; tags?: string }, defaultServings: number, now = new Date()): Promise<Recipe> {
  const url = normalizeRecipeUrl(input.url);
  const title = requireName(input.title, '제목');
  const saved = await saveRecipe(db, { title, category: '기타', baseServings: defaultServings, sourceUrl: url, userProvidedSourceTitle: title, note: input.note, ingredients: [], steps: [] }, now);
  if (input.tags?.trim()) {
    const withTags = { ...saved, tags: input.tags.trim() };
    await recipeRepository.upsertRecipe(db, withTags);
    return withTags;
  }
  return saved;
}

/** 내 레시피로 복제. 예시 레시피를 수정하려면 복제본을 만든다. */
export async function duplicateRecipe(db: SqlDb, id: string, now = new Date()): Promise<Recipe> {
  const detail = await recipeRepository.get(db, id);
  if (!detail) throw new AppError('not-found', '레시피를 찾을 수 없어요.');
  const iso = now.toISOString();
  const newRecipeId = newId('rec_');
  const copy: Recipe = {
    ...detail.recipe,
    id: newRecipeId,
    title: detail.recipe.isSample ? detail.recipe.title : `${detail.recipe.title} (복사본)`,
    isSample: false,
    isSettled: false,
    settledAt: undefined,
    settledVersionId: undefined,
    createdAt: iso,
    updatedAt: iso,
  };
  const ingredients = detail.ingredients.map((i) => ({ ...i, id: newId('ing_'), recipeId: newRecipeId }));
  const steps = detail.steps.map((s) => ({ ...s, id: newId('stp_'), recipeId: newRecipeId }));
  await db.withTransactionAsync(async () => {
    await recipeRepository.upsertRecipe(db, copy);
    await recipeRepository.replaceIngredients(db, newRecipeId, ingredients);
    await recipeRepository.replaceSteps(db, newRecipeId, steps);
    await addVersion(db, newRecipeId, '복제', copy.title, copy.baseServings, ingredients, steps, now);
  });
  return copy;
}

export async function saveStepNotes(db: SqlDb, recipeId: string, notes: Record<string, string>, now = new Date()): Promise<void> {
  const detail = await recipeRepository.get(db, recipeId);
  if (!detail) throw new AppError('not-found', '레시피를 찾을 수 없어요.');
  await db.withTransactionAsync(async () => {
    for (const step of detail.steps) {
      if (step.id in notes) await recipeRepository.updateStepNote(db, step.id, notes[step.id].trim() || undefined);
    }
    const steps = detail.steps.map((s) => (s.id in notes ? { ...s, personalNote: notes[s.id].trim() || undefined } : s));
    await addVersion(db, recipeId, '메모 수정', detail.recipe.title, detail.recipe.baseServings, detail.ingredients, steps, now);
    await recipeRepository.upsertRecipe(db, { ...detail.recipe, updatedAt: now.toISOString() });
  });
}

/** 정착은 사용자가 직접 부여하는 개인 상태다. 현재 버전을 대표로 남긴다. */
export async function setSettled(db: SqlDb, recipeId: string, settled: boolean, now = new Date()): Promise<RecipeDetail> {
  const detail = await recipeRepository.get(db, recipeId);
  if (!detail) throw new AppError('not-found', '레시피를 찾을 수 없어요.');
  const iso = now.toISOString();
  await db.withTransactionAsync(async () => {
    if (settled) {
      const version = await addVersion(db, recipeId, '정착 완료', detail.recipe.title, detail.recipe.baseServings, detail.ingredients, detail.steps, now);
      await recipeRepository.upsertRecipe(db, { ...detail.recipe, isSettled: true, settledAt: iso, settledVersionId: version.id, updatedAt: iso });
    } else {
      await recipeRepository.upsertRecipe(db, { ...detail.recipe, isSettled: false, settledAt: undefined, settledVersionId: undefined, updatedAt: iso });
    }
  });
  return (await recipeRepository.get(db, recipeId))!;
}

export async function logCooked(db: SqlDb, recipeId: string, servings: number, note?: string, now = new Date()): Promise<void> {
  await recipeRepository.insertCookLog(db, { id: newId('log_'), recipeId, cookedAt: todayKst(now), servings: requirePositiveInt(servings, '인원수'), note: note?.trim() || undefined });
}
