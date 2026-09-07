/**
 * Ordered PRAGMA user_version migration runner. Each migration's `up`
 * runs inside one exclusive transaction together with the user_version
 * bump, so a failing migration rolls back its schema changes AND leaves
 * the version unadvanced — the next launch retries from the same version
 * instead of limping forward on a half-applied schema.
 *
 * To add a migration: create `NNN_description.ts` exporting a `Migration`
 * with the next integer version, push it onto MIGRATIONS below. Never
 * edit a migration that has already shipped — only append.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { migration001InitialSchema } from './001_initial_schema';

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// Ordered ascending by version — enforced below, not just by convention.
const MIGRATIONS: Migration[] = [migration001InitialSchema];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const sorted = [...MIGRATIONS].sort((a, b) => a.version - b.version);
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].version <= (i === 0 ? 0 : sorted[i - 1].version)) {
      throw new Error(`Migrations must have strictly increasing versions (found ${sorted[i].version} out of order).`);
    }
  }

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  const pending = sorted.filter((m) => m.version > currentVersion);

  for (const migration of pending) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await migration.up(txn);
      // Not parameterizable (SQLite PRAGMA syntax doesn't accept bound
      // params) — safe here because `version` is a compile-time integer
      // from this file's own array, never external input.
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
