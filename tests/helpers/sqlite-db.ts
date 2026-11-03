import { DatabaseSync } from 'node:sqlite';

import { runMigrations } from '@/infrastructure/database/migrations';
import type { SqlDb, SqlValue } from '@/infrastructure/database/sql-types';

/** 실제 SQLite(node:sqlite)로 저장소·마이그레이션을 검증하는 테스트 어댑터. */
export async function createTestDb(): Promise<SqlDb> {
  const raw = new DatabaseSync(':memory:');
  const db: SqlDb = {
    execAsync: async (sql) => {
      raw.exec(sql);
    },
    runAsync: async (sql, params: SqlValue[] = []) => raw.prepare(sql).run(...params),
    getAllAsync: async <T,>(sql: string, params: SqlValue[] = []) => raw.prepare(sql).all(...params) as T[],
    getFirstAsync: async <T,>(sql: string, params: SqlValue[] = []) => (raw.prepare(sql).get(...params) as T | undefined) ?? null,
    withTransactionAsync: async (task) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
  await runMigrations(db);
  return db;
}
