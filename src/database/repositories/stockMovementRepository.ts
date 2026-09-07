/**
 * Repository ↔ Mapper for `stock_movements`. Mirrors stockProvider.ts's
 * read contract (getMovements/getRecentMovements) plus its 6-bucket ->
 * MovementType filter mapping, copied verbatim so the UI's filter
 * options don't change meaning.
 *
 * insertMovement is a low-level persistence primitive only — it does NOT
 * touch products.current_stock. The atomic "movement + cached stock"
 * write (Section 16 of Database Stage 1) is a later transaction/use-case
 * concern; nothing here or in productRepository composes them together
 * yet.
 */
import { getDatabase } from '../client';
import { fromEpochMs, fromScaledQuantity, toScaledQuantity } from '../mappers';
import { generateId, withinDaysCutoffMs, type DbExecutor } from './shared';
import type { MovementType, StockMovement, StockMovementFilters, StockMovementFilterType } from '@/features/stock/types';

interface StockMovementRow {
  id: string;
  product_id: string;
  product_name: string;
  type: MovementType;
  quantity_delta: number;
  quantity_before: number;
  quantity_after: number;
  reason: string;
  reference: string;
  recorded_by: string;
  created_at: number;
}

function mapMovementRowToDomain(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    type: row.type,
    quantityDelta: fromScaledQuantity(row.quantity_delta),
    quantityBefore: fromScaledQuantity(row.quantity_before),
    quantityAfter: fromScaledQuantity(row.quantity_after),
    reason: row.reason,
    reference: row.reference,
    recordedBy: row.recorded_by,
    createdAt: fromEpochMs(row.created_at),
  };
}

// Copied from stockProvider.ts's FILTER_TYPE_TO_MOVEMENT_TYPES — the
// database layer can't import a feature file, so this mapping is
// duplicated intentionally, not re-derived.
const FILTER_TYPE_TO_MOVEMENT_TYPES: Record<Exclude<StockMovementFilterType, 'all'>, MovementType[]> = {
  in: ['MANUAL_IN', 'OPENING_STOCK'],
  out: ['MANUAL_OUT', 'DAMAGE'],
  sale: ['SALE'],
  purchase: ['PURCHASE'],
  adjust: ['ADJUSTMENT'],
  return: ['SALE_RETURN', 'PURCHASE_RETURN'],
};

export async function getMovements(filters: StockMovementFilters, options?: { limit?: number; offset?: number }): Promise<StockMovement[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  const q = filters.query.trim();
  if (q) {
    clauses.push('(product_name LIKE ? OR reference LIKE ? OR reason LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (filters.type !== 'all') {
    const types = FILTER_TYPE_TO_MOVEMENT_TYPES[filters.type];
    clauses.push(`type IN (${types.map(() => '?').join(',')})`);
    params.push(...types);
  }
  if (filters.productId !== 'all') {
    clauses.push('product_id = ?');
    params.push(filters.productId);
  }
  if (filters.rangeDays !== 'all') {
    clauses.push('created_at >= ?');
    params.push(withinDaysCutoffMs(filters.rangeDays));
  }

  let sql = 'SELECT * FROM stock_movements';
  if (clauses.length > 0) sql += ` WHERE ${clauses.join(' AND ')}`;
  sql += ' ORDER BY created_at DESC';
  if (options?.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(options.limit);
    if (options?.offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const rows = await db.getAllAsync<StockMovementRow>(sql, params);
  return rows.map(mapMovementRowToDomain);
}

export async function getMovementById(id: string): Promise<StockMovement | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<StockMovementRow>(`SELECT * FROM stock_movements WHERE id = ?`, [id]);
  return row ? mapMovementRowToDomain(row) : undefined;
}

export async function getRecentMovements(limit: number): Promise<StockMovement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StockMovementRow>(`SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?`, [limit]);
  return rows.map(mapMovementRowToDomain);
}

export async function countMovements(filters?: Pick<StockMovementFilters, 'productId'>): Promise<number> {
  const db = await getDatabase();
  if (filters?.productId && filters.productId !== 'all') {
    const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM stock_movements WHERE product_id = ?`, [filters.productId]);
    return row?.n ?? 0;
  }
  const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM stock_movements`);
  return row?.n ?? 0;
}

/**
 * Low-level persistence primitive — inserts one movement row and nothing
 * else. Does NOT update products.current_stock and is NOT the complete
 * "Stock In/Out/Adjust" business operation. Required `executor` (not
 * optional): a future use-case calls this with the same transaction it
 * uses for the paired products.current_stock write, so both commit or
 * roll back together — this function no longer opens its own
 * transaction, so it never independently commits ahead of that use-case.
 */
export async function insertMovement(executor: DbExecutor, movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
  const id = generateId('mov');
  const now = Date.now();
  await executor.runAsync(
    `INSERT INTO stock_movements (id, product_id, product_name, type, quantity_delta, quantity_before, quantity_after, reason, reference, recorded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      movement.productId,
      movement.productName,
      movement.type,
      toScaledQuantity(movement.quantityDelta),
      toScaledQuantity(movement.quantityBefore),
      toScaledQuantity(movement.quantityAfter),
      movement.reason,
      movement.reference,
      movement.recordedBy,
      now,
    ]
  );
  return { ...movement, id, createdAt: fromEpochMs(now) };
}
