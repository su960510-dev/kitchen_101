import type { Recipe, RecipeCookLog, RecipeDetail, RecipeIngredient, RecipeSnapshot, RecipeStep, RecipeVersion } from '@/domain/models';

import type { SqlDb } from '../sql-types';

type Row = Record<string, string | number | null>;

const str = (v: string | number | null | undefined) => (v == null ? undefined : String(v));
const num = (v: string | number | null | undefined) => (v == null ? undefined : Number(v));

function recipeFromRow(r: Row): Recipe {
  return {
    id: String(r.id),
    title: String(r.title),
    category: r.category as Recipe['category'],
    baseServings: Number(r.base_servings),
    prepMinutes: num(r.prep_minutes),
    cookMinutes: num(r.cook_minutes),
    difficulty: str(r.difficulty) as Recipe['difficulty'],
    sourceUrl: str(r.source_url),
    userProvidedSourceTitle: str(r.user_provided_source_title),
    note: str(r.note),
    tags: str(r.tags),
    imageUri: str(r.image_uri),
    sampleAssetKey: str(r.sample_asset_key),
    isSettled: r.is_settled === 1,
    settledAt: str(r.settled_at),
    settledVersionId: str(r.settled_version_id),
    isSample: r.is_sample === 1,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function ingredientFromRow(r: Row): RecipeIngredient {
  return {
    id: String(r.id),
    recipeId: String(r.recipe_id),
    ingredientId: str(r.ingredient_id),
    displayName: String(r.display_name),
    quantity: num(r.quantity),
    unit: str(r.unit),
    quantityText: str(r.quantity_text),
    isScalable: r.is_scalable === 1,
    note: str(r.note),
    sampleAssetKey: str(r.sample_asset_key),
    sortOrder: Number(r.sort_order),
  };
}

function stepFromRow(r: Row): RecipeStep {
  return {
    id: String(r.id),
    recipeId: String(r.recipe_id),
    instruction: String(r.instruction),
    sortOrder: Number(r.sort_order),
    personalNote: str(r.personal_note),
  };
}

export const recipeRepository = {
  async list(db: SqlDb): Promise<Recipe[]> {
    const rows = await db.getAllAsync<Row>('SELECT * FROM recipes ORDER BY is_settled DESC, created_at ASC');
    return rows.map(recipeFromRow);
  },
  async allIngredients(db: SqlDb): Promise<RecipeIngredient[]> {
    const rows = await db.getAllAsync<Row>('SELECT * FROM recipe_ingredients ORDER BY recipe_id, sort_order');
    return rows.map(ingredientFromRow);
  },
  async get(db: SqlDb, id: string): Promise<RecipeDetail | null> {
    const row = await db.getFirstAsync<Row>('SELECT * FROM recipes WHERE id = ?', [id]);
    if (!row) return null;
    const ingredients = await db.getAllAsync<Row>('SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order', [id]);
    const steps = await db.getAllAsync<Row>('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY sort_order', [id]);
    const logs = await db.getAllAsync<Row>('SELECT * FROM recipe_cook_logs WHERE recipe_id = ? ORDER BY cooked_at DESC', [id]);
    const versions = await db.getAllAsync<Row>('SELECT * FROM recipe_versions WHERE recipe_id = ? ORDER BY created_at DESC, rowid DESC', [id]);
    return {
      recipe: recipeFromRow(row),
      ingredients: ingredients.map(ingredientFromRow),
      steps: steps.map(stepFromRow),
      cookLogs: logs.map(
        (l): RecipeCookLog => ({ id: String(l.id), recipeId: String(l.recipe_id), cookedAt: String(l.cooked_at), servings: Number(l.servings), note: str(l.note) }),
      ),
      versions: versions.map(
        (v): RecipeVersion => ({
          id: String(v.id),
          recipeId: String(v.recipe_id),
          label: String(v.label),
          snapshot: JSON.parse(String(v.snapshot_json)) as RecipeSnapshot,
          createdAt: String(v.created_at),
        }),
      ),
    };
  },
  async upsertRecipe(db: SqlDb, r: Recipe): Promise<void> {
    await db.runAsync(
      `INSERT INTO recipes (id, title, category, base_servings, prep_minutes, cook_minutes, difficulty, source_url, user_provided_source_title,
        note, tags, image_uri, sample_asset_key, is_settled, settled_at, settled_version_id, is_sample, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, category = excluded.category, base_servings = excluded.base_servings,
        prep_minutes = excluded.prep_minutes, cook_minutes = excluded.cook_minutes, difficulty = excluded.difficulty,
        source_url = excluded.source_url, user_provided_source_title = excluded.user_provided_source_title, note = excluded.note,
        tags = excluded.tags, image_uri = excluded.image_uri, sample_asset_key = excluded.sample_asset_key, is_settled = excluded.is_settled,
        settled_at = excluded.settled_at, settled_version_id = excluded.settled_version_id, is_sample = excluded.is_sample, updated_at = excluded.updated_at`,
      [
        r.id, r.title, r.category, r.baseServings, r.prepMinutes ?? null, r.cookMinutes ?? null, r.difficulty ?? null, r.sourceUrl ?? null,
        r.userProvidedSourceTitle ?? null, r.note ?? null, r.tags ?? null, r.imageUri ?? null, r.sampleAssetKey ?? null, r.isSettled ? 1 : 0,
        r.settledAt ?? null, r.settledVersionId ?? null, r.isSample ? 1 : 0, r.createdAt, r.updatedAt,
      ],
    );
  },
  async replaceIngredients(db: SqlDb, recipeId: string, ingredients: RecipeIngredient[]): Promise<void> {
    await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
    for (const i of ingredients) {
      await db.runAsync(
        `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, display_name, quantity, unit, quantity_text, is_scalable, note, sample_asset_key, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [i.id, recipeId, i.ingredientId ?? null, i.displayName, i.quantity ?? null, i.unit ?? null, i.quantityText ?? null, i.isScalable ? 1 : 0, i.note ?? null, i.sampleAssetKey ?? null, i.sortOrder],
      );
    }
  },
  async replaceSteps(db: SqlDb, recipeId: string, steps: RecipeStep[]): Promise<void> {
    await db.runAsync('DELETE FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
    for (const s of steps) {
      await db.runAsync('INSERT INTO recipe_steps (id, recipe_id, instruction, sort_order, personal_note) VALUES (?, ?, ?, ?, ?)', [
        s.id, recipeId, s.instruction, s.sortOrder, s.personalNote ?? null,
      ]);
    }
  },
  async updateStepNote(db: SqlDb, stepId: string, note: string | undefined): Promise<void> {
    await db.runAsync('UPDATE recipe_steps SET personal_note = ? WHERE id = ?', [note ?? null, stepId]);
  },
  async insertCookLog(db: SqlDb, log: RecipeCookLog): Promise<void> {
    await db.runAsync('INSERT INTO recipe_cook_logs (id, recipe_id, cooked_at, servings, note) VALUES (?, ?, ?, ?, ?)', [
      log.id, log.recipeId, log.cookedAt, log.servings, log.note ?? null,
    ]);
  },
  async lastCookLogs(db: SqlDb): Promise<{ recipe_id: string; last: string; times: number }[]> {
    return db.getAllAsync('SELECT recipe_id, MAX(cooked_at) AS last, COUNT(*) AS times FROM recipe_cook_logs GROUP BY recipe_id');
  },
  async insertVersion(db: SqlDb, version: RecipeVersion, keep: number): Promise<void> {
    await db.runAsync('INSERT INTO recipe_versions (id, recipe_id, label, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?)', [
      version.id, version.recipeId, version.label, JSON.stringify(version.snapshot), version.createdAt,
    ]);
    // 대표(정착) 버전은 개수 제한으로 지우지 않는다.
    await db.runAsync(
      `DELETE FROM recipe_versions WHERE recipe_id = ?
         AND id NOT IN (SELECT id FROM recipe_versions WHERE recipe_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?)
         AND id NOT IN (SELECT COALESCE(settled_version_id, '') FROM recipes WHERE id = ?)`,
      [version.recipeId, version.recipeId, keep, version.recipeId],
    );
  },
  async remove(db: SqlDb, id: string): Promise<void> {
    await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
  },
  async removeSamples(db: SqlDb): Promise<void> {
    await db.runAsync('DELETE FROM recipes WHERE is_sample = 1');
  },
};
