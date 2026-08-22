/**
 * Product domain types, adapted from the web reference's `Product` (in
 * src/types/index.ts) to the field names/shapes approved for this project
 * rather than copied verbatim — two deliberate deviations from the web
 * shape, both already decided at the architecture stage, not new calls:
 *
 * 1. Money is integer minor units (`purchasePriceMinor`/`sellingPriceMinor`,
 *    paise), never float rupees — web's `costPrice`/`price` are plain
 *    numbers. See utils/money.ts for the only place conversion happens.
 * 2. No `supplierId` on Product. The web has one, but the approved schema
 *    links suppliers through Purchases, not a direct product FK — that
 *    decision predates this feature (see the original architecture
 *    report). The web's "Supplier" detail card and filter are dropped
 *    accordingly, not because the web is wrong, but because our data
 *    model deliberately doesn't carry that field on Product.
 *
 * `unitId` is included because it's part of the approved schema (a future
 * `units` table), even though the web UI never surfaces a unit picker
 * anywhere — present in the type for schema-readiness, absent from every
 * screen because the web source never shows one to convert.
 */

export type ProductStockStatus = 'in' | 'low' | 'out';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  location: string | null;
  categoryId: string | null;
  unitId: string | null;
  purchasePriceMinor: number;
  sellingPriceMinor: number;
  minimumStock: number;
  currentStock: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What ProductForm collects to create a product — includes opening stock,
 * which only makes sense at creation time (web: "Opening stock" field). */
export interface CreateProductInput {
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  location: string | null;
  categoryId: string | null;
  unitId: string | null;
  purchasePriceMinor: number;
  sellingPriceMinor: number;
  minimumStock: number;
  openingStock: number;
  description: string | null;
}

/** What ProductForm collects to edit a product — no currentStock (web:
 * "use Stock In/Out/Adjust so the movement is recorded", never a direct
 * edit) and no openingStock (creation-only). */
export type UpdateProductInput = Omit<CreateProductInput, 'openingStock'>;

export interface ProductCategoryOption {
  id: string;
  name: string;
}

export type ProductSort = 'name' | 'stock' | 'price' | 'recent';

export interface ProductFilters {
  query: string;
  categoryId: string | 'all';
  brand: string | 'all';
  status: ProductStockStatus | 'all';
  sort: ProductSort;
}
