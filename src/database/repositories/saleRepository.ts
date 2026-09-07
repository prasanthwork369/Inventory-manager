/**
 * Repository ↔ Mapper for `sales`/`sale_items`/`sale_returns`/
 * `sale_return_items`. Mirrors salesProvider.ts's read contract,
 * including its most load-bearing behavior: `status` is re-derived from
 * the FULL sale_returns history on every read (deriveStatusFromReturns
 * below), never trusted from the stored column — this is Phase 10's
 * cumulative-partial-returns correction (the web only checks the latest
 * return batch, under-counting prior ones). deriveStatusFromReturns
 * intentionally duplicates sales/utils/returns.ts's algorithm rather than
 * importing it — the database layer must never depend on a feature layer.
 */
import { getDatabase } from '../client';
import { fromEpochMs, fromScaledQuantity, toEpochMs, toScaledQuantity } from '../mappers';
import { generateId, withinDaysCutoffMs, type DbExecutor } from './shared';
import type { PaymentMethod, Sale, SaleFilters, SaleItem, SaleListSummary, SaleReturn, SaleReturnItem, SaleStatus } from '@/features/sales/types';

interface SaleRow {
  id: string;
  receipt_no: string;
  customer_id: string | null;
  customer_name: string;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  cost_minor: number;
  payment_method: PaymentMethod;
  amount_received_minor: number;
  status: SaleStatus;
  created_at: number;
}

interface SaleItemRow {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_minor: number;
  discount_minor: number;
}

interface SaleReturnRow {
  id: string;
  reference: string;
  sale_id: string;
  receipt_no: string;
  refund_minor: number;
  reason: string;
  restock: number;
  created_at: number;
}

interface SaleReturnItemRow {
  id: string;
  sale_return_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  amount_minor: number;
}

function mapSaleItemRowToDomain(row: SaleItemRow): SaleItem {
  return {
    productId: row.product_id,
    productName: row.product_name,
    quantity: fromScaledQuantity(row.quantity),
    unitPriceMinor: row.unit_price_minor,
    discountMinor: row.discount_minor,
  };
}

function mapSaleRowToDomain(row: SaleRow, items: SaleItem[], status: SaleStatus): Sale {
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    createdAt: fromEpochMs(row.created_at),
    items,
    subtotalMinor: row.subtotal_minor,
    discountMinor: row.discount_minor,
    taxMinor: row.tax_minor,
    totalMinor: row.total_minor,
    costMinor: row.cost_minor,
    customerId: row.customer_id,
    customerName: row.customer_name,
    paymentMethod: row.payment_method,
    amountReceivedMinor: row.amount_received_minor,
    status,
  };
}

function mapReturnItemRowToDomain(row: SaleReturnItemRow): SaleReturnItem {
  return { productId: row.product_id, productName: row.product_name, quantity: fromScaledQuantity(row.quantity), amountMinor: row.amount_minor };
}

function mapReturnRowToDomain(row: SaleReturnRow, items: SaleReturnItem[]): SaleReturn {
  return {
    id: row.id,
    reference: row.reference,
    saleId: row.sale_id,
    receiptNo: row.receipt_no,
    createdAt: fromEpochMs(row.created_at),
    items,
    refundMinor: row.refund_minor,
    reason: row.reason,
    restock: row.restock !== 0,
  };
}

/** Mirrors sales/utils/returns.ts's deriveSaleStatus exactly (see file
 * header for why this is duplicated, not imported). */
function deriveStatusFromReturns(saleItems: SaleItem[], returns: SaleReturn[]): SaleStatus {
  const totalSold = saleItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalReturned = returns.reduce((sum, r) => sum + r.items.reduce((s, it) => s + it.quantity, 0), 0);
  if (totalReturned <= 0) return 'completed';
  return totalReturned >= totalSold ? 'returned' : 'part-returned';
}

async function loadItemsBySaleIds(saleIds: string[]): Promise<Map<string, SaleItem[]>> {
  const map = new Map<string, SaleItem[]>();
  if (saleIds.length === 0) return map;
  const db = await getDatabase();
  const rows = await db.getAllAsync<SaleItemRow>(`SELECT * FROM sale_items WHERE sale_id IN (${saleIds.map(() => '?').join(',')})`, saleIds);
  for (const row of rows) {
    const list = map.get(row.sale_id) ?? [];
    list.push(mapSaleItemRowToDomain(row));
    map.set(row.sale_id, list);
  }
  return map;
}

