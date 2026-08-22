/**
 * Ported from the web reference's src/utils/metrics.ts — only the
 * functions Stock's screens actually call. Operates on minor-unit money
 * (purchasePriceMinor/sellingPriceMinor) since that's this project's
 * Product shape, unlike the web's plain-number costPrice/price.
 */
import type { Product } from '@/features/products/types';

export function stockValueMinor(products: Product[], valuation: 'cost' | 'selling'): number {
  return products.reduce((sum, p) => sum + p.currentStock * (valuation === 'cost' ? p.purchasePriceMinor : p.sellingPriceMinor), 0);
}

export function totalUnits(products: Product[]): number {
  return products.reduce((sum, p) => sum + Math.max(p.currentStock, 0), 0);
}

export function lowStock(products: Product[]): Product[] {
  return products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minimumStock);
}

export function outOfStock(products: Product[]): Product[] {
  return products.filter((p) => p.currentStock <= 0);
}

export function withinDays(iso: string, days: number): boolean {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return new Date(iso).getTime() >= start.getTime();
}
