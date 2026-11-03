import Constants, { ExecutionEnvironment } from 'expo-constants';

import type { NotificationPort, PlannedNotification } from '@/features/notifications/notification-reconciler';

/**
 * 로컬 알림 전용. 푸시 토큰과 서버를 쓰지 않는다. 전달은 OS 정책(집중 모드, 절전 등)에 달려 있으므로
 * 앱 안의 홈 화면이 기준이다. Expo Go에는 일부 네이티브 모듈이 없어 지연 로드한다.
 */
type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null | undefined;

function N(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return (cached = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must stay lazy (see above)
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

let handlerSet = false;

export function configureNotifications(): void {
  const n = N();
  if (!n || handlerSet) return;
  handlerSet = true;
  n.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (process.env.EXPO_OS === 'android') {
    n.setNotificationChannelAsync('reminders', { name: '날짜 알림', importance: n.AndroidImportance.DEFAULT }).catch(() => {});
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getPermission(): Promise<PermissionState> {
  const n = N();
  if (!n) return 'unavailable';
  const s = await n.getPermissionsAsync();
  if (s.granted) return 'granted';
  return s.canAskAgain ? 'undetermined' : 'denied';
}

/** 사용자가 알림을 켤 때만 묻는다(앱 시작 시 묻지 않음). */
export async function requestPermission(): Promise<PermissionState> {
  const n = N();
  if (!n) return 'unavailable';
  const current = await getPermission();
  if (current !== 'undetermined') return current;
  const s = await n.requestPermissionsAsync();
  return s.granted ? 'granted' : 'denied';
}

export const expoNotificationPort: NotificationPort = {
  async scheduledIdentifiers() {
    const n = N();
    if (!n) return [];
    const all = await n.getAllScheduledNotificationsAsync();
    return all.map((x) => x.identifier);
  },
  async schedule(plan: PlannedNotification) {
    const n = N();
    if (!n) return;
    await n.scheduleNotificationAsync({
      identifier: plan.identifier,
      content: { title: plan.title, body: plan.body, data: { itemId: plan.itemId } },
      trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: plan.fireAt, channelId: 'reminders' },
    });
  },
  async cancel(identifier: string) {
    await N()?.cancelScheduledNotificationAsync(identifier);
  },
};

export async function cancelAllNotifications(): Promise<void> {
  await N()?.cancelAllScheduledNotificationsAsync();
}

/** 알림을 눌러 앱이 열리면 해당 항목으로 이동한다. 종료 상태에서 열린 경우 마지막 응답을 한 번 읽는다. */
export function onNotificationOpened(handler: (itemId: string) => void): () => void {
  const n = N();
  if (!n) return () => {};
  const open = (r: import('expo-notifications').NotificationResponse | null) => {
    const itemId = r?.notification.request.content.data?.itemId;
    if (typeof itemId === 'string') handler(itemId);
  };
  let alive = true;
  n.getLastNotificationResponseAsync()
    .then((r) => {
      if (!alive || !r) return;
      open(r);
      return n.clearLastNotificationResponseAsync();
    })
    .catch(() => {});
  const sub = n.addNotificationResponseReceivedListener((r) => {
    open(r);
    n.clearLastNotificationResponseAsync().catch(() => {});
  });
  return () => {
    alive = false;
    sub.remove();
  };
}
