import type { FoodInventoryItem } from '@/domain/models';

import type { SqlDb, SqlValue } from '../sql-types';

type Row = Record<string, string | number | null>;

const COLUMNS: [keyof FoodInventoryItem, string][] = [
  ['id', 'id'],
  ['name', 'name'],
  ['normalizedIngredientId', 'normalized_ingredient_id'],
  ['category', 'category'],
  ['storageLocation', 'storage_location'],
  ['quantity', 'quantity'],
  ['unit', 'unit'],
  ['purchaseDate', 'purchase_date'],
  ['receivedDate', 'received_date'],
  ['openedDate', 'opened_date'],
  ['cookedDate', 'cooked_date'],
  ['labelDate', 'label_date'],
  ['labelDateType', 'label_date_type'],
  ['personalReminderDate', 'personal_reminder_date'],
  ['dateSource', 'date_source'],
  ['notifyEnabled', 'notify_enabled'],
  ['isMomSideDish', 'is_mom_side_dish'],
  ['isOpened', 'is_opened'],
  ['note', 'note'],
  ['localPhotoUri', 'local_photo_uri'],
  ['sampleAssetKey', 'sample_asset_key'],
  ['ocrText', 'ocr_text'],
  ['isSample', 'is_sample'],
  ['createdAt', 'created_at'],
  ['updatedAt', 'updated_at'],
  ['consumedAt', 'consumed_at'],
  ['discardedAt', 'discarded_at'],
];
const BOOLEAN_KEYS: (keyof FoodInventoryItem)[] = ['notifyEnabled', 'isMomSideDish', 'isOpened', 'isSample'];

function fromRow(row: Row): FoodInventoryItem {
  const item: Record<string, unknown> = {};
  for (const [key, column] of COLUMNS) {
    const value = row[column];
    if (BOOLEAN_KEYS.includes(key)) item[key] = value === 1;
    else if (value != null) item[key] = value;
  }
  return item as unknown as FoodInventoryItem;
}

function toValues(item: FoodInventoryItem): SqlValue[] {
  return COLUMNS.map(([key]) => {
    const value = item[key];
    if (typeof value === 'boolean') return value ? 1 : 0;
    return (value as SqlValue | undefined) ?? null;
  });
}

const ACTIVE = 'consumed_at IS NULL AND discarded_at IS NULL';

export const inventoryRepository = {
  async listActive(db: SqlDb): Promise<FoodInventoryItem[]> {
    const rows = await db.getAllAsync<Row>(`SELECT * FROM inventory_items WHERE ${ACTIVE}`);
    return rows.map(fromRow);
  },
  async listAll(db: SqlDb): Promise<FoodInventoryItem[]> {
    const rows = await db.getAllAsync<Row>('SELECT * FROM inventory_items');
    return rows.map(fromRow);
  },
  async listFinished(db: SqlDb): Promise<FoodInventoryItem[]> {
    const rows = await db.getAllAsync<Row>(`SELECT * FROM inventory_items WHERE NOT (${ACTIVE}) ORDER BY updated_at DESC LIMIT 50`);
    return rows.map(fromRow);
  },
  async get(db: SqlDb, id: string): Promise<FoodInventoryItem | null> {
    const row = await db.getFirstAsync<Row>('SELECT * FROM inventory_items WHERE id = ?', [id]);
    return row ? fromRow(row) : null;
  },
  async upsert(db: SqlDb, item: FoodInventoryItem): Promise<void> {
    const columns = COLUMNS.map(([, c]) => c);
    const updates = columns.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ');
    await db.runAsync(
      `INSERT INTO inventory_items (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})
       ON CONFLICT(id) DO UPDATE SET ${updates}`,
      toValues(item),
    );
  },
  async remove(db: SqlDb, id: string): Promise<void> {
    await db.runAsync('DELETE FROM inventory_items WHERE id = ?', [id]);
  },
  async removeSamples(db: SqlDb): Promise<void> {
    await db.runAsync('DELETE FROM inventory_items WHERE is_sample = 1');
  },
  async clearOcrText(db: SqlDb): Promise<void> {
    await db.runAsync('UPDATE inventory_items SET ocr_text = NULL WHERE ocr_text IS NOT NULL');
  },
};
