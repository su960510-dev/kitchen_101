import type { DateSource, DateType, InventoryCategory, StorageLocation } from '@/domain/models';

/** 등록/수정 입력. 날짜는 모두 사용자가 고른 값이고 어떤 필드도 다른 날짜에서 계산하지 않는다. */
export interface InventoryInput {
  id?: string;
  name: string;
  category: InventoryCategory;
  storageLocation: StorageLocation;
  quantity?: number;
  unit?: string;
  purchaseDate?: string;
  receivedDate?: string;
  openedDate?: string;
  cookedDate?: string;
  labelDate?: string;
  labelDateType?: DateType;
  personalReminderDate?: string;
  dateSource?: DateSource;
  notifyEnabled?: boolean;
  isMomSideDish?: boolean;
  isOpened?: boolean;
  note?: string;
  localPhotoUri?: string;
  ocrText?: string;
  /** false 면 구매일 기준 추정 기한을 만들지 않는다. 기본 true. */
  autoEstimate?: boolean;
}
