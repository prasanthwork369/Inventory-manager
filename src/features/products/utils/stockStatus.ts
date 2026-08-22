/**
 * Ported from the web reference's src/utils/format.ts `stockStatus()` and
 * `statusLabel`.
 */
import type { Product, ProductStockStatus } from '../types';

export function getStockStatus(product: Pick<Product, 'currentStock' | 'minimumStock'>): ProductStockStatus {
  if (product.currentStock <= 0) return 'out';
  if (product.currentStock <= product.minimumStock) return 'low';
  return 'in';
}

export const stockStatusLabel: Record<ProductStockStatus, string> = {
  in: 'In Stock',
  low: 'Low Stock',
  out: 'Out of Stock',
};
