/**
 * The single swappable boundary between Customers' hooks and its data
 * source — now backed by customerRepository (Database Stage 2) instead
 * of a mock array. Exported signatures are unchanged.
 *
 * archiveCustomer (not deleteCustomer): archive semantics were already
 * the internal operation name pre-SQLite; the repository call now
 * genuinely sets is_active = 0. Visible "Delete" wording is unaffected.
 */
import { customerRepository } from '@/database';
import type { Customer, CreateCustomerInput, CustomerDetailSummary, UpdateCustomerInput } from '../types';

export function getCustomers(): Promise<Customer[]> {
  return customerRepository.getActiveCustomers();
}

export function getCustomerById(id: string): Promise<Customer | undefined> {
  return customerRepository.getCustomerById(id);
}

export function isCustomerPhoneTaken(phone: string, excludingId?: string): Promise<boolean> {
  return customerRepository.isCustomerPhoneTaken(phone, excludingId);
}

export function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  return customerRepository.createCustomer(input);
}

export function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  return customerRepository.updateCustomer(id, input);
}

export function archiveCustomer(id: string): Promise<void> {
  return customerRepository.archiveCustomer(id);
}

/** salesCount/totalSpentMinor are now real (derived from the `sales`
 * table); outstandingMinor stays 0 — no credit-ledger schema exists yet,
 * same as before. */
export function getCustomerDetailSummary(id: string): Promise<CustomerDetailSummary> {
  return customerRepository.getCustomerDetailSummary(id);
}
