/**
 * Repository ↔ Mapper for `customers`. Mirrors customersProvider.ts's
 * contract — same shape/reasoning as supplierRepository.ts, mirrored
 * against `sales` instead of `purchases`.
 */
import { getDatabase } from '../client';
import { fromEpochMs, fromSqliteBool } from '../mappers';
import { generateId, nowMs } from './shared';
import type { CreateCustomerInput, Customer, CustomerDetailSummary, UpdateCustomerInput } from '@/features/customers/types';

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  is_active: number;
  created_at: number;
  updated_at: number;
}

function mapCustomerRowToDomain(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    isActive: fromSqliteBool(row.is_active),
    createdAt: fromEpochMs(row.created_at),
    updatedAt: fromEpochMs(row.updated_at),
  };
}

export async function getActiveCustomers(): Promise<Customer[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomerRow>(`SELECT * FROM customers WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC`);
  return rows.map(mapCustomerRowToDomain);
}

export async function countActiveCustomers(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM customers WHERE is_active = 1`);
  return row?.n ?? 0;
}

/** No UNIQUE constraint on phone — soft, form-level advisory check only,
 * matching customersProvider.ts's pre-Stage-4 behavior. */
export async function isCustomerPhoneTaken(phone: string, excludingId?: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(`SELECT id FROM customers WHERE phone = ? AND id != ? LIMIT 1`, [phone, excludingId ?? '']);
  return row !== null;
}

/** No active filter — a sale's customer_id must still resolve after the
 * customer is archived. */
export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CustomerRow>(`SELECT * FROM customers WHERE id = ?`, [id]);
  return row ? mapCustomerRowToDomain(row) : undefined;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const db = await getDatabase();
  const id = generateId('cus');
  const now = nowMs();
  await db.runAsync(`INSERT INTO customers (id, name, phone, email, address, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    id,
    input.name,
    input.phone,
    input.email,
    input.address,
    input.notes,
    now,
    now,
  ]);
  return { id, ...input, isActive: true, createdAt: fromEpochMs(now), updatedAt: fromEpochMs(now) };
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const db = await getDatabase();
  const now = nowMs();
  await db.runAsync(`UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = ? WHERE id = ?`, [
    input.name,
    input.phone,
    input.email,
    input.address,
    input.notes,
    now,
    id,
  ]);
  const updated = await getCustomerById(id);
  if (!updated) throw new Error(`Customer ${id} not found after update`);
  return updated;
}

export async function archiveCustomer(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ?`, [nowMs(), id]);
}

export async function getCustomerDetailSummary(id: string): Promise<CustomerDetailSummary> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sales_count: number; total_spent_minor: number | null }>(
    `SELECT COUNT(*) AS sales_count, SUM(total_minor) AS total_spent_minor FROM sales WHERE customer_id = ?`,
    [id]
  );
  return {
    salesCount: row?.sales_count ?? 0,
    totalSpentMinor: row?.total_spent_minor ?? 0,
    // No credit-ledger table exists yet — see suppliersRepository's
    // equivalent comment.
    outstandingMinor: 0,
  };
}