/** Batches return + return-item lookups for a set of sales into 2
 * queries total (not one pair per sale) — needed so deriving `status`
 * across a whole list view stays cheap. */
async function loadReturnsBySaleIds(saleIds: string[]): Promise<Map<string, SaleReturn[]>> {
  const map = new Map<string, SaleReturn[]>();
  if (saleIds.length === 0) return map;
  const db = await getDatabase();
  const returnRows = await db.getAllAsync<SaleReturnRow>(`SELECT * FROM sale_returns WHERE sale_id IN (${saleIds.map(() => '?').join(',')})`, saleIds);
  if (returnRows.length === 0) return map;
  const returnIds = returnRows.map((r) => r.id);
  const itemRows = await db.getAllAsync<SaleReturnItemRow>(`SELECT * FROM sale_return_items WHERE sale_return_id IN (${returnIds.map(() => '?').join(',')})`, returnIds);
  const itemsByReturn = new Map<string, SaleReturnItem[]>();
  for (const row of itemRows) {
    const list = itemsByReturn.get(row.sale_return_id) ?? [];
    list.push(mapReturnItemRowToDomain(row));
    itemsByReturn.set(row.sale_return_id, list);
  }
  for (const row of returnRows) {
    const list = map.get(row.sale_id) ?? [];
    list.push(mapReturnRowToDomain(row, itemsByReturn.get(row.id) ?? []));
    map.set(row.sale_id, list);
  }
  return map;
}

export async function getSales(filters: SaleFilters, options?: { limit?: number; offset?: number }): Promise<Sale[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  const q = filters.query.trim();
  if (q) {
    clauses.push('(receipt_no LIKE ? OR customer_name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (filters.rangeDays !== 'all') {
    clauses.push('created_at >= ?');
    params.push(withinDaysCutoffMs(filters.rangeDays));
  }
  if (filters.paymentMethod !== 'all') {
    clauses.push('payment_method = ?');
    params.push(filters.paymentMethod);
  }
  if (filters.customerId !== 'all') {
    clauses.push('customer_id = ?');
    params.push(filters.customerId);
  }

  let sql = 'SELECT * FROM sales';
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

  const rows = await db.getAllAsync<SaleRow>(sql, params);
  const ids = rows.map((r) => r.id);
  const [itemsBySale, returnsBySale] = await Promise.all([loadItemsBySaleIds(ids), loadReturnsBySaleIds(ids)]);
  return rows.map((row) => {
    const items = itemsBySale.get(row.id) ?? [];
    const returns = returnsBySale.get(row.id) ?? [];
    return mapSaleRowToDomain(row, items, deriveStatusFromReturns(items, returns));
  });
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SaleRow>(`SELECT * FROM sales WHERE id = ?`, [id]);
  if (!row) return undefined;
  const items = (await loadItemsBySaleIds([id])).get(id) ?? [];
  const returns = (await loadReturnsBySaleIds([id])).get(id) ?? [];
  return mapSaleRowToDomain(row, items, deriveStatusFromReturns(items, returns));
}

export async function getReturnsForSale(saleId: string): Promise<SaleReturn[]> {
  return (await loadReturnsBySaleIds([saleId])).get(saleId) ?? [];
}

// web/current provider: today/week/month/paymentMix are derived from the
// FULL sale history, independent of any active list filter.
export async function getSaleListSummary(): Promise<SaleListSummary> {
  const db = await getDatabase();
  const cutoffs = { today: withinDaysCutoffMs(1), week: withinDaysCutoffMs(7), month: withinDaysCutoffMs(30) };
  async function totals(cutoff: number) {
    const row = await db.getFirstAsync<{ total: number | null; profit: number | null; n: number }>(
      `SELECT SUM(total_minor) AS total, SUM(total_minor - tax_minor - cost_minor) AS profit, COUNT(*) AS n FROM sales WHERE created_at >= ?`,
      [cutoff]
    );
    return { total: row?.total ?? 0, profit: row?.profit ?? 0, count: row?.n ?? 0 };
  }
  const [today, week, month] = await Promise.all([totals(cutoffs.today), totals(cutoffs.week), totals(cutoffs.month)]);

  const mixRows = await db.getAllAsync<{ payment_method: PaymentMethod; total: number }>(
    `SELECT payment_method, SUM(total_minor) AS total FROM sales WHERE created_at >= ? GROUP BY payment_method`,
    [cutoffs.month]
  );
  const paymentMixMinor: Record<PaymentMethod, number> = { Cash: 0, UPI: 0, Card: 0, Other: 0 };
  for (const row of mixRows) paymentMixMinor[row.payment_method] = row.total;

  return {
    todayTotalMinor: today.total,
    todayCount: today.count,
    todayProfitMinor: today.profit,
    weekTotalMinor: week.total,
    weekCount: week.count,
    monthTotalMinor: month.total,
    monthCount: month.count,
    monthProfitMinor: month.profit,
    paymentMixMinor,
  };
}

/**
 * Low-level persistence primitive: persists an already-fully-computed
 * Sale (header + items). Does NOT create stock_movements and does NOT
 * touch products.current_stock — same boundary as purchaseRepository
 * .insertPurchase, including requiring a transaction-scoped `executor`
 * for header+items (and the rest of a future business operation) to be
 * atomic — see insertPurchase's doc comment for why. `status` is always
 * written as 'completed' (a brand-new sale has no returns yet); every
 * read re-derives it anyway.
 */
export async function insertSale(executor: DbExecutor, sale: Sale): Promise<Sale> {
  // Respect the caller-supplied createdAt rather than stamping a new one.
  const createdAtMs = toEpochMs(sale.createdAt);
  await executor.runAsync(
    `INSERT INTO sales (id, receipt_no, customer_id, customer_name, subtotal_minor, discount_minor, tax_minor, total_minor, cost_minor, payment_method, amount_received_minor, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
    [
      sale.id,
      sale.receiptNo,
      sale.customerId,
      sale.customerName,
      sale.subtotalMinor,
      sale.discountMinor,
      sale.taxMinor,
      sale.totalMinor,
      sale.costMinor,
      sale.paymentMethod,
      sale.amountReceivedMinor,
      createdAtMs,
    ]
  );
  for (const item of sale.items) {
    await executor.runAsync(
      `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price_minor, discount_minor) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId('sit'), sale.id, item.productId, item.productName, toScaledQuantity(item.quantity), item.unitPriceMinor, item.discountMinor]
    );
  }
  return sale;
}

