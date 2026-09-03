/**
 * Direct conversion of the web reference's Sale/SaleItem/SaleReturn
 * (src/types/index.ts) into this project's stable contracts. Money is
 * integer minor units (paise) — same rule already applied to Product/
 * Stock/Purchases. `paymentMethod`/`status` string unions copied
 * verbatim from the web.
 *
 * `productName`/`customerName` are deliberate historical snapshots
 * (matches the web's own `completeSale`, which copies each product's
 * name and the resolved customer name onto the record at creation time)
 * — a sale is a historical transaction, so it must keep showing what a
 * product/customer were called even if renamed or archived later.
 * `productId`/`customerId` remain the authoritative canonical
 * references.
 *
 * `Sale.status` is stored but treated as a *cache* of a value the
 * provider re-derives from actual SaleReturn records on every read (see
 * salesProvider.ts's deriveSaleStatus) — the web only recomputes it from
 * the single return batch just processed, which under-counts prior
 * partial returns; deriving it from the full return history is a
 * deliberate correction (see utils/returns.ts), not a redesign.
 */

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';
export type SaleStatus = 'completed' | 'returned' | 'part-returned';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  createdAt: string;
  items: SaleItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  costMinor: number;
  customerId: string | null;
  customerName: string;
  paymentMethod: PaymentMethod;
  amountReceivedMinor: number;
  status: SaleStatus;
}

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  discountMinor: number;
  customerId: string | null;
  customerName: string;
  paymentMethod: PaymentMethod;
  amountReceivedMinor: number;
}

/** Database-ready query shape for getSales, mirroring Stock/Purchases'
 * filter contracts so today's in-memory filter becomes a SQL query later
 * with no hook/screen change. */
export interface SaleFilters {
  query: string;
  rangeDays: 1 | 7 | 30 | 'all';
  paymentMethod: PaymentMethod | 'all';
  customerId: string | 'all';
}

/** Aggregate stats for the list screen — computed over the full sale
 * history independent of the active SaleFilters, matching the web's own
 * today/week/month derivations from the raw `sales` array. */
export interface SaleListSummary {
  todayTotalMinor: number;
  todayCount: number;
  todayProfitMinor: number;
  weekTotalMinor: number;
  weekCount: number;
  monthTotalMinor: number;
  monthCount: number;
  monthProfitMinor: number;
  paymentMixMinor: Record<PaymentMethod, number>;
}

export interface SaleReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  amountMinor: number;
}

export interface SaleReturn {
  id: string;
  reference: string;
  saleId: string;
  receiptNo: string;
  createdAt: string;
  items: SaleReturnItem[];
  refundMinor: number;
  reason: string;
  restock: boolean;
}

export interface CreateSaleReturnItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleReturnInput {
  saleId: string;
  items: CreateSaleReturnItemInput[];
  reason: string;
  restock: boolean;
}
