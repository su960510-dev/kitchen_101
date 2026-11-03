import { todayKst } from '@/domain/date-only';
import { AppError } from '@/domain/errors';
import { groupOfCategory, type FoodInventoryItem, type InventoryCategory, type InventoryGroup, type StorageLocation } from '@/domain/models';
import { newId, optionalDate, optionalQuantity, requireName } from '@/domain/validation';
import { normalizeIngredient } from '@/features/fridge-matching/ingredient-normalizer';
import { computeStatus, isAttentionStatus } from '@/features/food-safety/status-calculator';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import type { SqlDb } from '@/infrastructure/database/sql-types';

import type { InventoryInput } from './types';

export function buildItem(input: InventoryInput, existing: FoodInventoryItem | null, now = new Date()): FoodInventoryItem {
  const name = requireName(input.name, '이름');
  const labelDate = optionalDate(input.labelDate);
  const isMom = input.isMomSideDish ?? false;
  const receivedDate = optionalDate(input.receivedDate);
  if (isMom && !receivedDate) throw new AppError('validation', '엄마표 반찬은 받은 날짜가 필요해요.');
  if (labelDate && !input.labelDateType) throw new AppError('validation', '날짜 종류를 선택해 주세요.');
  const iso = now.toISOString();
  return {
    id: input.id ?? existing?.id ?? newId('inv_'),
    name,
    normalizedIngredientId: normalizeIngredient(name),
    category: input.category,
    storageLocation: input.storageLocation,
    quantity: optionalQuantity(input.quantity),
    unit: input.unit?.trim() || undefined,
    purchaseDate: optionalDate(input.purchaseDate),
    receivedDate,
    openedDate: optionalDate(input.openedDate),
    cookedDate: optionalDate(input.cookedDate),
    labelDate,
    labelDateType: labelDate ? input.labelDateType : undefined,
    personalReminderDate: optionalDate(input.personalReminderDate),
    dateSource: input.dateSource ?? (labelDate ? existing?.dateSource ?? 'MANUAL' : undefined),
    notifyEnabled: input.notifyEnabled ?? false,
    isMomSideDish: isMom,
    isOpened: input.isOpened ?? false,
    note: input.note?.trim() || undefined,
    localPhotoUri: input.localPhotoUri,
    sampleAssetKey: existing?.sampleAssetKey,
    ocrText: input.ocrText ?? existing?.ocrText,
    isSample: existing?.isSample ?? false,
    createdAt: existing?.createdAt ?? iso,
    updatedAt: iso,
    consumedAt: existing?.consumedAt,
    discardedAt: existing?.discardedAt,
  };
}

export async function saveItem(db: SqlDb, input: InventoryInput): Promise<FoodInventoryItem> {
  const existing = input.id ? await inventoryRepository.get(db, input.id) : null;
  const item = buildItem(input, existing);
  await inventoryRepository.upsert(db, item);
  return item;
}

async function requireItem(db: SqlDb, id: string): Promise<FoodInventoryItem> {
  const item = await inventoryRepository.get(db, id);
  if (!item) throw new AppError('not-found', '항목을 찾을 수 없어요.');
  return item;
}

/** 일부 사용. 남은 수량이 0이 되면 소진으로 옮기고, 복구할 수 있게 원래 수량을 지우지 않는다. */
export async function useQuantity(db: SqlDb, id: string, amount: number, now = new Date()): Promise<FoodInventoryItem> {
  const item = await requireItem(db, id);
  if (!Number.isFinite(amount) || amount <= 0) throw new AppError('validation', '사용한 수량을 0보다 크게 입력해 주세요.');
  if (item.quantity == null) throw new AppError('validation', '수량이 등록되지 않은 항목이에요.');
  if (amount > item.quantity) throw new AppError('validation', '남은 수량보다 많이 사용할 수 없어요.');
  const remaining = Math.round((item.quantity - amount) * 1000) / 1000;
  const iso = now.toISOString();
  const next: FoodInventoryItem = {
    ...item,
    quantity: remaining === 0 ? item.quantity : remaining,
    updatedAt: iso,
    consumedAt: remaining === 0 ? iso : item.consumedAt,
  };
  await inventoryRepository.upsert(db, next);
  return next;
}

