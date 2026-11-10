import type { DateOnly } from '../date-only';

export type StorageLocation = 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'OTHER';
export type InventoryCategory =
  | 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'SEAFOOD' | 'DAIRY'
  | 'GRAIN' | 'SAUCE' | 'SIDE_DISH' | 'PACKAGED' | 'OTHER';
export type DateType =
  | 'USE_BY' | 'SELL_BY' | 'BEST_BEFORE' | 'MANUFACTURED_ON'
  | 'PACKED_ON' | 'PURCHASED_ON' | 'RECEIVED_ON' | 'OPENED_ON'
  | 'COOKED_ON' | 'PERSONAL_REMINDER' | 'ESTIMATED_FROM_PURCHASE' | 'UNKNOWN';
export type DateSource = 'MANUAL' | 'OCR_CONFIRMED' | 'IMPORTED_BACKUP' | 'AUTO_ESTIMATE';
export type InventoryStatus =
  | 'EXPIRED_LABEL_DATE' | 'LABEL_DATE_TODAY' | 'LABEL_DATE_SOON'
  | 'PERSONAL_REMINDER_DUE' | 'NO_DATE' | 'DATE_UNCONFIRMED'
  | 'OPENED_CHECK_REQUIRED';

export interface FoodInventoryItem {
  id: string;
  name: string;
  normalizedIngredientId?: string;
  category: InventoryCategory;
  storageLocation: StorageLocation;
  quantity?: number;
  unit?: string;
  purchaseDate?: DateOnly;
  receivedDate?: DateOnly;
  openedDate?: DateOnly;
  cookedDate?: DateOnly;
  labelDate?: DateOnly;
  labelDateType?: DateType;
  personalReminderDate?: DateOnly;
  dateSource?: DateSource;
  /** 사용자가 날짜 알림을 선택한 경우에만 예약한다. */
  notifyEnabled: boolean;
  isMomSideDish: boolean;
  isOpened: boolean;
  note?: string;
  localPhotoUri?: string;
  /** 번들 예시 이미지 키. 예시 데이터에만 쓴다. */
  sampleAssetKey?: string;
  ocrText?: string;
  /** 예시 데이터. 실제 재고와 분리되며 알림·백업·파먹기 근거에서 구분한다. */
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  consumedAt?: string;
  discardedAt?: string;
}

export type RecipeCategory = '한식' | '국·찌개' | '반찬' | '밥·면' | '양식' | '베이킹' | '간식' | '기타';
export type RecipeDifficulty = '하' | '중' | '상';

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  baseServings: number;
  prepMinutes?: number;
  cookMinutes?: number;
  difficulty?: RecipeDifficulty;
  sourceUrl?: string;
  userProvidedSourceTitle?: string;
  note?: string;
  tags?: string;
  imageUri?: string;
  sampleAssetKey?: string;
  isSettled: boolean;
  settledAt?: string;
  settledVersionId?: string;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId?: string;
  displayName: string;
  quantity?: number;
  unit?: string;
  /** '약간', '적당량' 등 비정량 표현 */
  quantityText?: string;
  isScalable: boolean;
  note?: string;
  sampleAssetKey?: string;
  sortOrder: number;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  instruction: string;
  sortOrder: number;
  personalNote?: string;
}

export interface RecipeCookLog {
  id: string;
  recipeId: string;
  cookedAt: DateOnly;
  servings: number;
  note?: string;
}

export interface RecipeVersion {
  id: string;
  recipeId: string;
  label: string;
  snapshot: RecipeSnapshot;
  createdAt: string;
}

export interface RecipeSnapshot {
  title: string;
  baseServings: number;
  ingredients: Omit<RecipeIngredient, 'id' | 'recipeId'>[];
  steps: Omit<RecipeStep, 'id' | 'recipeId'>[];
}

export interface RecipeDetail {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  cookLogs: RecipeCookLog[];
  versions: RecipeVersion[];
}

export interface OcrCandidate {
  id: string;
  rawText: string;
  candidateDate?: DateOnly;
  candidateDateType: DateType;
  confidence?: number;
  confirmed: boolean;
  /** 2자리 연도. 세기를 확정하지 않고 suggestedDate 는 사용자 확인용으로만 쓴다. */
  needsYearConfirmation?: boolean;
  suggestedDate?: DateOnly;
}

export interface HouseholdSettings {
  defaultServings: number;
  notificationEnabled: boolean;
  reminderLeadDays: number;
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
  onboardingDone: boolean;
}

export const DEFAULT_SETTINGS: HouseholdSettings = {
  defaultServings: 2,
  notificationEnabled: false,
  reminderLeadDays: 7,
  theme: 'SYSTEM',
  onboardingDone: false,
};

/** 보드의 냉장고 탭 묶음: 전체 / 신선식품 / 반찬 / 가공식품 */
export type InventoryGroup = 'FRESH' | 'SIDE' | 'PROCESSED';

export function groupOfCategory(category: InventoryCategory): InventoryGroup {
  switch (category) {
    case 'VEGETABLE':
    case 'FRUIT':
    case 'MEAT':
    case 'SEAFOOD':
    case 'DAIRY':
    case 'GRAIN':
      return 'FRESH';
    case 'SIDE_DISH':
      return 'SIDE';
    default:
      return 'PROCESSED';
  }
}

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  VEGETABLE: '채소',
  FRUIT: '과일',
  MEAT: '육류',
  SEAFOOD: '해산물',
  DAIRY: '유제품',
  GRAIN: '곡류',
  SAUCE: '소스',
  SIDE_DISH: '반찬',
  PACKAGED: '가공식품',
  OTHER: '기타',
};

export const STORAGE_LABELS: Record<StorageLocation, string> = {
  FRIDGE: '냉장',
  FREEZER: '냉동',
  PANTRY: '상온',
  OTHER: '기타',
};

export const RECIPE_CATEGORIES: RecipeCategory[] = ['한식', '국·찌개', '반찬', '밥·면', '양식', '베이킹', '간식', '기타'];
