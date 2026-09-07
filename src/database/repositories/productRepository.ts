/**
 * Repository ↔ Mapper for `products`. Mirrors productsProvider.ts's
 * contract (src/features/products/data/productsProvider.ts) plus the
 * filter/search shape ProductFilters already defines — the WHERE clause
 * is built once here in SQL rather than fetched-then-filtered in JS.
 */
import { getDatabase } from '../client';
import { fromEpochMs, fromScaledQuantity, fromSqliteBool, toScaledQuantity } from '../mappers';
import { translateSqliteError } from '../errors';
import { generateId, nowMs, type DbExecutor } from './shared';
import type { CreateProductInput, Product, ProductFilters, UpdateProductInput } from '@/features/products/types';

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  unit_id: string | null;
  brand: string | null;
  location: string | null;
  purchase_price_minor: number;
  selling_price_minor: number;
  minimum_stock: number;
  current_stock: number;
  description: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
}

function mapProductRowToDomain(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    brand: row.brand,
    location: row.location,
    categoryId: row.category_id,
    unitId: row.unit_id,
    purchasePriceMinor: row.purchase_price_minor,
    sellingPriceMinor: row.selling_price_minor,
    minimumStock: fromScaledQuantity(row.minimum_stock),
    currentStock: fromScaledQuantity(row.current_stock),
    description: row.description,
    isActive: fromSqliteBool(row.is_active),
    createdAt: fromEpochMs(row.created_at),
    updatedAt: fromEpochMs(row.updated_at),
  };
}

const SORT_TO_ORDER_BY: Record<ProductFilters['sort'], string> = {
  name: 'name COLLATE NOCASE ASC',
  stock: 'current_stock ASC',
  price: 'selling_price_minor DESC',
  recent: 'created_at DESC',
};

/**
 * Pagination-ready but not pagination-required: `limit`/`offset` are
 * repository-only extras (not part of ProductFilters) so today's callers
 * are unaffected and a future paged list needs no query rewrite.
 */
