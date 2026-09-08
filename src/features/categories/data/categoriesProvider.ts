/**
 * The single swappable boundary between Categories' hook and its data
 * source — now backed by categoryRepository (Database Stage 2) instead of
 * a mock array. Exported signatures are unchanged, so useCategories.ts
 * needed no edits.
 *
 * archiveCategory (not deleteCategory): archive semantics were already
 * the internal operation name pre-SQLite; the repository call now
 * genuinely sets is_active = 0 rather than being a no-op.
 */
import { categoryRepository } from '@/database';
import type { Category, CategoryWithProductCount, CreateCategoryInput, UpdateCategoryInput } from '../types';

export function getCategories(): Promise<CategoryWithProductCount[]> {
  return categoryRepository.getActiveCategories();
}

export async function isCategoryNameTaken(name: string, excludingId?: string): Promise<boolean> {
  return categoryRepository.isCategoryNameTaken(name, excludingId);
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return categoryRepository.createCategory(input);
}

export function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  return categoryRepository.updateCategory(id, input);
}

export function archiveCategory(id: string): Promise<void> {
  return categoryRepository.archiveCategory(id);
}
