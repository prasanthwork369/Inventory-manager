/**
 * The single swappable boundary for Backup/Import/Export. Reuses every
 * canonical feature provider for record counts (Products/Sales/Purchases/
 * Stock/Suppliers/Customers) rather than a second data model — this
 * feature never owns transaction data, matching Reports' provider shape
 * (one-directional: data-management -> everything else).
 *
 * Backup/import/export are session-simulated, mirroring the web reference
 * exactly: neither BackupRestore.tsx, ImportProducts.tsx nor
 * ExportData.tsx does real file I/O in the web source either — there is
 * no `<input type="file">`, no Blob/download link and no
 * `navigator.share()` call anywhere in those three screens, only a
 * `window.setTimeout` before a canned success state. This provider
 * reproduces that same honest simulation rather than inventing real
 * device file access the source itself never had. It also matches this
 * phase's brief: the app has no real persistence yet for any feature
 * (Products/Sales/Purchases/etc. are all mock + session-only data), so a
 * "real" backup file would package data that was never actually durable
 * in the first place — keeping this simulated is the honest choice, not
 * a shortcut.
 *
 * createBackup appends to SESSION_BACKUPS (a small in-memory array, not a
 * general mutable store) so "Backup history"/"Last backup" behave
 * correctly across repeated backups within a session — the same narrow,
 * documented exception already used by Purchases'/Sales' SESSION_*
 * arrays (see purchasesProvider.ts's file header). SESSION_BACKUPS resets
 * on app reload; it is not persistence.
 *
 * restoreBackup / resetDemoData are genuine no-ops beyond their delay:
 * actually restoring would require a "replace everything" write across 7+
 * independent feature providers, none of which expose one (and shouldn't
 * grow just for this) — documented in the phase report's limitation
 * section. importProducts DOES route each valid row through Products'
 * real createProduct() (reusing that canonical provider rather than
 * duplicating product-creation logic), but since createProduct() is
 * itself a documented non-mutating simulation (see productsProvider.ts's
 * file header), imported products won't appear in the Products list
 * afterward — an already-existing, already-accepted gap from the
 * Products phase, not a new one introduced here.
 */
import { getCategories } from '@/features/categories/data/categoriesProvider';
import { createProduct, getProducts } from '@/features/products/data/productsProvider';
import type { CreateProductInput } from '@/features/products/types';
import { getPurchases } from '@/features/purchases/data/purchasesProvider';
import { getSales } from '@/features/sales/data/salesProvider';
import { getMovements } from '@/features/stock/data/stockProvider';
import { getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import { getCustomers } from '@/features/customers/data/customersProvider';
import { REPORTS_DATASET_COUNT, SAMPLE_IMPORT_ROWS } from '../constants';
import type { BackupRecord, DeviceDataCounts, ExportDataset, ExportFormat, ImportRow } from '../types';

const QUERY_DELAY_MS = 60;
const BACKUP_WORKING_DELAY_MS = 900;
const RESTORE_WORKING_DELAY_MS = 1100;
const VALIDATE_DELAY_MS = 1100;
const IMPORT_DELAY_MS = 1200;
const EXPORT_DELAY_MS = 1000;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Backups created this session — see the file header for why this is the
// same narrow exception already used by Purchases'/Sales' SESSION_* arrays.
const SESSION_BACKUPS: BackupRecord[] = [];

async function allCounts(): Promise<DeviceDataCounts> {
  const [products, sales, purchases, movements, customers, suppliers] = await Promise.all([
    getProducts(),
    getSales({ query: '', rangeDays: 'all', paymentMethod: 'all', customerId: 'all' }),
    getPurchases({ query: '', rangeDays: 'all', supplierId: 'all', paymentStatus: 'all' }),
    getMovements({ query: '', type: 'all', productId: 'all', rangeDays: 'all' }),
    getCustomers(),
    getSuppliers(),
  ]);
  return {
    products: products.length,
    sales: sales.length,
    purchases: purchases.length,
    movements: movements.length,
    customers: customers.length,
    suppliers: suppliers.length,
  };
}

export async function getDeviceDataCounts(): Promise<DeviceDataCounts> {
  const counts = await allCounts();
  return delay(counts, QUERY_DELAY_MS);
}

export function getBackups(): Promise<BackupRecord[]> {
  return delay([...SESSION_BACKUPS], QUERY_DELAY_MS);
}

// web: `${(entries * 0.32 + 180).toFixed(0)} KB` — an illustrative size
// estimate, not a real file size (the web never writes a real file
// either). Reproduced verbatim.
function estimateSizeLabel(entries: number): string {
  return `${Math.round(entries * 0.32 + 180)} KB`;
}

export async function createBackup(): Promise<BackupRecord> {
  await delay(undefined, BACKUP_WORKING_DELAY_MS);
  const counts = await allCounts();
  const entries = counts.products + counts.sales + counts.purchases + counts.movements + counts.customers + counts.suppliers;
  const record: BackupRecord = {
    id: `bkp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sizeLabel: estimateSizeLabel(entries),
    entries,
  };
  SESSION_BACKUPS.unshift(record);
  return record;
}

/** Simulated restore — see the file header for why this can't genuinely
 * replace data across 7+ independent feature providers. `_id` is unused
 * for the same reason productsProvider.ts's archiveProduct(_id) is: a
 * future BackupRepository would use it to select the real snapshot. */
export async function restoreBackup(_id: string): Promise<void> {
  await delay(undefined, RESTORE_WORKING_DELAY_MS);
}

/** Simulated demo-data reset — same limitation as restoreBackup: resetting
 * for real would mean clearing session state across every feature's own
 * provider, which none of them expose a hook for. */
export async function resetDemoData(): Promise<void> {
  await delay(undefined, QUERY_DELAY_MS);
}

export function getSampleImportRows(): Promise<ImportRow[]> {
  return delay(SAMPLE_IMPORT_ROWS, VALIDATE_DELAY_MS);
}

export async function importProducts(rows: ImportRow[]): Promise<number> {
  const categories = await getCategories();
  const firstCategoryId = categories[0]?.id ?? null;
  const inputs: CreateProductInput[] = rows.map((r) => ({
    name: r.name,
    sku: r.sku,
    barcode: r.barcode || null,
    brand: r.brand || null,
    location: null,
    categoryId: firstCategoryId,
    unitId: null,
    purchasePriceMinor: r.costMinor,
    sellingPriceMinor: r.sellingMinor,
    minimumStock: r.minimumStock,
    openingStock: r.openingStock,
    description: 'Imported from CSV',
  }));
  await Promise.all(inputs.map((input) => createProduct(input)));
  await delay(undefined, IMPORT_DELAY_MS);
  return rows.length;
}

export async function getExportDatasets(): Promise<ExportDataset[]> {
  const counts = await allCounts();
  const datasets: ExportDataset[] = [
    { key: 'products', label: 'Products', count: counts.products },
    { key: 'sales', label: 'Sales', count: counts.sales },
    { key: 'purchases', label: 'Purchases', count: counts.purchases },
    { key: 'customers', label: 'Customers', count: counts.customers },
    { key: 'suppliers', label: 'Suppliers', count: counts.suppliers },
    { key: 'movements', label: 'Stock movements', count: counts.movements },
    { key: 'reports', label: 'Summary reports', count: REPORTS_DATASET_COUNT },
  ];
  return delay(datasets, QUERY_DELAY_MS);
}

export async function generateExport(_format: ExportFormat): Promise<void> {
  await delay(undefined, EXPORT_DELAY_MS);
}
