import type { SqlDb } from '../sql-types';

/** 배열 순서가 곧 스키마 버전(PRAGMA user_version). 이미 배포한 항목은 수정하지 않고 뒤에 추가한다. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_ingredient_id TEXT,
    category TEXT NOT NULL,
    storage_location TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    purchase_date TEXT,
    received_date TEXT,
    opened_date TEXT,
    cooked_date TEXT,
    label_date TEXT,
    label_date_type TEXT,
    personal_reminder_date TEXT,
    date_source TEXT,
    notify_enabled INTEGER NOT NULL DEFAULT 0,
    is_mom_side_dish INTEGER NOT NULL DEFAULT 0,
    is_opened INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    local_photo_uri TEXT,
    sample_asset_key TEXT,
    ocr_text TEXT,
    is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    consumed_at TEXT,
    discarded_at TEXT
  );
  CREATE INDEX idx_inventory_active ON inventory_items (consumed_at, discarded_at, label_date);

  CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    base_servings INTEGER NOT NULL,
    prep_minutes INTEGER,
    cook_minutes INTEGER,
    difficulty TEXT,
    source_url TEXT,
    user_provided_source_title TEXT,
    note TEXT,
    tags TEXT,
    image_uri TEXT,
    sample_asset_key TEXT,
    is_settled INTEGER NOT NULL DEFAULT 0,
    settled_at TEXT,
    settled_version_id TEXT,
    is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE recipe_ingredients (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT,
    display_name TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    quantity_text TEXT,
    is_scalable INTEGER NOT NULL DEFAULT 1,
    note TEXT,
    sample_asset_key TEXT,
    sort_order INTEGER NOT NULL
  );
  CREATE INDEX idx_ingredients_recipe ON recipe_ingredients (recipe_id, sort_order);

  CREATE TABLE recipe_steps (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    instruction TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    personal_note TEXT
  );
  CREATE INDEX idx_steps_recipe ON recipe_steps (recipe_id, sort_order);

  CREATE TABLE recipe_cook_logs (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    cooked_at TEXT NOT NULL,
    servings INTEGER NOT NULL,
    note TEXT
  );

  CREATE TABLE recipe_versions (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_versions_recipe ON recipe_versions (recipe_id, created_at);

  CREATE TABLE ingredient_synonyms (
    alias TEXT PRIMARY KEY,
    ingredient_id TEXT NOT NULL
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export async function runMigrations(db: SqlDb, migrations: string[] = MIGRATIONS): Promise<number> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < migrations.length) {
    // 마이그레이션과 버전 증가를 함께 커밋해 중간 실패 시 반쯤 적용된 상태를 남기지 않는다.
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrations[next - 1]);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
  return version;
}
