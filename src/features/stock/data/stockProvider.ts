/**
 * The single swappable boundary between Stock's hooks and its data
 * source. Every hook in ../hooks/ calls only these functions — never
 * MOCK_MOVEMENTS/MOCK_STOCK_SUPPLIERS or Products' MOCK_PRODUCTS
 * directly. When SQLite arrives, this file's internals become
 * StockRepository calls (product lookups become one atomic transaction
 * with the movement insert + products.currentStock update, per the
 * approved architecture) — the function signatures below are what that
 * repository would expose, so hooks/screens need no change.
 *
 * stockIn/stockOut/adjustStock are intentionally non-mutating beyond the
 * simulated delay, same "do not build a fake mutable store" decision
 * already made for Products' create/update/archive: they read the
 * product's *current* stock (via Products' getProductById) to compute a
 * real before/after for the review/success screens, but never write it
 * back to MOCK_PRODUCTS, and never push the resulting movement into
 * MOCK_MOVEMENTS. A stock action taken in this session won't appear in
 * Movement History afterwards — consistent with a newly created Product
 * not appearing in the Products list either.
 *
 * `notes` is deliberately not part of any input type here: the web's own
 * StockEntry.tsx collects a Notes field but never sends it to
 * store.stockIn/stockOut/adjustStock either (it's a UI-only field in the
 * source itself) — preserved as-is, not silently "fixed".
 */
import { getProductById, getProducts } from '@/features/products/data/productsProvider';
import { STOCK_VALUATION } from '../constants';
import { MOCK_MOVEMENTS } from './mockMovements';
import { MOCK_STOCK_SUPPLIERS } from './mockSuppliers';
import type {
  MovementType,
  StockActionResult,
  StockAdjustmentInput,
  StockInInput,
  StockMovement,
  StockMovementFilters,
  StockMovementFilterType,
  StockOutInput,
  StockSummary,
  StockSupplierOption,
} from '../types';
import { lowStock, outOfStock, stockValueMinor, totalUnits, withinDays } from '../utils/metrics';

const SUMMARY_DELAY_MS = 420;
const QUERY_DELAY_MS = 30;
const SAVE_DELAY_MS = 650; // matches web's StockEntry.tsx window.setTimeout(650) for the processing state

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function pad(n: number, len = 6): string {
  return n.toString().padStart(len, '0');
}

export function getStockSummary(): Promise<StockSummary> {
  return getProducts().then((products) =>
    delay(
      {
        totalStockValueMinor: stockValueMinor(products, STOCK_VALUATION),
        sellingStockValueMinor: stockValueMinor(products, 'selling'),
        valuation: STOCK_VALUATION,
        totalProducts: products.length,
        totalUnits: totalUnits(products),
        totalMovements: MOCK_MOVEMENTS.length,
        lowStock: lowStock(products),
        outOfStock: outOfStock(products),
      },
      SUMMARY_DELAY_MS
    )
  );
}

export function getRecentMovements(limit: number): Promise<StockMovement[]> {
  const sorted = [...MOCK_MOVEMENTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(sorted.slice(0, limit), SUMMARY_DELAY_MS);
}

export function getStockSuppliers(): Promise<StockSupplierOption[]> {
  return delay(MOCK_STOCK_SUPPLIERS, QUERY_DELAY_MS);
}

/** UI-exposed filter bucket -> the domain MovementTypes it covers. Keeps
 * the Movements screen's filter options matching the web's exact 6
 * choices while the badge/detail layer underneath uses the full
 * production set (see types.ts's StockMovementFilterType doc). */
const FILTER_TYPE_TO_MOVEMENT_TYPES: Record<Exclude<StockMovementFilterType, 'all'>, MovementType[]> = {
  in: ['MANUAL_IN', 'OPENING_STOCK'],
  out: ['MANUAL_OUT', 'DAMAGE'],
  sale: ['SALE'],
  purchase: ['PURCHASE'],
  adjust: ['ADJUSTMENT'],
  return: ['SALE_RETURN', 'PURCHASE_RETURN'],
};

/** Database-ready: takes a filters object rather than the caller loading
 * every movement and filtering in JS — today this still runs over the
 * in-memory mock array, but the call shape is what a future
 * MovementRepository query (WHERE product/type/date, ORDER BY date) would
 * take, so useMovements never changes when SQLite lands. */
export function getMovements(filters: StockMovementFilters): Promise<StockMovement[]> {
  const q = filters.query.trim().toLowerCase();
  const allowedTypes = filters.type === 'all' ? null : FILTER_TYPE_TO_MOVEMENT_TYPES[filters.type];
  const results = MOCK_MOVEMENTS.filter((m) => {
    if (q && !`${m.productName} ${m.reference} ${m.reason}`.toLowerCase().includes(q)) return false;
    if (allowedTypes && !allowedTypes.includes(m.type)) return false;
    if (filters.productId !== 'all' && m.productId !== filters.productId) return false;
    if (filters.rangeDays !== 'all' && !withinDays(m.createdAt, filters.rangeDays)) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(results, QUERY_DELAY_MS);
}

function buildMovement(
  product: { id: string; name: string; currentStock: number },
  type: MovementType,
  delta: number,
  quantityAfter: number,
  reason: string,
  reference: string
): StockMovement {
  return {
    id: `mov-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    type,
    quantityDelta: delta,
    quantityBefore: product.currentStock,
    quantityAfter,
    reason,
    reference,
    recordedBy: 'Owner',
    createdAt: new Date().toISOString(),
  };
}

export async function stockIn(input: StockInInput): Promise<StockActionResult> {
  const product = await getProductById(input.productId);
  if (!product) throw new Error('Product not found');
  const after = product.currentStock + input.quantity;
  const reference = input.reference || `IN-${Date.now().toString().slice(-6)}`;
  const movement = buildMovement(product, 'MANUAL_IN', input.quantity, after, input.reason, reference);
  return delay({ movement, quantityBefore: product.currentStock, quantityAfter: after }, SAVE_DELAY_MS);
}

/** Reasons that map to a more specific approved MovementType than the
 * generic MANUAL_OUT — per "don't blindly copy the web's simplified
 * enum", a Stock Out recorded with reason "Damaged" is meaningful to
 * distinguish for future damage/shrinkage reporting. The other reasons
 * (Lost/Internal use/Expired/Correction/Other) have no closer approved
 * concept, so they stay MANUAL_OUT. The visible reason dropdown itself is
 * unchanged from the web. */
function movementTypeForStockOut(reason: string): MovementType {
  return reason === 'Damaged' ? 'DAMAGE' : 'MANUAL_OUT';
}

export async function stockOut(input: StockOutInput): Promise<StockActionResult> {
  const product = await getProductById(input.productId);
  if (!product) throw new Error('Product not found');
  const after = product.currentStock - input.quantity;
  const reference = `OUT-${pad(Date.now() % 100000)}`;
  const movement = buildMovement(product, movementTypeForStockOut(input.reason), -input.quantity, after, input.reason, reference);
  return delay({ movement, quantityBefore: product.currentStock, quantityAfter: after }, SAVE_DELAY_MS);
}

export async function adjustStock(input: StockAdjustmentInput): Promise<StockActionResult> {
  const product = await getProductById(input.productId);
  if (!product) throw new Error('Product not found');
  const after = input.physicalQuantity;
  const delta = after - product.currentStock;
  const reference = `ADJ-${pad(Date.now() % 100000)}`;
  const movement = buildMovement(product, 'ADJUSTMENT', delta, after, input.reason, reference);
  return delay({ movement, quantityBefore: product.currentStock, quantityAfter: after }, SAVE_DELAY_MS);
}
