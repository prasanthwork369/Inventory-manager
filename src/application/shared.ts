/**
 * Small helpers genuinely shared across every use-case — not a home for
 * business logic itself.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DbExecutor } from '@/database/repositories/shared';

/**
 * `withExclusiveTransactionAsync`'s task must return `Promise<void>` — it
 * discards whatever the callback returns. Every use-case needs to hand
 * back a result (the created Sale, the movement, etc.), so this captures
 * it via an outer-scoped variable instead. The callback's `tx` (expo-
 * sqlite's own internal, unexported `Transaction` type) is narrowed to
 * `DbExecutor` here — the only surface repository primitives need — so
 * this file never has to name that unexported type.
 */
export async function runInTransaction<T>(db: SQLiteDatabase, task: (tx: DbExecutor) => Promise<T>): Promise<T> {
  let result: T | undefined;
  let settled = false;
  await db.withExclusiveTransactionAsync(async (tx) => {
    result = await task(tx);
    settled = true;
  });
  if (!settled) throw new Error('Transaction completed without producing a result.');
  return result as T;
}

/** Matches the `PREFIX-######` reference format already used by every
 * temporary provider (purchasesProvider.ts, salesProvider.ts,
 * stockProvider.ts) — duplicated here for the same "application layer
 * can't import a feature file" reason as the database layer. */
export function pad(n: number, len = 6): string {
  return n.toString().padStart(len, '0');
}
