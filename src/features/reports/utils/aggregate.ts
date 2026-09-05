/**
 * Ported from the web reference's src/utils/metrics.ts `dailySeries()`/
 * `topProducts()` — the one shared place these aggregations happen, used
 * by both reportsProvider.ts and (indirectly) every screen that needs
 * them, so the math can't drift between call sites.
 */
import type { Sale } from '@/features/sales/types';
import type { Purchase } from '@/features/purchases/types';
import type { DailySeriesPoint, PurchaseSupplierBreakdownRow, TopProductRow } from '../types';

export function dailySeries(sales: Sale[], days: number): DailySeriesPoint[] {
  const out: DailySeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const valueMinor = sales
      .filter((s) => new Date(s.createdAt).toDateString() === d.toDateString())
      .reduce((sum, s) => sum + s.totalMinor, 0);
    out.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), valueMinor });
  }
  return out;
}

export function topProducts(sales: Sale[], limit = 5): TopProductRow[] {
  const map = new Map<string, TopProductRow>();
  sales.forEach((s) =>
    s.items.forEach((it) => {
      const entry = map.get(it.productId) ?? { productId: it.productId, productName: it.productName, quantitySold: 0, valueMinor: 0 };
      entry.quantitySold += it.quantity;
      entry.valueMinor += it.quantity * it.unitPriceMinor - it.discountMinor;
      map.set(it.productId, entry);
    })
  );
  return [...map.values()].sort((a, b) => b.valueMinor - a.valueMinor).slice(0, limit);
}

export function groupPurchasesBySupplier(purchases: Purchase[]): PurchaseSupplierBreakdownRow[] {
  const map = new Map<string, PurchaseSupplierBreakdownRow>();
  purchases.forEach((p) => {
    const entry = map.get(p.supplierId) ?? { supplierId: p.supplierId, supplierName: p.supplierName, totalMinor: 0, purchaseCount: 0, unitsReceived: 0 };
    entry.totalMinor += p.totalMinor;
    entry.purchaseCount += 1;
    entry.unitsReceived += p.items.reduce((s, i) => s + i.quantity, 0);
    map.set(p.supplierId, entry);
  });
  return [...map.values()].sort((a, b) => b.totalMinor - a.totalMinor);
}
