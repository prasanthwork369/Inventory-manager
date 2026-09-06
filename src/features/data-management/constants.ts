import type { ExportFormat, ImportRow } from './types';

export const CURRENCY_SYMBOL = '₹';

/**
 * web: ImportProducts.tsx's hardcoded `sampleRows`. The web screen never
 * parses a real file — there is no `<input type="file">` anywhere in that
 * component, "Choose a CSV file" just calls `startValidation()` directly
 * and validates this fixed array regardless of what the user "picked".
 * Reproduced verbatim (same rows, same order, same error strings), with
 * cost/price converted to minor units per this project's money rule.
 */
export const SAMPLE_IMPORT_ROWS: ImportRow[] = [
  { name: 'Ceramic Mug 350ml', sku: 'CM-350', barcode: '8901234500233', brand: 'HomeCraft', costMinor: 8500, sellingMinor: 14900, openingStock: 40, minimumStock: 10 },
  { name: 'Steel Water Bottle 1L', sku: 'SB-100', barcode: '8901234500240', brand: 'HydroPro', costMinor: 21000, sellingMinor: 34900, openingStock: 25, minimumStock: 6 },
  { name: 'Notebook A5 Ruled', sku: 'NB-A5', barcode: '8901234500257', brand: 'PaperMate', costMinor: 3200, sellingMinor: 6000, openingStock: 120, minimumStock: 24 },
  { name: 'Wireless Mouse', sku: 'WM-104', barcode: '8901234500011', brand: 'Logiteck', costMinor: 52000, sellingMinor: 79900, openingStock: 10, minimumStock: 6, error: 'Duplicate SKU — a product with WM-104 already exists' },
  { name: '', sku: 'XX-001', barcode: '', brand: 'Unknown', costMinor: 0, sellingMinor: 0, openingStock: 5, minimumStock: 2, error: 'Missing product name and selling price' },
  { name: 'Desk Lamp LED', sku: 'DL-011', barcode: '8901234500264', brand: 'Brightly', costMinor: 34000, sellingMinor: -42000, openingStock: 8, minimumStock: 3, error: 'Selling price cannot be negative' },
];

export const IMPORT_REQUIRED_COLUMNS = 'name, sku, barcode, brand, cost_price, selling_price, opening_stock, minimum_stock';

export const EXPORT_FORMAT_OPTIONS: { key: ExportFormat; title: string; caption: string }[] = [
  { key: 'csv', title: 'CSV', caption: 'Open in Excel or Sheets' },
  { key: 'pdf', title: 'PDF', caption: 'Printable formatted report' },
];

/** web: ExportData.tsx's `datasets` array hardcodes `{ key: 'reports',
 * label: 'Summary reports', count: 5 }` — an illustrative row count for a
 * conceptual dataset (report screens), not a real countable entity, so it
 * isn't sourced from a canonical provider like the others. Reused as-is. */
export const REPORTS_DATASET_COUNT = 5;
