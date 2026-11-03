import { isDateOnly } from '@/domain/date-only';
import { AppError } from '@/domain/errors';
import type { FoodInventoryItem, HouseholdSettings, Recipe, RecipeCookLog, RecipeIngredient, RecipeStep } from '@/domain/models';

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'jubu-1dan';

export interface BackupV1 {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  settings: HouseholdSettings;
  items: FoodInventoryItem[];
  recipes: Recipe[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  cookLogs: RecipeCookLog[];
  /** 사용자가 사진 포함을 선택한 경우에만 채운다. key 는 원래 URI. */
  photos?: Record<string, string>;
}

const DATE_FIELDS: (keyof FoodInventoryItem)[] = ['purchaseDate', 'receivedDate', 'openedDate', 'cookedDate', 'labelDate', 'personalReminderDate'];

/** 신뢰할 수 없는 파일로 보고 구조와 날짜를 검사한다. 실패하면 아무것도 복원하지 않는다. */
export function parseBackup(text: string): BackupV1 {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AppError('backup-invalid', '백업 파일을 읽을 수 없어요.');
  }
  const b = raw as Partial<BackupV1> | null;
  if (!b || b.app !== BACKUP_APP) throw new AppError('backup-invalid', '주부1단 백업 파일이 아니에요.');
  if (b.version !== BACKUP_VERSION) throw new AppError('backup-invalid', '지원하지 않는 백업 버전이에요.');
  if (!Array.isArray(b.items) || !Array.isArray(b.recipes) || !Array.isArray(b.ingredients) || !Array.isArray(b.steps) || !Array.isArray(b.cookLogs)) {
    throw new AppError('backup-invalid', '백업 파일이 손상되었어요.');
  }
  for (const item of b.items) {
    if (typeof item?.id !== 'string' || typeof item.name !== 'string') throw new AppError('backup-invalid', '백업 파일이 손상되었어요.');
    for (const field of DATE_FIELDS) {
      if (item[field] != null && !isDateOnly(item[field])) throw new AppError('backup-invalid', '백업 파일의 날짜 형식이 올바르지 않아요.');
    }
  }
  for (const recipe of b.recipes) {
    if (typeof recipe?.id !== 'string' || typeof recipe.title !== 'string' || !Number.isInteger(recipe.baseServings)) {
      throw new AppError('backup-invalid', '백업 파일이 손상되었어요.');
    }
  }
  return b as BackupV1;
}
