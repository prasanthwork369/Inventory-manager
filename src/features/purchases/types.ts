/**
 * Direct conversion of the web reference's Purchase/PurchaseItem
 * (src/types/index.ts) into this project's stable contracts. Money is
 * integer minor units (paise) — the web's plain-number `cost`/`total`
 * become `unitCostMinor`/`totalMinor` etc, same rule already applied to
 * Product/Stock.
 *
 * `supplierName` and `productName` are deliberate historical snapshots,
 * matching the web source exactly (`createPurchase` there also copies
 * `supplier?.name` and each product's `name` onto the record at creation
 * time) — a purchase is a historical transaction, so it must keep
 * showing what the supplier/product were called even if renamed or
 * archived later. `supplierId`/`productId` remain the authoritative
 * canonical references for navigation/lookup; the snapshot fields are
 * display-only.
 *
 * No purchase lifecycle status (draft/completed/cancelled) is modeled:
 * the web source has none — every created purchase is immediately final,
 * and there is no delete/cancel affordance anywhere in PurchasesHome.tsx
 * or PurchaseDetail.tsx. `paymentStatus` is the only status-like field,
 * copied verbatim. Likewise no `paidMinor`/`outstandingMinor` on
 * Purchase — the web only ever tracks payment as this 3-value enum, not
 * a numeric ledger; inventing one here would be unrequested scope.
 */

export type PurchasePaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCostMinor: number;
}

export interface Purchase {
  id: string;
  reference: string;
  createdAt: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paymentStatus: PurchasePaymentStatus;
  notes: string;
}

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
  unitCostMinor: number;
}

export interface CreatePurchaseInput {
  supplierId: string;
  items: CreatePurchaseItemInput[];
  discountMinor: number;
  paymentStatus: PurchasePaymentStatus;
  notes: string;
}

/** Database-ready query shape for getPurchases — every field maps to a
 * WHERE/ORDER clause a future PurchaseRepository would take, mirroring
 * Stock's StockMovementFilters so today's in-memory filter becomes a SQL
 * query later with no hook/screen change. */
export interface PurchaseFilters {
  query: string;
  rangeDays: 1 | 7 | 30 | 'all';
  supplierId: string | 'all';
  paymentStatus: PurchasePaymentStatus | 'all';
}

/** Aggregate stats for the list screen's summary card — computed over
 * the full (unfiltered) purchase history, independent of the active
 * `PurchaseFilters`, matching the web's own `today`/`month`/`outstanding`
 * derivations from the raw `purchases` array rather than `results`. */
export interface PurchaseListSummary {
  monthTotalMinor: number;
  monthCount: number;
  todayTotalMinor: number;
  todayCount: number;
  unpaidTotalMinor: number;
  unpaidCount: number;
  supplierCount: number;
}
