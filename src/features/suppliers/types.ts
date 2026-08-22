/**
 * Adapted from the web reference's shared `Party` type (src/types/index.ts),
 * used there for both suppliers and customers. Split into its own named
 * Supplier contract here per this phase's explicit data-boundary
 * requirement (Supplier screens -> supplier hooks -> Supplier types ->
 * suppliersProvider, independent of Customers) rather than one shared
 * "Party" feature.
 *
 * No `outstanding` (or any purchase-derived field) on this entity —
 * those are future *derived financial aggregates*, not intrinsic party
 * data, so they don't imply a persisted suppliers-table column. They're
 * exposed via SupplierDetailSummary instead (see below), kept at 0 until
 * the credit-ledger/Purchases features that would compute them exist.
 */

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export type UpdateSupplierInput = CreateSupplierInput;

/**
 * View-only aggregate for SupplierDetailScreen (and the list row's
 * per-supplier stat), separate from the Supplier entity itself. All
 * money fields are integer minor units. Always zero today — Purchases
 * and the credit-ledger feature that would compute real values don't
 * exist yet; this is the seam they'll be wired through later with no
 * screen change.
 */
export interface SupplierDetailSummary {
  purchaseCount: number;
  purchaseValueMinor: number;
  outstandingMinor: number;
}