export async function consumeItem(db: SqlDb, id: string, now = new Date()): Promise<FoodInventoryItem> {
  const item = await requireItem(db, id);
  const iso = now.toISOString();
  const next = { ...item, consumedAt: iso, discardedAt: undefined, updatedAt: iso };
  await inventoryRepository.upsert(db, next);
  return next;
}

export async function discardItem(db: SqlDb, id: string, now = new Date()): Promise<FoodInventoryItem> {
  const item = await requireItem(db, id);
  const iso = now.toISOString();
  const next = { ...item, discardedAt: iso, consumedAt: undefined, updatedAt: iso };
  await inventoryRepository.upsert(db, next);
  return next;
}

export async function restoreItem(db: SqlDb, id: string, now = new Date()): Promise<FoodInventoryItem> {
  const item = await requireItem(db, id);
  const next = { ...item, consumedAt: undefined, discardedAt: undefined, updatedAt: now.toISOString() };
  await inventoryRepository.upsert(db, next);
  return next;
}

export type InventorySort = 'DUE' | 'RECENT' | 'NAME';

export interface InventoryFilter {
  query?: string;
  group?: InventoryGroup;
  category?: InventoryCategory;
  storage?: StorageLocation;
  momOnly?: boolean;
  openedOnly?: boolean;
  attentionOnly?: boolean;
  sort?: InventorySort;
}

export function filterAndSort(items: FoodInventoryItem[], filter: InventoryFilter, today: string, leadDays: number): FoodInventoryItem[] {
  const query = filter.query?.trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (query && !i.name.toLowerCase().includes(query)) return false;
    if (filter.group && groupOfCategory(i.category) !== filter.group) return false;
    if (filter.category && i.category !== filter.category) return false;
    if (filter.storage && i.storageLocation !== filter.storage) return false;
    if (filter.momOnly && !i.isMomSideDish) return false;
    if (filter.openedOnly && !i.isOpened) return false;
    if (filter.attentionOnly && !isAttentionStatus(computeStatus(i, today, leadDays).primary)) return false;
    return true;
  });
  const sort = filter.sort ?? 'DUE';
  return filtered.sort((a, b) => {
    if (sort === 'NAME') return a.name.localeCompare(b.name, 'ko');
    if (sort === 'RECENT') return b.createdAt.localeCompare(a.createdAt);
    return dueRank(a, today, leadDays) - dueRank(b, today, leadDays) || a.name.localeCompare(b.name, 'ko');
  });
}

/** 임박 우선: 포장 표시 날짜 → 개인 관리 알림 → 날짜 없음. 두 날짜를 섞어 같은 기한처럼 보이지 않게 한다. */
function dueRank(item: FoodInventoryItem, today: string, leadDays: number): number {
  const { labelDaysLeft, reminderDaysLeft } = computeStatus(item, today, leadDays);
  if (labelDaysLeft != null) return labelDaysLeft;
  if (reminderDaysLeft != null) return 100000 + reminderDaysLeft;
  return 200000;
}

export interface HomeSummary {
  total: number;
  counts: Record<InventoryGroup, number>;
  attention: FoodInventoryItem[];
  mom: FoodInventoryItem[];
  noDate: FoodInventoryItem[];
  recent: FoodInventoryItem[];
}

export function summarize(items: FoodInventoryItem[], leadDays: number, today = todayKst()): HomeSummary {
  const counts: Record<InventoryGroup, number> = { FRESH: 0, SIDE: 0, PROCESSED: 0 };
  items.forEach((i) => counts[groupOfCategory(i.category)]++);
  const sorted = filterAndSort([...items], {}, today, leadDays);
  return {
    total: items.length,
    counts,
    attention: sorted.filter((i) => isAttentionStatus(computeStatus(i, today, leadDays).primary)),
    mom: sorted.filter((i) => i.isMomSideDish),
    noDate: sorted.filter((i) => computeStatus(i, today, leadDays).primary === 'NO_DATE'),
    recent: [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  };
}
