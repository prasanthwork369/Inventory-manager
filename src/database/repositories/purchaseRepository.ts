/**
 * Repository ↔ Mapper for `purchases`/`purchase_items`. Mirrors
 * purchasesProvider.ts's read contract. insertPurchase is a low-level
 * persistence primitive — see its own doc comment.
 */
import { getDatabase } from '../client';
import { fromEpochMs, toEpochMs, toScaledQuantity, fromScaledQuantity } from '../mappers';
import { generateId, withinDaysCutoffMs, type DbExecutor } from './shared';
import type { Purchase, PurchaseFilters, PurchaseItem, PurchaseListSummary, PurchasePaymentStatus } from '@/features/purchases/types';
import { countActiveSuppliers } from './supplierRepository';

interface PurchaseRow {
  id: string;
  reference: string;
  supplier_id: string;
  supplier_name: string;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  payment_status: PurchasePaymentStatus;
  notes: string;
  created_at: number;
}

interface PurchaseItemRow {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost_minor: number;
}

function mapItemRowToDomain(row: PurchaseItemRow): PurchaseItem {
  return {
    productId: row.product_id,
    productName: row.product_name,
    quantity: fromScaledQuantity(row.quantity),
    unitCostMinor: row.unit_cost_minor,
  };
}

function mapPurchaseRowToDomain(row: PurchaseRow, items: PurchaseItem[]): Purchase {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: fromEpochMs(row.created_at),
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    items,
    subtotalMinor: row.subtotal_minor,
    discountMinor: row.discount_minor,
    taxMinor: row.tax_minor,
    totalMinor: row.total_minor,
    paymentStatus: row.payment_status,
    notes: row.notes,
  };
}

/** Batches item lookups for a set of purchase headers into one query
 * (not one query per purchase) to avoid N+1. */
async function loadItemsByPurchaseIds(purchaseIds: string[]): Promise<Map<string, PurchaseItem[]>> {
  const map = new Map<string, PurchaseItem[]>();
  if (purchaseIds.length === 0) return map;
  const db = await getDatabase();
  const rows = await db.getAllAsync<PurchaseItemRow>(
    `SELECT * FROM purchase_items WHERE purchase_id IN (${purchaseIds.map(() => '?').join(',')})`,
    purchaseIds
  );
  for (const row of rows) {
    const list = map.get(row.purchase_id) ?? [];
    list.push(mapItemRowToDomain(row));
    map.set(row.purchase_id, list);
  }
  return map;
}

export async function getPurchases(filters: PurchaseFilters, options?: { limit?: number; offset?: number }): Promise<Purchase[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  const q = filters.query.trim();
  if (q) {
    clauses.push('(reference LIKE ? OR supplier_name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (filters.rangeDays !== 'all') {
    clauses.push('created_at >= ?');
    params.push(withinDaysCutoffMs(filters.rangeDays));
  }
  if (filters.supplierId !== 'all') {
    clauses.push('supplier_id = ?');
    params.push(filters.supplierId);
  }
  if (filters.paymentStatus !== 'all') {
    clauses.push('payment_status = ?');
    params.push(filters.paymentStatus);
  }

  let sql = 'SELECT * FROM purchases';
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

  const rows = await db.getAllAsync<PurchaseRow>(sql, params);
  const itemsByPurchase = await loadItemsByPurchaseIds(rows.map((r) => r.id));
  return rows.map((row) => mapPurchaseRowToDomain(row, itemsByPurchase.get(row.id) ?? []));
}

export async function getPurchaseById(id: string): Promise<Purchase | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PurchaseRow>(`SELECT * FROM purchases WHERE id = ?`, [id]);
  if (!row) return undefined;
  const items = (await loadItemsByPurchaseIds([id])).get(id) ?? [];
  return mapPurchaseRowToDomain(row, items);
}

// web/current provider: today/month/unpaid are derived from the FULL
// purchase history, independent of any active list filter.
export async function getPurchaseListSummary(): Promise<PurchaseListSummary> {
  const db = await getDatabase();
  const monthCutoff = withinDaysCutoffMs(30);
  const todayCutoff = withinDaysCutoffMs(1);
  const [monthRow, todayRow, unpaidRow, supplierCount] = await Promise.all([
    db.getFirstAsync<{ total: number | null; n: number }>(`SELECT SUM(total_minor) AS total, COUNT(*) AS n FROM purchases WHERE created_at >= ?`, [monthCutoff]),
    db.getFirstAsync<{ total: number | null; n: number }>(`SELECT SUM(total_minor) AS total, COUNT(*) AS n FROM purchases WHERE created_at >= ?`, [todayCutoff]),
    db.getFirstAsync<{ total: number | null; n: number }>(`SELECT SUM(total_minor) AS total, COUNT(*) AS n FROM purchases WHERE payment_status != 'Paid'`),
    countActiveSuppliers(),
  ]);
  return {
    monthTotalMinor: monthRow?.total ?? 0,
    monthCount: monthRow?.n ?? 0,
    todayTotalMinor: todayRow?.total ?? 0,
    todayCount: todayRow?.n ?? 0,
    unpaidTotalMinor: unpaidRow?.total ?? 0,
    unpaidCount: unpaidRow?.n ?? 0,
    supplierCount,
  };
}

/**
 * Low-level persistence primitive: persists an already-fully-computed
 * Purchase (header + items). Does NOT create stock_movements and does
 * NOT touch products.current_stock — resolving the supplier/products and
 * computing totals stays a use-case concern (matches purchasesProvider
 * .ts's current createPurchase), and the movement/stock write is a later
 * atomic transaction.
 *
 * Required `executor` (not optional) — this no longer opens its own
 * transaction, so header+items are only atomic with each other (and with
 * whatever else the caller is doing) when the caller passes a
 * transaction-scoped executor, e.g.
 * `db.withExclusiveTransactionAsync(txn => insertPurchase(txn, purchase))`.
 * That composability is the whole point: a future Stage 3 use-case can
 * call this alongside insertMovement/updateCurrentStock inside ONE outer
 * transaction so the whole business operation rolls back together.
 */
export async function insertPurchase(executor: DbExecutor, purchase: Purchase): Promise<Purchase> {
  // Respect the caller-supplied createdAt (already resolved by the
  // future use-case) rather than stamping a new one here.
  const createdAtMs = toEpochMs(purchase.createdAt);
  await executor.runAsync(
    `INSERT INTO purchases (id, reference, supplier_id, supplier_name, subtotal_minor, discount_minor, tax_minor, total_minor, payment_status, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      purchase.id,
      purchase.reference,
      purchase.supplierId,
      purchase.supplierName,
      purchase.subtotalMinor,
      purchase.discountMinor,
      purchase.taxMinor,
      purchase.totalMinor,
      purchase.paymentStatus,
      purchase.notes,
      createdAtMs,
    ]
  );
  for (const item of purchase.items) {
    await executor.runAsync(
      `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, unit_cost_minor) VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId('pit'), purchase.id, item.productId, item.productName, toScaledQuantity(item.quantity), item.unitCostMinor]
    );
  }
  return purchase;
}
