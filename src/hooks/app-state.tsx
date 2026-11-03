import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { logError } from '@/domain/errors';
import { DEFAULT_SETTINGS, type HouseholdSettings } from '@/domain/models';
import { syncNotifications } from '@/features/notifications/local-notification-service';
import { getDb } from '@/infrastructure/database/db';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import type { SqlDb } from '@/infrastructure/database/sql-types';
import { configureNotifications } from '@/infrastructure/notifications/local-notifications';

interface AppState {
  ready: boolean;
  failed: boolean;
  db: SqlDb | null;
  settings: HouseholdSettings;
  dataVersion: number;
  /** 데이터 변경 후 호출: 화면 새로고침 + DB 기준 알림 재조정 */
  refresh: () => void;
  updateSettings: (patch: Partial<HouseholdSettings>) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SqlDb | null>(null);
  const [failed, setFailed] = useState(false);
  const [settings, setSettings] = useState<HouseholdSettings>(DEFAULT_SETTINGS);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        configureNotifications();
        const database = await getDb();
        const stored = await settingsRepository.get(database);
        if (!alive) return;
        setSettings(stored);
        setDb(database);
        void syncNotifications(database, stored);
      } catch (error) {
        logError('startup', error);
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(() => {
    setDataVersion((v) => v + 1);
    if (db) void syncNotifications(db, settings);
  }, [db, settings]);

  const updateSettings = useCallback(
    async (patch: Partial<HouseholdSettings>) => {
      if (!db) return;
      const next = { ...settings, ...patch };
      await settingsRepository.save(db, next);
      setSettings(next);
      setDataVersion((v) => v + 1);
      void syncNotifications(db, next);
    },
    [db, settings],
  );

  const value = useMemo<AppState>(() => ({ ready: !!db, failed, db, settings, dataVersion, refresh, updateSettings }), [db, failed, settings, dataVersion, refresh, updateSettings]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const value = useContext(Ctx);
  if (!value) throw new Error('AppStateProvider missing');
  return value;
}

/** ready 이후 화면에서만 쓴다. */
export function useDb(): SqlDb {
  const { db } = useAppState();
  if (!db) throw new Error('database not ready');
  return db;
}
