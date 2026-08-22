/**
 * The single swappable boundary between Products' hooks and its data
 * source. Every hook in ../hooks/ calls only these functions — never
 * MOCK_PRODUCTS/MOCK_CATEGORIES directly. When SQLite arrives, this file's
 * internals become repository calls (mapped through a Product mapper);
 * the function signatures below are what a ProductRepository would
 * expose, so hooks/screens need no change.
 *
 * create/update/archive are intentionally no-ops beyond the simulated
 * delay — "do not persist yet" per the brief. They exist so the form/
 * detail screens' loading + success states have something real to await,
 * without building a fake mutable in-memory store that would just be
 * thrown away once SQLite lands.
 *
 * archiveProduct (not deleteProduct): Products may later be referenced by
 * stock movements, purchase items, sale items, returns and reports, so a
 * referenced product is never physically deleted — only archived
 * (`isActive = false`). The future SQLite-backed implementation of this
 * function will be `UPDATE products SET isActive = 0 WHERE id = ?`, never
 * a `DELETE`. The user-visible "Delete" wording in ProductDetailScreen is
 * unchanged — this rename is the internal/domain operation name only.
 */
import type { CreateProductInput, Product, ProductCategoryOption, UpdateProductInput } from '../types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './mockProducts';

const SIMULATED_DELAY_MS = 420;
const SAVE_DELAY_MS = 500;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getProducts(): Promise<Product[]> {
  return delay(MOCK_PRODUCTS, SIMULATED_DELAY_MS);
}

export function getProductById(id: string): Promise<Product | undefined> {
  return delay(
    MOCK_PRODUCTS.find((p) => p.id === id),
    SIMULATED_DELAY_MS
  );
}

export function getCategories(): Promise<ProductCategoryOption[]> {
  return delay(MOCK_CATEGORIES, SIMULATED_DELAY_MS);
}

export function isSkuTaken(sku: string, excludingId?: string): Promise<boolean> {
  const taken = MOCK_PRODUCTS.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludingId);
  return delay(taken, 0);
}

export function isBarcodeTaken(barcode: string, excludingId?: string): Promise<boolean> {
  const taken = MOCK_PRODUCTS.some((p) => p.barcode === barcode && p.id !== excludingId);
  return delay(taken, 0);
}

export function createProduct(input: CreateProductInput): Promise<Product> {
  const now = new Date().toISOString();
  const product: Product = {
    id: `prd-${Date.now()}`,
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
    createdAt: now,
    updatedAt: now,
  };
  return delay(product, SAVE_DELAY_MS);
}

export function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const existing = MOCK_PRODUCTS.find((p) => p.id === id);
  const product: Product = {
    id,
    currentStock: existing?.currentStock ?? 0,
    isActive: existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input,
  };
  return delay(product, SAVE_DELAY_MS);
}

/** Archive semantics, not deletion — see the file header. `_id` is unused
 * because this mock provider doesn't mutate MOCK_PRODUCTS (same "no fake
 * mutable store" reasoning as create/update); a real ProductRepository
 * would use it to set that row's isActive to false. */
export function archiveProduct(_id: string): Promise<void> {
  return delay(undefined, SAVE_DELAY_MS);
}
