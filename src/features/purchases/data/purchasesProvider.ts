/**
 * The single swappable boundary between Purchases' hooks and its data
 * source — mirrors stockProvider.ts's shape closely. `createPurchase` is
 * this feature's coordinating operation (resolve supplier -> resolve
 * each item's product -> calculate totals -> build the record); no
 * separate "use case" module was added for it since every other
 * feature's provider in this app already plays that role (Stock's
 * stockIn/stockOut/adjustStock do the same multi-step coordination
 * directly in their provider functions) — a new layer here would be
 * inconsistent with the rest of the codebase, not clearer.
 *
 * createPurchase appends the record it builds to SESSION_PURCHASES (a
 * small in-memory array, not a general mutable store) rather than
 * MOCK_PURCHASES itself — every read function reads through allPurchases()
 * so a purchase created this session resolves from getPurchaseById the
 * same way a seed one does, matching the web's real behavior for "View
 * purchase" right after creating one. This is a deliberate, narrow
 * exception to the non-mutating pattern used elsewhere (Products/
 * Categories/Stock/Suppliers): those features' own "create -> view"
 * flows don't require the freshly created record to be immediately
 * readable back, this one does. SESSION_PURCHASES resets on app reload —
 * it is not persistence, and MOCK_PURCHASES itself is still never
 * mutated, so seed data behaves exactly as before.
 *
 * Purchase -> Stock: a completed purchase is, conceptually, a PURCHASE
 * stock movement per item (see stock/types.ts's MovementType). This
 * provider does not create or write any StockMovement — Stock's own
 * mockMovements.ts already seeds matching entries for 3 of the mock
 * purchases below (by reference) so PurchaseDetailScreen's "Stock
 * impact" section has something real to show; a freshly created
 * purchase simply won't have one yet, matching the web's own
 * already-defined "not in your history" empty state. The real,
 * atomic (purchase + stock movement + products.currentStock) write is
 * exactly the future PurchaseRepository/StockRepository transaction
 * this boundary is shaped for — not implemented now.
 */
import { getProductById } from '@/features/products/data/productsProvider';
import { getSupplierById, getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import { calculatePurchaseTotals } from '../utils/calculations';
import { withinDays } from '../utils/format';
import { MOCK_PURCHASES } from './mockPurchases';
import type { CreatePurchaseInput, Purchase, PurchaseFilters, PurchaseItem, PurchaseListSummary } from '../types';

const SIMULATED_DELAY_MS = 420;
const QUERY_DELAY_MS = 30;
const SAVE_DELAY_MS = 650;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function pad(n: number, len = 6): string {
  return n.toString().padStart(len, '0');
}

// Purchases created this session — see the file header for why this is
// the one exception to "temporary providers never mutate their seed".
const SESSION_PURCHASES: Purchase[] = [];

function allPurchases(): Purchase[] {
  return [...SESSION_PURCHASES, ...MOCK_PURCHASES];
}

export function getPurchases(filters: PurchaseFilters): Promise<Purchase[]> {
  const q = filters.query.trim().toLowerCase();
  const results = allPurchases().filter((p) => {
    if (filters.rangeDays !== 'all' && !withinDays(p.createdAt, filters.rangeDays)) return false;
    if (q && !`${p.reference} ${p.supplierName}`.toLowerCase().includes(q)) return false;
    if (filters.supplierId !== 'all' && p.supplierId !== filters.supplierId) return false;
    if (filters.paymentStatus !== 'all' && p.paymentStatus !== filters.paymentStatus) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(results, QUERY_DELAY_MS);
}

export function getPurchaseById(id: string): Promise<Purchase | undefined> {
  return delay(
    allPurchases().find((p) => p.id === id),
    SIMULATED_DELAY_MS
  );
}

// web: today/month/outstanding are derived from the full `purchases`
// array, independent of whatever filters the list view has active.
export async function getPurchaseListSummary(): Promise<PurchaseListSummary> {
  const suppliers = await getSuppliers();
  const purchases = allPurchases();
  const month = purchases.filter((p) => withinDays(p.createdAt, 30));
  const today = purchases.filter((p) => withinDays(p.createdAt, 1));
  const unpaid = purchases.filter((p) => p.paymentStatus !== 'Paid');
  const summary: PurchaseListSummary = {
    monthTotalMinor: month.reduce((sum, p) => sum + p.totalMinor, 0),
    monthCount: month.length,
    todayTotalMinor: today.reduce((sum, p) => sum + p.totalMinor, 0),
    todayCount: today.length,
    unpaidTotalMinor: unpaid.reduce((sum, p) => sum + p.totalMinor, 0),
    unpaidCount: unpaid.length,
    supplierCount: suppliers.length,
  };
  return delay(summary, SIMULATED_DELAY_MS);
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const supplier = await getSupplierById(input.supplierId);
  const items: PurchaseItem[] = await Promise.all(
    input.items.map(async (line) => {
      const product = await getProductById(line.productId);
      return {
        productId: line.productId,
        productName: product?.name ?? '',
        quantity: line.quantity,
        unitCostMinor: line.unitCostMinor,
      };
    })
  );
  const totals = calculatePurchaseTotals(items, input.discountMinor);
  const purchase: Purchase = {
    id: `pur-${Date.now()}`,
    reference: `PUR-${pad(Date.now() % 100000)}`,
    createdAt: new Date().toISOString(),
    supplierId: input.supplierId,
    supplierName: supplier?.name ?? 'Unknown supplier',
    items,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: input.discountMinor,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
    paymentStatus: input.paymentStatus,
    notes: input.notes,
  };
  SESSION_PURCHASES.unshift(purchase);
  return delay(purchase, SAVE_DELAY_MS);
}
