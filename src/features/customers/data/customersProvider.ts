/**
 * The single swappable boundary between Customers' hooks and its data
 * source — mirrors suppliersProvider.ts exactly (see that file's header
 * for the non-mutating / archive-not-delete reasoning, which applies
 * identically here).
 */
import type { Customer, CreateCustomerInput, CustomerDetailSummary, UpdateCustomerInput } from '../types';
import { MOCK_CUSTOMERS } from './mockCustomers';

const SIMULATED_DELAY_MS = 420;
const SAVE_DELAY_MS = 500;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getCustomers(): Promise<Customer[]> {
  return delay(MOCK_CUSTOMERS, SIMULATED_DELAY_MS);
}

export function getCustomerById(id: string): Promise<Customer | undefined> {
  return delay(
    MOCK_CUSTOMERS.find((c) => c.id === id),
    SIMULATED_DELAY_MS
  );
}

export function isCustomerPhoneTaken(phone: string, excludingId?: string): Promise<boolean> {
  const taken = MOCK_CUSTOMERS.some((c) => c.phone === phone && c.id !== excludingId);
  return delay(taken, 0);
}

export function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const now = new Date().toISOString();
  const customer: Customer = {
    id: `cus-${Date.now()}`,
    ...input,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  return delay(customer, SAVE_DELAY_MS);
}

export function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const existing = MOCK_CUSTOMERS.find((c) => c.id === id);
  const customer: Customer = {
    id,
    isActive: existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input,
  };
  return delay(customer, SAVE_DELAY_MS);
}

export function archiveCustomer(_id: string): Promise<void> {
  return delay(undefined, SAVE_DELAY_MS);
}

/** Sales and the credit-ledger feature that would compute real
 * purchase/outstanding figures don't exist yet, so this is honestly
 * zero — see CustomerDetailSummary's doc for why it's a separate type
 * from Customer rather than fields on the entity itself. */
export function getCustomerDetailSummary(_id: string): Promise<CustomerDetailSummary> {
  return delay({ salesCount: 0, totalSpentMinor: 0, outstandingMinor: 0 }, SIMULATED_DELAY_MS);
}
