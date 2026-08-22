/**
 * Category domain types, adapted from the web reference's `Category` (in
 * src/types/index.ts: `{ id, name, icon, description }`) with the
 * future-ready fields (`isActive`, `createdAt`, `updatedAt`) already used
 * for Product. `icon` stays a plain string (the emoji glyph itself, e.g.
 * "📦") exactly as the web stores it — never a rendered component — so a
 * future SQLite `categories.icon` TEXT column needs no mapping change.
 */

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** List view-model: product count is a derived aggregate (a future
 * `LEFT JOIN products ... GROUP BY` result), never stored on the category
 * row itself. */
export interface CategoryWithProductCount extends Category {
  productCount: number;
}

export interface CreateCategoryInput {
  name: string;
  description: string | null;
  icon: string;
}

export type UpdateCategoryInput = CreateCategoryInput;
