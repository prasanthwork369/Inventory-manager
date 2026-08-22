/**
 * Minimal read-only supplier list scoped to Stock In's supplier picker
 * only — NOT a Suppliers feature (no CRUD, no supplier list/detail
 * screens). Suppliers is explicitly out of scope for this phase; this
 * exists only because the web's Stock In screen requires *a* supplier to
 * attribute the receipt to. Names match the web reference's seed.ts
 * suppliers so a future real Suppliers feature can reuse the same
 * identities.
 */
import type { StockSupplierOption } from '../types';

export const MOCK_STOCK_SUPPLIERS: StockSupplierOption[] = [
  { id: 'sup-1', name: 'Sharma Distributors' },
  { id: 'sup-2', name: 'Metro Electronics Supply' },
  { id: 'sup-3', name: 'Fresh Foods Wholesale' },
  { id: 'sup-4', name: 'Urban Threads Pvt Ltd' },
  { id: 'sup-5', name: 'GlowKart Cosmetics' },
];
