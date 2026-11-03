import { todayKst } from '@/domain/date-only';
import { DEFAULT_SETTINGS } from '@/domain/models';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import type { SqlDb } from '@/infrastructure/database/sql-types';

import { BACKUP_APP, BACKUP_VERSION, type BackupV1 } from './backup-format';

/** 예시 데이터는 백업하지 않는다. */
export async function buildBackup(db: SqlDb, now = new Date()): Promise<BackupV1> {
  const items = (await inventoryRepository.listAll(db)).filter((i) => !i.isSample);
  const recipes = (await recipeRepository.list(db)).filter((r) => !r.isSample);
  const ids = new Set(recipes.map((r) => r.id));
  const ingredients = (await recipeRepository.allIngredients(db)).filter((i) => ids.has(i.recipeId));
  const stepRows = await db.getAllAsync<{ id: string; recipe_id: string; instruction: string; sort_order: number; personal_note: string | null }>('SELECT * FROM recipe_steps ORDER BY recipe_id, sort_order');
  const logRows = await db.getAllAsync<{ id: string; recipe_id: string; cooked_at: string; servings: number; note: string | null }>('SELECT * FROM recipe_cook_logs');
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings: await settingsRepository.get(db),
    items,
    recipes,
    ingredients,
    steps: stepRows
      .filter((s) => ids.has(s.recipe_id))
      .map((s) => ({ id: s.id, recipeId: s.recipe_id, instruction: s.instruction, sortOrder: s.sort_order, personalNote: s.personal_note ?? undefined })),
    cookLogs: logRows
      .filter((l) => ids.has(l.recipe_id))
      .map((l) => ({ id: l.id, recipeId: l.recipe_id, cookedAt: l.cooked_at, servings: l.servings, note: l.note ?? undefined })),
  };
}

export async function clearAllData(db: SqlDb): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM inventory_items; DELETE FROM recipes; DELETE FROM ingredient_synonyms; DELETE FROM settings;');
  });
}

/** 현재 데이터를 백업 내용으로 교체한다. 한 트랜잭션이라 실패하면 기존 데이터가 유지된다. */
export async function restoreBackup(db: SqlDb, backup: BackupV1): Promise<{ items: number; recipes: number }> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM inventory_items; DELETE FROM recipes;');
    for (const item of backup.items) {
      await inventoryRepository.upsert(db, { ...item, isSample: false, dateSource: item.labelDate ? 'IMPORTED_BACKUP' : undefined });
    }
    for (const recipe of backup.recipes) {
      await recipeRepository.upsertRecipe(db, { ...recipe, isSample: false });
      await recipeRepository.replaceIngredients(db, recipe.id, backup.ingredients.filter((i) => i.recipeId === recipe.id));
      await recipeRepository.replaceSteps(db, recipe.id, backup.steps.filter((s) => s.recipeId === recipe.id));
    }
    for (const log of backup.cookLogs) await recipeRepository.insertCookLog(db, log);
    await settingsRepository.save(db, { ...DEFAULT_SETTINGS, ...backup.settings, onboardingDone: true });
  });
  return { items: backup.items.length, recipes: backup.recipes.length };
}

export function backupFileName(now = new Date()): string {
  return `jubu1dan-backup-${todayKst(now)}.json`;
}
