import type { SqlDb } from '@/infrastructure/database/sql-types';
import { MIGRATIONS, runMigrations } from '@/infrastructure/database/migrations';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import { buildBackup, clearAllData, restoreBackup } from '@/features/backup/backup-service';
import { parseBackup } from '@/features/backup/backup-format';
import { consumeItem, discardItem, filterAndSort, restoreItem, saveItem, summarize, useQuantity } from '@/features/inventory/inventory-service';
import { duplicateRecipe, logCooked, saveLinkRecipe, saveRecipe, saveStepNotes, setSettled } from '@/features/recipes/recipe-service';
import { MAX_RECIPE_VERSIONS } from '@/features/recipes/recipe-versioning';
import { hasSampleData, removeSampleData, seedSampleData } from '@/features/sample-data/sample-data';
import { bestCoverage, matchRecipes } from '@/features/fridge-matching/recipe-matcher';

import { createTestDb } from '../helpers/sqlite-db';

let db: SqlDb;
beforeEach(async () => {
  db = await createTestDb();
});

const tofu = { name: '두부', category: 'PACKAGED' as const, storageLocation: 'FRIDGE' as const };

describe('migrations', () => {
  it('is idempotent and tracks the version', async () => {
    expect(await runMigrations(db)).toBe(MIGRATIONS.length);
    expect(await runMigrations(db)).toBe(MIGRATIONS.length);
  });
  it('rolls a failed migration back as a unit', async () => {
    await expect(runMigrations(db, [...MIGRATIONS, 'CREATE TABLE half (id TEXT); THIS IS NOT SQL;'])).rejects.toThrow();
    expect(await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'half'")).toBeNull();
    expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(MIGRATIONS.length);
  });
});

describe('inventory', () => {
  it('round-trips every date field without shifting it', async () => {
    const saved = await saveItem(db, { ...tofu, purchaseDate: '2026-11-01', labelDate: '2026-11-03', labelDateType: 'USE_BY', personalReminderDate: '2026-11-02', notifyEnabled: true });
    const read = await inventoryRepository.get(db, saved.id);
    expect(read).toMatchObject({ purchaseDate: '2026-11-01', labelDate: '2026-11-03', labelDateType: 'USE_BY', personalReminderDate: '2026-11-02', notifyEnabled: true, isSample: false });
  });

  it('never fills a label date from the purchase date or storage location', async () => {
    const saved = await saveItem(db, { ...tofu, purchaseDate: '2026-11-01', storageLocation: 'FREEZER' });
    expect(saved.labelDate).toBeUndefined();
    expect(saved.personalReminderDate).toBeUndefined();
  });

  it('requires 받은 날짜 for 엄마표 and sets no default reminder', async () => {
    await expect(saveItem(db, { name: '멸치볶음', category: 'SIDE_DISH', storageLocation: 'FRIDGE', isMomSideDish: true })).rejects.toThrow('받은 날짜');
    const saved = await saveItem(db, { name: '멸치볶음', category: 'SIDE_DISH', storageLocation: 'FRIDGE', isMomSideDish: true, receivedDate: '2026-11-01' });
    expect(saved.personalReminderDate).toBeUndefined();
    expect(saved.labelDate).toBeUndefined();
  });

  it('requires a type when a label date is entered', async () => {
    await expect(saveItem(db, { ...tofu, labelDate: '2026-11-03' })).rejects.toThrow('종류');
  });

  it('rejects invalid dates and quantities', async () => {
    await expect(saveItem(db, { ...tofu, labelDate: '2026-02-30', labelDateType: 'USE_BY' })).rejects.toThrow();
    await expect(saveItem(db, { ...tofu, quantity: -1 })).rejects.toThrow('수량');
  });

  it('tracks partial use and moves to consumed at zero, then restores', async () => {
    const saved = await saveItem(db, { ...tofu, quantity: 3, unit: '모' });
    expect((await useQuantity(db, saved.id, 1)).quantity).toBe(2);
    await expect(useQuantity(db, saved.id, 5)).rejects.toThrow('남은 수량');
    await expect(useQuantity(db, saved.id, 0)).rejects.toThrow();
    const done = await useQuantity(db, saved.id, 2);
    expect(done.consumedAt).toBeDefined();
    expect(await inventoryRepository.listActive(db)).toHaveLength(0);
    await restoreItem(db, saved.id);
    expect(await inventoryRepository.listActive(db)).toHaveLength(1);
  });

  it('separates consumed from discarded', async () => {
    const a = await saveItem(db, tofu);
    const consumed = await consumeItem(db, a.id);
    expect(consumed.discardedAt).toBeUndefined();
    const discarded = await discardItem(db, a.id);
    expect(discarded.consumedAt).toBeUndefined();
    expect(discarded.discardedAt).toBeDefined();
  });

  it('filters and sorts with label dates before personal reminders', async () => {
    await saveItem(db, { ...tofu, name: '가', personalReminderDate: '2026-11-04' });
    await saveItem(db, { ...tofu, name: '나', labelDate: '2026-12-01', labelDateType: 'USE_BY' });
    await saveItem(db, { ...tofu, name: '다', storageLocation: 'FREEZER' });
    const all = await inventoryRepository.listActive(db);
    expect(filterAndSort(all, {}, '2026-11-03', 3).map((i) => i.name)).toEqual(['나', '가', '다']);
    expect(filterAndSort(all, { storage: 'FREEZER' }, '2026-11-03', 3).map((i) => i.name)).toEqual(['다']);
    expect(filterAndSort(all, { query: '가' }, '2026-11-03', 3).map((i) => i.name)).toEqual(['가']);
    expect(filterAndSort(all, { sort: 'NAME' }, '2026-11-03', 3).map((i) => i.name)).toEqual(['가', '나', '다']);
  });

  it('filters by 500 items within a reasonable time on desktop', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ ...(tofu as object), id: `${i}`, name: `재료${i}`, isOpened: false, isMomSideDish: false, notifyEnabled: false, isSample: false, createdAt: '', updatedAt: '' })) as never[];
    const started = Date.now();
    filterAndSort(items, { query: '재료9' }, '2026-11-03', 3);
    expect(Date.now() - started).toBeLessThan(500);
  });
});

