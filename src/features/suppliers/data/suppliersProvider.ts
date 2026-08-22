/**
 * The single swappable boundary between Suppliers' hooks and its data
 * source — mirrors productsProvider.ts/categoriesProvider.ts exactly.
 * create/update/archive are non-mutating beyond the simulated delay, same
 * "do not build a fake mutable store" decision made in those phases.
 *
 * archiveSupplier (not deleteSupplier): the web hard-deletes suppliers,
 * but per this phase's explicit instruction, the internal operation here
 * is archive semantics (isActive = false in a future SQLite row), never
 * a physical delete — the same production-safety correction already
 * applied to Products/Categories. The visible "Delete" wording in
 * SupplierDetailScreen is unchanged.
 */
import type { CreateSupplierInput, Supplier, SupplierDetailSummary, UpdateSupplierInput } from '../types';
import { MOCK_SUPPLIERS } from './mockSuppliers';

const SIMULATED_DELAY_MS = 420;
const SAVE_DELAY_MS = 500;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getSuppliers(): Promise<Supplier[]> {
  return delay(MOCK_SUPPLIERS, SIMULATED_DELAY_MS);
}

export function getSupplierById(id: string): Promise<Supplier | undefined> {
  return delay(
    MOCK_SUPPLIERS.find((s) => s.id === id),
    SIMULATED_DELAY_MS
  );
}

export function isSupplierPhoneTaken(phone: string, excludingId?: string): Promise<boolean> {
  const taken = MOCK_SUPPLIERS.some((s) => s.phone === phone && s.id !== excludingId);
  return delay(taken, 0);
}

export function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const now = new Date().toISOString();
  const supplier: Supplier = {
    id: `sup-${Date.now()}`,
    ...input,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  return delay(supplier, SAVE_DELAY_MS);
}

export function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const existing = MOCK_SUPPLIERS.find((s) => s.id === id);
  const supplier: Supplier = {
    id,
    isActive: existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input,
  };
  return delay(supplier, SAVE_DELAY_MS);
}

export function archiveSupplier(_id: string): Promise<void> {
  return delay(undefined, SAVE_DELAY_MS);
}

/** Purchases and the credit-ledger feature that would compute real
 * purchase/outstanding figures don't exist yet, so this is honestly
 * zero — see SupplierDetailSummary's doc for why it's a separate type
 * from Supplier rather than fields on the entity itself. */
export function getSupplierDetailSummary(_id: string): Promise<SupplierDetailSummary> {
  return delay({ purchaseCount: 0, purchaseValueMinor: 0, outstandingMinor: 0 }, SIMULATED_DELAY_MS);
}
