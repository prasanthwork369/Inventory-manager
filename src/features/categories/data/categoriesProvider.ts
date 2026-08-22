/**
 * The single swappable boundary between Categories' hook and its data
 * source — same pattern as Products' productsProvider.ts. When SQLite
 * arrives, this file's internals become repository calls; the exported
 * function signatures are what a CategoryRepository would expose, so the
 * hook/screen need no change.
 *
 * getCategories() reads Products' getProducts() (read-only) purely to
 * compute each category's product count — the future equivalent is a
 * `LEFT JOIN products ... GROUP BY` in one SQL query. This does not
 * import or re-expose any Product type beyond that count.
 *
 * create/update/archive are intentionally no-ops beyond the simulated
 * delay, same "do not persist yet" reasoning as Products — no fake
 * mutable store.
 *
 * archiveCategory (not deleteCategory): a category may be referenced by
 * products, so it's never physically deleted — only archived
 * (`isActive = false`), matching the same production-safety correction
 * already applied to Products.
 */
import { getProducts } from '@/features/products/data/productsProvider';
import type { Category, CategoryWithProductCount, CreateCategoryInput, UpdateCategoryInput } from '../types';
import { MOCK_CATEGORIES } from './mockCategories';

const SIMULATED_DELAY_MS = 420;
const SAVE_DELAY_MS = 500;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getCategories(): Promise<CategoryWithProductCount[]> {
  const [categories, products] = await Promise.all([delay(MOCK_CATEGORIES, SIMULATED_DELAY_MS), getProducts()]);
  return categories.map((c) => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id).length }));
}

export function isCategoryNameTaken(name: string, excludingId?: string): Promise<boolean> {
  const taken = MOCK_CATEGORIES.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludingId);
  return delay(taken, 0);
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  const now = new Date().toISOString();
  const category: Category = {
    id: `cat-${Date.now()}`,
    name: input.name,
    description: input.description,
    icon: input.icon,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  return delay(category, SAVE_DELAY_MS);
}

export function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const existing = MOCK_CATEGORIES.find((c) => c.id === id);
  const category: Category = {
    id,
    isActive: existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input,
  };
  return delay(category, SAVE_DELAY_MS);
}

/** Archive semantics, not deletion — see the file header. `_id` is unused
 * because this mock provider doesn't mutate MOCK_CATEGORIES; a real
 * CategoryRepository would use it to set that row's isActive to false. */
export function archiveCategory(_id: string): Promise<void> {
  return delay(undefined, SAVE_DELAY_MS);
}