export async function getProducts(filters: ProductFilters, options?: { limit?: number; offset?: number }): Promise<Product[]> {
  const db = await getDatabase();
  const clauses = ['is_active = 1'];
  const params: (string | number)[] = [];

  const q = filters.query.trim();
  if (q) {
    clauses.push('(name LIKE ? OR sku LIKE ? OR barcode LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (filters.categoryId !== 'all') {
    clauses.push('category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.brand !== 'all') {
    clauses.push('brand = ?');
    params.push(filters.brand);
  }
  // Mirrors products/utils/stockStatus.ts's getStockStatus() boundaries
  // exactly: out <= 0, low <= minimum (and > 0), in > minimum.
  if (filters.status === 'out') {
    clauses.push('current_stock <= 0');
  } else if (filters.status === 'low') {
    clauses.push('current_stock > 0 AND current_stock <= minimum_stock');
  } else if (filters.status === 'in') {
    clauses.push('current_stock > minimum_stock');
  }

  let sql = `SELECT * FROM products WHERE ${clauses.join(' AND ')} ORDER BY ${SORT_TO_ORDER_BY[filters.sort]}`;
  if (options?.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(options.limit);
    if (options?.offset !== undefined) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const rows = await db.getAllAsync<ProductRow>(sql, params);
  return rows.map(mapProductRowToDomain);
}

/**
 * No active filter — a purchase/sale item's product_id, or Scanner's
 * "Open product" on an archived match, must still resolve. Optional
 * `executor`: a future atomic use-case reads the pre-write stock value
 * inside its own transaction (e.g. before calling updateCurrentStock)
 * rather than against a separate, possibly-stale connection read.
 */
export async function getProductById(id: string, executor?: DbExecutor): Promise<Product | undefined> {
  const db = executor ?? (await getDatabase());
  const row = await db.getFirstAsync<ProductRow>(`SELECT * FROM products WHERE id = ?`, [id]);
  return row ? mapProductRowToDomain(row) : undefined;
}

/** Scanner's direct lookup — active only, matching "normal reads exclude
 * archived" (an archived product isn't a valid sell-again target). */
export async function findProductByBarcode(barcode: string): Promise<Product | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProductRow>(`SELECT * FROM products WHERE barcode = ? AND is_active = 1`, [barcode]);
  return row ? mapProductRowToDomain(row) : undefined;
}

export async function isSkuTaken(sku: string, excludingId?: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(`SELECT id FROM products WHERE sku = ? COLLATE NOCASE AND id != ? LIMIT 1`, [sku, excludingId ?? '']);
  return row !== null;
}

/** Exact-match, case-sensitive — matches productsProvider.ts's isBarcodeTaken
 * (`===`), unlike SKU's case-insensitive check. */
export async function isBarcodeTaken(barcode: string, excludingId?: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(`SELECT id FROM products WHERE barcode = ? AND id != ? LIMIT 1`, [barcode, excludingId ?? '']);
  return row !== null;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const db = await getDatabase();
  const id = generateId('prd');
  const now = nowMs();
  const currentStock = toScaledQuantity(input.openingStock);
  const minimumStock = toScaledQuantity(input.minimumStock);
  try {
    await db.runAsync(
      `INSERT INTO products (
        id, name, sku, barcode, category_id, unit_id, brand, location,
        purchase_price_minor, selling_price_minor, minimum_stock, current_stock,
        description, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.name,
        input.sku,
        input.barcode,
        input.categoryId,
        input.unitId,
        input.brand,
        input.location,
        input.purchasePriceMinor,
        input.sellingPriceMinor,
        minimumStock,
        currentStock,
        input.description,
        now,
        now,
      ]
    );
  } catch (error) {
    translateSqliteError(error, { entity: 'Product' });
  }
  return {
    id,
    name: input.name,
    sku: input.sku,
    barcode: input.barcode,
    brand: input.brand,
    location: input.location,
    categoryId: input.categoryId,
    unitId: input.unitId,
    purchasePriceMinor: input.purchasePriceMinor,
    sellingPriceMinor: input.sellingPriceMinor,
    minimumStock: input.minimumStock,
    currentStock: input.openingStock,
    description: input.description,
    isActive: true,
    createdAt: fromEpochMs(now),
    updatedAt: fromEpochMs(now),
  };
}

/** No current_stock column — matches UpdateProductInput, which never
 * carries stock (the domain rule: stock changes only via Stock In/Out/
 * Adjust, never a direct product edit). */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const db = await getDatabase();
  const now = nowMs();
  try {
    await db.runAsync(
      `UPDATE products SET
        name = ?, sku = ?, barcode = ?, category_id = ?, unit_id = ?, brand = ?, location = ?,
        purchase_price_minor = ?, selling_price_minor = ?, minimum_stock = ?, description = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.name,
        input.sku,
        input.barcode,
        input.categoryId,
        input.unitId,
        input.brand,
        input.location,
        input.purchasePriceMinor,
        input.sellingPriceMinor,
        toScaledQuantity(input.minimumStock),
        input.description,
        now,
        id,
      ]
    );
  } catch (error) {
    translateSqliteError(error, { entity: 'Product' });
  }
  const updated = await getProductById(id);
  if (!updated) throw new Error(`Product ${id} not found after update`);
  return updated;
}

/** Archive semantics — is_active = 0, current_stock untouched. */
export async function archiveProduct(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?`, [nowMs(), id]);
}

/**
 * Low-level primitive: writes the authoritative cached current_stock
 * value and nothing else. No validation (negative stock, stock-out
 * checks, etc.) — that belongs to the Stage 3 use-case that calls this
 * inside the same transaction as its movement insert. Required executor
 * (not optional) so this can never accidentally run outside the caller's
 * transaction.
 */
export async function updateCurrentStock(executor: DbExecutor, productId: string, currentStock: number): Promise<void> {
  await executor.runAsync(`UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?`, [toScaledQuantity(currentStock), nowMs(), productId]);
}
