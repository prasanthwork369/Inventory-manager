/**
 * Stock domain types. Direct one-pass conversion of the web reference's
 * Movement/MovementType (src/types/index.ts) and StockEntry.tsx's local
 * input shapes — NOT copied verbatim where the web's simplified 6-value
 * MovementType ('in'|'out'|'sale'|'purchase'|'adjust'|'return') needs to
 * become a production-ready set that can distinguish movement reasons,
 * per the approved architecture. See data/stockProvider.ts for exactly
 * how today's UI (Stock In/Out/Adjust, and the Movements filter) maps
 * onto this wider set — domain support and visible UI are kept separate,
 * the UI itself is not changed.
 */
import type { Product } from '@/features/products/types';

export type MovementType =
  | 'OPENING_STOCK'
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE_RETURN'
  | 'DAMAGE'
  | 'MANUAL_IN'
  | 'MANUAL_OUT'
  | 'ADJUSTMENT'
  | 'REVERSAL';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  reference: string;
  recordedBy: string;
  createdAt: string;
}

/**
 * The web's Movements screen only ever lets someone filter by 6 buckets
 * ('in'|'out'|'sale'|'purchase'|'adjust'|'return') — narrower than the 10
 * approved MovementTypes above. Per "don't invent UI controls the web
 * doesn't expose", the filter keeps that exact 6-bucket shape; each
 * bucket maps to one or more MovementTypes under the hood (see
 * stockProvider.ts), so e.g. selecting "Stock Out" still surfaces both
 * MANUAL_OUT and DAMAGE movements.
 */
export type StockMovementFilterType = 'all' | 'in' | 'out' | 'sale' | 'purchase' | 'adjust' | 'return';

/** Database-ready query shape for getMovements — every field maps to a
 * WHERE/ORDER clause a future MovementRepository would take, so today's
 * in-memory filter can become a SQL query later with no hook/screen
 * change. */
export interface StockMovementFilters {
  query: string;
  type: StockMovementFilterType;
  productId: string | 'all';
  rangeDays: 1 | 7 | 30 | 'all';
}

export interface StockSummary {
  totalStockValueMinor: number;
  sellingStockValueMinor: number;
  valuation: 'cost' | 'selling';
  totalProducts: number;
  totalUnits: number;
  totalMovements: number;
  lowStock: Product[];
  outOfStock: Product[];
}

export type StockEntryMode = 'in' | 'out' | 'adjust';

export interface StockInInput {
  productId: string;
  quantity: number;
  unitCostMinor: number;
  reference: string;
  reason: string;
}

export interface StockOutInput {
  productId: string;
  quantity: number;
  reason: string;
}

export interface StockAdjustmentInput {
  productId: string;
  physicalQuantity: number;
  reason: string;
}

export interface StockActionResult {
  movement: StockMovement;
  quantityBefore: number;
  quantityAfter: number;
}

/** Minimal read-only supplier shape — see data/mockSuppliers.ts for why
 * this isn't the (out of scope) Suppliers feature's Party type. */
export interface StockSupplierOption {
  id: string;
  name: string;
}
