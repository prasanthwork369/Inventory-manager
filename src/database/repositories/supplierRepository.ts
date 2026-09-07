/**
 * Repository ↔ Mapper for `suppliers`. Mirrors suppliersProvider.ts's
 * contract. getSupplierDetailSummary derives purchaseCount/
 * purchaseValueMinor for real from the `purchases` table (Section 10 of
 * the Stage 2 brief explicitly allows this) — outstandingMinor stays 0,
 * same as the domain type's own comment: no credit-ledger schema exists
 * yet to compute it from.
 */
import { getDatabase } from '../client';
import { fromEpochMs, fromSqliteBool } from '../mappers';
import { generateId, nowMs } from './shared';
import type { CreateSupplierInput, Supplier, SupplierDetailSummary, UpdateSupplierInput } from '@/features/suppliers/types';

interface SupplierRow {
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

function mapSupplierRowToDomain(row: SupplierRow): Supplier {
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

export async function getActiveSuppliers(): Promise<Supplier[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SupplierRow>(`SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name COLLATE NOCASE ASC`);
  return rows.map(mapSupplierRowToDomain);
}

export async function countActiveSuppliers(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM suppliers WHERE is_active = 1`);
  return row?.n ?? 0;
}

/** No active filter — a purchase's supplier_id must still resolve after
 * the supplier is archived. */
export async function getSupplierById(id: string): Promise<Supplier | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SupplierRow>(`SELECT * FROM suppliers WHERE id = ?`, [id]);
  return row ? mapSupplierRowToDomain(row) : undefined;
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const db = await getDatabase();
  const id = generateId('sup');
  const now = nowMs();
  await db.runAsync(`INSERT INTO suppliers (id, name, phone, email, address, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
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

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
  const db = await getDatabase();
  const now = nowMs();
  await db.runAsync(`UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = ? WHERE id = ?`, [
    input.name,
    input.phone,
    input.email,
    input.address,
    input.notes,
    now,
    id,
  ]);
  const updated = await getSupplierById(id);
  if (!updated) throw new Error(`Supplier ${id} not found after update`);
  return updated;
}

export async function archiveSupplier(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE suppliers SET is_active = 0, updated_at = ? WHERE id = ?`, [nowMs(), id]);
}

export async function getSupplierDetailSummary(id: string): Promise<SupplierDetailSummary> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ purchase_count: number; purchase_value_minor: number | null }>(
    `SELECT COUNT(*) AS purchase_count, SUM(total_minor) AS purchase_value_minor FROM purchases WHERE supplier_id = ?`,
    [id]
  );
  return {
    purchaseCount: row?.purchase_count ?? 0,
    purchaseValueMinor: row?.purchase_value_minor ?? 0,
    // No credit-ledger table exists yet — see the file header.
    outstandingMinor: 0,
  };
}
