import type { HouseholdSettings } from '@/domain/models';
import { logError } from '@/domain/errors';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import type { SqlDb } from '@/infrastructure/database/sql-types';
import { cancelAllNotifications, expoNotificationPort, getPermission } from '@/infrastructure/notifications/local-notifications';

import { reconcileNotifications } from './notification-reconciler';

/** 권한이 없거나 알림을 꺼 두면 예약하지 않는다. 실패해도 앱 동작을 막지 않는다. */
export async function syncNotifications(db: SqlDb, settings: HouseholdSettings): Promise<void> {
  try {
    if (!settings.notificationEnabled) {
      await cancelAllNotifications();
      return;
    }
    if ((await getPermission()) !== 'granted') return;
    const items = await inventoryRepository.listActive(db);
    await reconcileNotifications(items, settings.reminderLeadDays, expoNotificationPort);
  } catch (error) {
    logError('notifications', error);
  }
}