describe('recipes', () => {
  const input = {
    title: '두부조림',
    category: '반찬' as const,
    baseServings: 2,
    ingredients: [{ displayName: '달걀', quantity: 2, unit: '개' }, { displayName: '소금', quantityText: '약간' }],
    steps: [{ instruction: '굽는다' }],
  };

  it('stores structured ingredients and marks non-quantified ones', async () => {
    const r = await saveRecipe(db, input);
    const d = (await recipeRepository.get(db, r.id))!;
    expect(d.ingredients[0]).toMatchObject({ ingredientId: '계란', isScalable: true, quantity: 2 });
    expect(d.ingredients[1]).toMatchObject({ quantityText: '약간', isScalable: false });
    expect(d.ingredients[1].quantity).toBeUndefined();
  });

  it('saves step notes and keeps the history', async () => {
    const r = await saveRecipe(db, input);
    const d = (await recipeRepository.get(db, r.id))!;
    await saveStepNotes(db, r.id, { [d.steps[0].id]: '중불 3분 더' });
    const after = (await recipeRepository.get(db, r.id))!;
    expect(after.steps[0].personalNote).toBe('중불 3분 더');
    expect(after.versions[0].snapshot.steps[0].personalNote).toBe('중불 3분 더');
    expect(after.versions[1].snapshot.steps[0].personalNote).toBeUndefined();
  });

  it('settles and unsettles, keeping the representative version beyond the limit', async () => {
    const r = await saveRecipe(db, input);
    const settled = await setSettled(db, r.id, true);
    expect(settled.recipe.isSettled).toBe(true);
    const representative = settled.recipe.settledVersionId!;
    for (let i = 0; i < MAX_RECIPE_VERSIONS + 2; i++) await saveStepNotes(db, r.id, {}, new Date(Date.now() + (i + 1) * 1000));
    const after = (await recipeRepository.get(db, r.id))!;
    expect(after.versions.some((v) => v.id === representative)).toBe(true);
    expect(after.versions.length).toBeLessThanOrEqual(MAX_RECIPE_VERSIONS + 1);
    const off = await setSettled(db, r.id, false);
    expect(off.recipe.isSettled).toBe(false);
    expect(off.recipe.settledVersionId).toBeUndefined();
  });

  it('duplicates without settling the copy', async () => {
    const r = await saveRecipe(db, input);
    await setSettled(db, r.id, true);
    const copy = await duplicateRecipe(db, r.id);
    const d = (await recipeRepository.get(db, copy.id))!;
    expect(copy.isSettled).toBe(false);
    expect(d.ingredients).toHaveLength(2);
  });

  it('stores only URL, own title and note for links', async () => {
    const r = await saveLinkRecipe(db, { url: 'youtu.be/abc', title: '내가 쓴 제목', note: '메모', tags: '찌개' }, 2);
    const d = (await recipeRepository.get(db, r.id))!;
    expect(d.recipe.sourceUrl).toBe('https://youtu.be/abc');
    expect(d.recipe.imageUri).toBeUndefined();
    expect(d.ingredients).toHaveLength(0);
    expect(d.steps).toHaveLength(0);
  });

  it('records cook logs and cascades on delete', async () => {
    const r = await saveRecipe(db, input);
    await logCooked(db, r.id, 2);
    expect((await recipeRepository.get(db, r.id))!.cookLogs).toHaveLength(1);
    await recipeRepository.remove(db, r.id);
    expect(await db.getAllAsync('SELECT * FROM recipe_steps')).toHaveLength(0);
  });
});

