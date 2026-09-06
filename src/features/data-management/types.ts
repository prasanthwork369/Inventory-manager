/**
 * Backup/Import/Export domain types, adapted from the web reference's
 * src/pages/data/{BackupRestore,ImportProducts,ExportData}.tsx and the
 * `BackupRecord` type in src/types/index.ts.
 *
 * DeviceDataCounts is this feature's own read-only aggregate (record
 * counts across every other feature) — same one-directional-dependency
 * shape as Reports' ReportsHomeSummary, not a duplicate domain model.
 */

export interface DeviceDataCounts {
  products: number;
  sales: number;
  purchases: number;
  movements: number;
  customers: number;
  suppliers: number;
}

/** web: BackupRecord { id, date, size, entries }. Renamed `date`/`size` to
 * `createdAt`/`sizeLabel` to match this project's naming convention
 * elsewhere (every other feature's timestamp field is `createdAt`); same
 * shape and meaning otherwise. */
export interface BackupRecord {
  id: string;
  createdAt: string;
  sizeLabel: string;
  entries: number;
}

export type BackupPhase = 'idle' | 'working' | 'done';

export type RestoreStep = 'select' | 'preview' | 'working' | 'done';

/** web: ImportProducts.tsx's local `Row` interface — `cost`/`price` become
 * minor units here (this project's money rule), everything else unchanged. */
export interface ImportRow {
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  costMinor: number;
  sellingMinor: number;
  openingStock: number;
  minimumStock: number;
  error?: string;
}

export type ImportStep = 'upload' | 'validating' | 'preview' | 'importing' | 'done';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportDataset {
  key: string;
  label: string;
  count: number;
}

export type ExportPhase = 'idle' | 'working' | 'done';
