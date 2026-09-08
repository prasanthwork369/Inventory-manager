/**
 * The single swappable boundary between Products' hooks and its data
 * source — now backed by productRepository (Database Stage 2) instead of
 * a mock array. Exported signatures are unchanged: `getProducts()` still
 * takes no filters (useProducts.ts does its own client-side filter/sort
 * over the full active list, same as before) — it's the repository call
 * underneath that changed, not the contract, so no hook/screen edits.
 *
 * archiveProduct (not deleteProduct): archive semantics were already the
 * internal operation name pre-SQLite; the repository call now genuinely
 * sets is_active = 0 rather than being a no-op. The visible "Delete"
 * wording in ProductDetailScreen is unaffected.
 */
import { categoryRepository, productRepository } from '@/database';
import type { CreateProductInput, Product, ProductCategoryOption, UpdateProductInput } from '../types';

// "Get everything active" permissive filter — same pattern reportsProvider.ts
// already uses against Sales/Purchases, so useProducts.ts's own filtering
// keeps working unchanged over the full list.
const ALL_FILTERS = { query: '', categoryId: 'all', brand: 'all', status: 'all', sort: 'name' } as const;

export function getProducts(): Promise<Product[]> {
  return productRepository.getProducts(ALL_FILTERS);
}

export function getProductById(id: string): Promise<Product | undefined> {
  return productRepository.getProductById(id);
}

export async function getCategories(): Promise<ProductCategoryOption[]> {
  const categories = await categoryRepository.getActiveCategories();
  return categories.map((c) => ({ id: c.id, name: c.name }));
}

export function isSkuTaken(sku: string, excludingId?: string): Promise<boolean> {
  return productRepository.isSkuTaken(sku, excludingId);
}

export function isBarcodeTaken(barcode: string, excludingId?: string): Promise<boolean> {
  return productRepository.isBarcodeTaken(barcode, excludingId);
}

export function createProduct(input: CreateProductInput): Promise<Product> {
  return productRepository.createProduct(input);
}

export function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  return productRepository.updateProduct(id, input);
}

export function archiveProduct(id: string): Promise<void> {
  return productRepository.archiveProduct(id);
}
