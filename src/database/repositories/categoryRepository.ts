/**
 * Repository ↔ Mapper for `categories`. Mirrors categoriesProvider.ts's
 * current contract exactly (see src/features/categories/data/
 * categoriesProvider.ts) so a future Stage 3 swap needs no signature
 * change.
 */
import { getDatabase } from '../client';
import { fromEpochMs, fromSqliteBool } from '../mappers';
import { translateSqliteError } from '../errors';
import { generateId, nowMs } from './shared';
import type { Category, CategoryWithProductCount, CreateCategoryInput, UpdateCategoryInput } from '@/features/categories/types';

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: number;
  created_at: number;
  updated_at: number;
}

function mapCategoryRowToDomain(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    isActive: fromSqliteBool(row.is_active),
    createdAt: fromEpochMs(row.created_at),
    updatedAt: fromEpochMs(row.updated_at),
  };
}

/** Normal reads exclude archived categories — matches every list screen's
 * existing behavior of never showing archived entities. */
export async function getActiveCategories(): Promise<CategoryWithProductCount[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow & { product_count: number }>(
    `SELECT c.*, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     WHERE c.is_active = 1
     GROUP BY c.id
     ORDER BY c.name COLLATE NOCASE ASC`
  );
  return rows.map((row) => ({ ...mapCategoryRowToDomain(row), productCount: row.product_count }));
}

/** No active filter — a category referenced by an archived/historical
 * product must still resolve (see Products' category_id ON DELETE SET
 * NULL note in the Stage 1 schema). */
export async function getCategoryById(id: string): Promise<CategoryWithProductCount | undefined> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow & { product_count: number }>(
    `SELECT c.*, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );
  return row ? { ...mapCategoryRowToDomain(row), productCount: row.product_count } : undefined;
}

export async function isCategoryNameTaken(name: string, excludingId?: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM categories WHERE name = ? COLLATE NOCASE AND id != ? LIMIT 1`,
    [name, excludingId ?? '']
  );
  return row !== null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const db = await getDatabase();
  const id = generateId('cat');
  const now = nowMs();
  try {
    await db.runAsync(
      `INSERT INTO categories (id, name, description, icon, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [id, input.name, input.description, input.icon, now, now]
    );
  } catch (error) {
    translateSqliteError(error, { entity: 'Category' });
  }
  return { id, name: input.name, description: input.description, icon: input.icon, isActive: true, createdAt: fromEpochMs(now), updatedAt: fromEpochMs(now) };
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const db = await getDatabase();
  const now = nowMs();
  try {
    await db.runAsync(`UPDATE categories SET name = ?, description = ?, icon = ?, updated_at = ? WHERE id = ?`, [
      input.name,
      input.description,
      input.icon,
      now,
      id,
    ]);
  } catch (error) {
    translateSqliteError(error, { entity: 'Category' });
  }
  const updated = await getCategoryById(id);
  if (!updated) throw new Error(`Category ${id} not found after update`);
  return updated;
}

/** Archive semantics, not deletion — sets is_active = 0. Referenced
 * products keep their category_id (never cascaded/cleared by archiving,
 * only by an actual row delete, which the app never performs). */
export async function archiveCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?`, [nowMs(), id]);
}
