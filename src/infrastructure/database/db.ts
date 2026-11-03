import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';
import type { SqlDb, SqlValue } from './sql-types';

/** 로컬 저장소. 텍스트와 파일 URI만 저장하고 이미지 바이너리는 넣지 않는다. */
const DB_NAME = 'jubu1dan.db';

let dbPromise: Promise<SqlDb> | null = null;

function adapt(db: SQLite.SQLiteDatabase): SqlDb {
  return {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: (sql, params: SqlValue[] = []) => db.runAsync(sql, params),
    getAllAsync: <T,>(sql: string, params: SqlValue[] = []) => db.getAllAsync<T>(sql, params),
    getFirstAsync: <T,>(sql: string, params: SqlValue[] = []) => db.getFirstAsync<T>(sql, params),
    withTransactionAsync: (task) => db.withTransactionAsync(task),
  };
}

export function getDb(): Promise<SqlDb> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const native = await SQLite.openDatabaseAsync(DB_NAME);
      if (process.env.EXPO_OS !== 'web') await native.execAsync('PRAGMA journal_mode = WAL;');
      const db = adapt(native);
      await runMigrations(db);
      return db;
    })();
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}