describe('sample data', () => {
  it('matches the UX board counts and stays separate', async () => {
    await seedSampleData(db, new Date('2026-11-03T03:00:00Z'));
    const items = await inventoryRepository.listActive(db);
    const summary = summarize(items, 7, '2026-11-03');
    expect(summary.total).toBe(12);
    expect(summary.counts).toEqual({ FRESH: 7, SIDE: 3, PROCESSED: 2 });
    expect(items.every((i) => i.isSample)).toBe(true);
    expect(filterAndSort(items, {}, '2026-11-03', 7).slice(0, 4).map((i) => i.name)).toEqual(['토마토', '상추', '계란', '김치']);
    expect(summary.attention.map((i) => i.name)).toEqual(['토마토', '상추', '멸치볶음']);
  });

  it('recommends the same recipes as the board', async () => {
    await seedSampleData(db, new Date('2026-11-03T03:00:00Z'));
    const matches = matchRecipes(await recipeRepository.list(db), await recipeRepository.allIngredients(db), await inventoryRepository.listActive(db), { today: '2026-11-03', leadDays: 7 });
    expect(matches[0].recipe.title).toBe('토마토 달걀볶음');
    expect(bestCoverage(matches)?.recipe.title).toBe('냉장고 속 재료로 간단한 볶음밥');
  });

  it('is removed in one step and never touches real data', async () => {
    await seedSampleData(db);
    const mine = await saveItem(db, tofu);
    expect(await hasSampleData(db)).toBe(true);
    await removeSampleData(db);
    expect(await hasSampleData(db)).toBe(false);
    expect((await inventoryRepository.listActive(db)).map((i) => i.id)).toEqual([mine.id]);
    expect(await recipeRepository.list(db)).toHaveLength(0);
  });
});

describe('backup', () => {
  it('round-trips real data, leaves samples out and marks the date source', async () => {
    await seedSampleData(db);
    await saveItem(db, { ...tofu, labelDate: '2026-11-03', labelDateType: 'USE_BY', note: '메모' });
    const recipe = await saveRecipe(db, { title: '찌개', category: '국·찌개', baseServings: 2, ingredients: [{ displayName: '두부', quantity: 1, unit: '모' }], steps: [{ instruction: '끓인다', personalNote: '약불' }] });
    await logCooked(db, recipe.id, 2);
    const text = JSON.stringify(await buildBackup(db));

    await clearAllData(db);
    expect(await inventoryRepository.listActive(db)).toHaveLength(0);

    const report = await restoreBackup(db, parseBackup(text));
    expect(report).toEqual({ items: 1, recipes: 1 });
    const [item] = await inventoryRepository.listActive(db);
    expect(item).toMatchObject({ name: '두부', labelDate: '2026-11-03', dateSource: 'IMPORTED_BACKUP', note: '메모' });
    const d = (await recipeRepository.get(db, recipe.id))!;
    expect(d.steps[0].personalNote).toBe('약불');
    expect(d.cookLogs).toHaveLength(1);
    expect((await settingsRepository.get(db)).onboardingDone).toBe(true);
  });

  it('rejects foreign or damaged files', () => {
    expect(() => parseBackup('nope')).toThrow('읽을 수 없어요');
    expect(() => parseBackup('{"app":"other"}')).toThrow('백업 파일이 아니에요');
    expect(() => parseBackup('{"app":"jubu-1dan","version":99}')).toThrow('버전');
    const bad = { app: 'jubu-1dan', version: 1, items: [{ id: 'a', name: 'b', labelDate: '2026-02-30' }], recipes: [], ingredients: [], steps: [], cookLogs: [] };
    expect(() => parseBackup(JSON.stringify(bad))).toThrow('날짜');
  });

  it('keeps existing data when a restore fails midway', async () => {
    await saveItem(db, tofu);
    const broken = { app: 'jubu-1dan', version: 1, exportedAt: '', settings: {}, items: [{ id: 'x' }], recipes: [], ingredients: [], steps: [], cookLogs: [] };
    await expect(restoreBackup(db, broken as never)).rejects.toThrow();
    expect(await inventoryRepository.listActive(db)).toHaveLength(1);
  });
});
