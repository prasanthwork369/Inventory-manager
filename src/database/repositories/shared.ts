import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * The minimal surface a write/read primitive needs. Satisfied by both
 * the plain connection `getDatabase()` returns and the `Transaction`
 * object `withExclusiveTransactionAsync`/`withTransactionAsync` hand a
 * callback (`Transaction extends SQLiteDatabase` in expo-sqlite's own
 * types), so the same primitive runs unmodified standalone or composed
 * inside a future outer business transaction — no SQL duplicated for
 * either case.
 */
export type DbExecutor = Pick<SQLiteDatabase, 'runAsync' | 'getFirstAsync' | 'getAllAsync'>;

/**
 * Tiny cross-repository helpers — id/timestamp generation only. Kept
 * separate from mappers.ts (Stage 1) since these produce new values
 * rather than convert existing ones.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function nowMs(): number {
  return Date.now();
}

/** Mirrors stock/utils/metrics.ts's withinDays() (local-midnight cutoff,
 * `days - 1` back) as an epoch-ms cutoff for a bound SQL parameter —
 * duplicated rather than imported because the database layer must never
 * depend on a feature layer. */
export function withinDaysCutoffMs(days: number): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start.getTime();
}
