/**
 * The one canonical SQLite connection for the whole app. `getDatabase()`
 * memoizes the in-flight open+migrate *promise* (not just a boolean), so
 * concurrent early callers all await the same initialization instead of
 * racing to open several connections — expo-sqlite itself would happily
 * hand back independent connections to the same file otherwise.
 *
 * No repository imports this yet (Database Stage 2) — Stage 1 only proves
 * the connection/migration lifecycle itself.
 */
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_NAME } from './constants';
import { runMigrations } from './migrations';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // WAL improves concurrent read/write performance; foreign key
  // enforcement is opt-in per SQLite connection, so it must be set here
  // rather than assumed from the schema alone.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    // Errors must reach the caller so a failed migration is never
    // silently treated as "ready" — reset the memo on failure so the
    // next call gets a genuine retry instead of a permanently-rejected
    // promise.
    databasePromise = openAndMigrate().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
