/**
 * The single swappable boundary between Suppliers' hooks and its data
 * source — now backed by supplierRepository (Database Stage 2) instead
 * of a mock array. Exported signatures are unchanged.
 *
 * archiveSupplier (not deleteSupplier): archive semantics were already
 * the internal operation name pre-SQLite; the repository call now
 * genuinely sets is_active = 0. Visible "Delete" wording is unaffected.
 */
import { supplierRepository } from '@/database';
import type { CreateSupplierInput, Supplier, SupplierDetailSummary, UpdateSupplierInput } from '../types';

export function getSuppliers(): Promise<Supplier[]> {
  return supplierRepository.getActiveSuppliers();
}

export function getSupplierById(id: string): Promise<Supplier | undefined> {
  return supplierRepository.getSupplierById(id);
}

export function isSupplierPhoneTaken(phone: string, excludingId?: string): Promise<boolean> {
  return supplierRepository.isSupplierPhoneTaken(phone, excludingId);
}

export function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  return supplierRepository.createSupplier(input);
}

export function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  return supplierRepository.updateSupplier(id, input);
}

export function archiveSupplier(id: string): Promise<void> {
  return supplierRepository.archiveSupplier(id);
}

/** purchaseCount/purchaseValueMinor are now real (derived from the
 * `purchases` table); outstandingMinor stays 0 — no credit-ledger schema
 * exists yet, same as before. */
export function getSupplierDetailSummary(id: string): Promise<SupplierDetailSummary> {
  return supplierRepository.getSupplierDetailSummary(id);
}
