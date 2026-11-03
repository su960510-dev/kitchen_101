import { DEFAULT_SETTINGS, type HouseholdSettings } from '@/domain/models';

import type { SqlDb } from '../sql-types';

const KEY = 'household';

export const settingsRepository = {
  async get(db: SqlDb): Promise<HouseholdSettings> {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [KEY]);
    if (!row) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<HouseholdSettings>) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  async save(db: SqlDb, settings: HouseholdSettings): Promise<void> {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [KEY, JSON.stringify(settings)]);
  },
  async getSynonyms(db: SqlDb): Promise<Record<string, string>> {
    const rows = await db.getAllAsync<{ alias: string; ingredient_id: string }>('SELECT alias, ingredient_id FROM ingredient_synonyms');
    return Object.fromEntries(rows.map((r) => [r.alias, r.ingredient_id]));
  },
};
