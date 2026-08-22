/**
 * Adapted from the web reference's shared `Party` type (src/types/index.ts),
 * used there for both suppliers and customers. Split into its own named
 * Customer contract per this phase's explicit data-boundary requirement
 * (Customer screens -> customer hooks -> Customer types ->
 * customersProvider, independent of Suppliers).
 *
 * No `outstanding` (or any sales-derived field) on this entity — those
 * are future *derived financial aggregates*, not intrinsic party data,
 * so they don't imply a persisted customers-table column. They're
 * exposed via CustomerDetailSummary instead (see below), kept at 0 until
 * the credit-ledger/Sales features that would compute them exist.
 */

export interface Customer {
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

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export type UpdateCustomerInput = CreateCustomerInput;

/**
 * View-only aggregate for CustomerDetailScreen (and the list row's
 * per-customer stat), separate from the Customer entity itself. All
 * money fields are integer minor units. Always zero today — Sales and
 * the credit-ledger feature that would compute real values don't exist
 * yet; this is the seam they'll be wired through later with no screen
 * change.
 */
export interface CustomerDetailSummary {
  salesCount: number;
  totalSpentMinor: number;
  outstandingMinor: number;
}