/**
 * Low-level persistence primitive: persists an already-fully-computed
 * SaleReturn (header + items). Does NOT restock products, does NOT
 * create a SALE_RETURN stock_movement, and does NOT touch
 * products.current_stock — that atomic write is a later use-case.
 * Requires a transaction-scoped `executor` for the same reason as
 * insertSale/insertPurchase. Safe to call more than once per sale:
 * sale_id is a plain FK here, never unique, so multiple partial returns
 * coexist correctly (verified — see the Stage 2 report).
 */
export async function insertSaleReturn(executor: DbExecutor, saleReturn: SaleReturn): Promise<SaleReturn> {
  const createdAtMs = toEpochMs(saleReturn.createdAt);
  await executor.runAsync(
    `INSERT INTO sale_returns (id, reference, sale_id, receipt_no, refund_minor, reason, restock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [saleReturn.id, saleReturn.reference, saleReturn.saleId, saleReturn.receiptNo, saleReturn.refundMinor, saleReturn.reason, saleReturn.restock ? 1 : 0, createdAtMs]
  );
  for (const item of saleReturn.items) {
    await executor.runAsync(
      `INSERT INTO sale_return_items (id, sale_return_id, product_id, product_name, quantity, amount_minor) VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId('srit'), saleReturn.id, item.productId, item.productName, toScaledQuantity(item.quantity), item.amountMinor]
    );
  }
  return saleReturn;
}

/**
 * Sums everything already returned for one product on one sale, across
 * every return row so far — the exact cumulative check
 * sales/utils/returns.ts's alreadyReturnedQuantity performs, duplicated
 * for the same "database layer can't import features" reason as
 * deriveStatusFromReturns above. Used by a future return-creation
 * use-case to enforce maxReturnable = soldQuantity - alreadyReturned.
 * Optional `executor`: that use-case must read this INSIDE the same
 * transaction as its return insert (not a separate connection read), or
 * a second concurrent return could race past the real remaining amount.
 */
export async function getAlreadyReturnedQuantity(saleId: string, productId: string, executor?: DbExecutor): Promise<number> {
  const db = executor ?? (await getDatabase());
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(sri.quantity) AS total
     FROM sale_return_items sri
     JOIN sale_returns sr ON sr.id = sri.sale_return_id
     WHERE sr.sale_id = ? AND sri.product_id = ?`,
    [saleId, productId]
  );
  return fromScaledQuantity(row?.total ?? 0);
}
