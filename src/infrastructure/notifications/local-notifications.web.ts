import type { NotificationPort } from '@/features/notifications/notification-reconciler';

/** 웹은 UI 확인용 개발 미리보기다. 알림은 예약하지 않는다. */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export function configureNotifications(): void {}
export async function getPermission(): Promise<PermissionState> {
  return 'unavailable';
}
export async function requestPermission(): Promise<PermissionState> {
  return 'unavailable';
}
export const expoNotificationPort: NotificationPort = {
  scheduledIdentifiers: async () => [],
  schedule: async () => {},
  cancel: async () => {},
};
export async function cancelAllNotifications(): Promise<void> {}
export function onNotificationOpened(_handler: (itemId: string) => void): () => void {
  return () => {};
}
