/**
 * The single swappable boundary between Dashboard's hook and its data
 * source — replaces the old mockDashboardSummary.ts (deleted) now that
 * Products/Sales/Purchases/Stock/Settings are all DB-backed. Composes
 * their existing canonical providers rather than duplicating SQL/
 * aggregation Reports already has its own version of — Dashboard needs a
 * slightly different shape (today's purchases, low/out-of-stock NAMES,
 * a 7-day sparkline) that reportsProvider's own summary doesn't expose,
 * so this aggregates in JS over the same already-fetched lists, same
 * spirit as reportsProvider.ts's own approach.
 */
import { getProducts } from '@/features/products/data/productsProvider';
import { getPurchases } from '@/features/purchases/data/purchasesProvider';
import { getSales } from '@/features/sales/data/salesProvider';
import { getRecentMovements } from '@/features/stock/data/stockProvider';
import { getSettings } from '@/features/settings/data/settingsProvider';
import { lowStock, outOfStock, stockValueMinor, withinDays } from '@/features/stock/utils/metrics';
import type { StockMovement } from '@/features/stock/types';
import type { DashboardActivityItem, DashboardMovementType, DashboardSparklinePoint, DashboardSummary } from '../types';

const MOVEMENT_TYPE_TO_DASHBOARD_TYPE: Record<StockMovement['type'], DashboardMovementType> = {
  OPENING_STOCK: 'in',
  MANUAL_IN: 'in',
  MANUAL_OUT: 'out',
  DAMAGE: 'out',
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjust',
  REVERSAL: 'adjust',
  SALE_RETURN: 'return',
  PURCHASE_RETURN: 'return',
};

function toActivityItem(m: StockMovement): DashboardActivityItem {
  return {
    id: m.id,
    productId: m.productId,
    productName: m.productName,
    type: MOVEMENT_TYPE_TO_DASHBOARD_TYPE[m.type],
    quantity: m.quantityDelta,
    reference: m.reference,
    occurredAt: m.createdAt,
  };
}

function sevenDaySparkline(sales: { createdAt: string; totalMinor: number }[]): DashboardSparklinePoint[] {
  const points: DashboardSparklinePoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayTotal = sales.filter((s) => withinDays(s.createdAt, i + 1) && !withinDays(s.createdAt, i)).reduce((sum, s) => sum + s.totalMinor, 0);
    points.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: dayTotal });
  }
  return points;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [settings, products, sales, purchases, recentMovements] = await Promise.all([
    getSettings(),
    getProducts(),
    getSales({ query: '', rangeDays: 'all', paymentMethod: 'all', customerId: 'all' }),
    getPurchases({ query: '', rangeDays: 'all', supplierId: 'all', paymentStatus: 'all' }),
    getRecentMovements(6),
  ]);

  const todaySales = sales.filter((s) => withinDays(s.createdAt, 1));
  const todayPurchases = purchases.filter((p) => withinDays(p.createdAt, 1));
  const todayEstimatedProfit = todaySales.reduce((sum, s) => sum + (s.totalMinor - s.taxMinor - s.costMinor), 0);

  const low = lowStock(products);
  const out = outOfStock(products);

  return {
    businessName: settings.business.name,
    currencySymbol: settings.business.currencySymbol,
    today: {
      salesTotal: todaySales.reduce((sum, s) => sum + s.totalMinor, 0),
      salesCount: todaySales.length,
      purchasesTotal: todayPurchases.reduce((sum, p) => sum + p.totalMinor, 0),
      purchasesCount: todayPurchases.length,
      estimatedProfit: todayEstimatedProfit,
    },
    sparkline: sevenDaySparkline(sales),
    stockValue: stockValueMinor(products, settings.inventory.valuation),
    productCount: products.length,
    lowStock: { count: low.length, names: low.map((p) => p.name) },
    outOfStock: { count: out.length, names: out.map((p) => p.name) },
    recentActivity: recentMovements.map(toActivityItem),
  };
}
