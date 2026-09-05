/**
 * Reports' read-only aggregate boundary: reads canonical Product/Stock/
 * Purchase/Sales providers, aggregates, returns report view models.
 * Never owns transaction data, never mutates anything downstream — a
 * one-directional dependency (Reports -> everything else), so nothing
 * else in the app depends on Reports.
 *
 * Every "get everything" call below (rangeDays:'all'/paymentStatus:'all'
 * etc.) intentionally requests the full, unfiltered set from that
 * feature's own provider — including session-created Sales/Purchases,
 * since those providers already fold session records into every read —
 * then this file applies the report's own range/category filtering on
 * top. That's why report ranges (e.g. 90 days) aren't limited to
 * whatever Sales/Purchases' own filter contracts support natively.
 */
import { getCustomers } from '@/features/customers/data/customersProvider';
import { getProducts } from '@/features/products/data/productsProvider';
import { getStockStatus } from '@/features/products/utils/stockStatus';
import { getPurchases } from '@/features/purchases/data/purchasesProvider';
import { getSales } from '@/features/sales/data/salesProvider';
import { getMovements } from '@/features/stock/data/stockProvider';
import { STOCK_VALUATION } from '@/features/stock/constants';
import { lowStock, outOfStock, stockValueMinor, withinDays } from '@/features/stock/utils/metrics';
import { getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import { dailySeries, groupPurchasesBySupplier, topProducts } from '../utils/aggregate';
import type {
  InventoryReportFilters,
  InventoryReportMode,
  InventoryReportView,
  ProfitReportView,
  PurchaseReportFilters,
  PurchaseReportView,
  ReportRangeDays,
  ReportsHomeSummary,
  SalesReportFilters,
  SalesReportView,
} from '../types';

const QUERY_DELAY_MS = 60;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// web: sum(s.total - s.tax - s.cost) — reused wherever "estimated profit"
// on a set of sales is needed (ReportsHome, SalesReport, ProfitReport).
function estimatedProfitMinor(sales: { totalMinor: number; taxMinor: number; costMinor: number }[]): number {
  return sales.reduce((sum, s) => sum + (s.totalMinor - s.taxMinor - s.costMinor), 0);
}

export async function getSalesReport(filters: SalesReportFilters): Promise<SalesReportView> {
  const [allSales, products] = await Promise.all([
    getSales({ query: '', rangeDays: 'all', paymentMethod: 'all', customerId: 'all' }),
    getProducts(),
  ]);
  const filtered = allSales.filter((s) => {
    if (!withinDays(s.createdAt, filters.rangeDays)) return false;
    if (filters.customerId !== 'all' && s.customerId !== filters.customerId) return false;
    if (filters.paymentMethod !== 'all' && s.paymentMethod !== filters.paymentMethod) return false;
    if (filters.categoryId !== 'all') {
      const match = s.items.some((it) => products.find((p) => p.id === it.productId)?.categoryId === filters.categoryId);
      if (!match) return false;
    }
    return true;
  });
  // web: series always caps at 14 days even when the KPI range is wider
  // (e.g. 90 days) — a deliberate "chart stays readable" choice, not a bug.
  const seriesDays = filters.rangeDays === 1 ? 1 : Math.min(filters.rangeDays, 14);
  const netSalesMinor = filtered.reduce((sum, s) => sum + s.totalMinor, 0);
  const view: SalesReportView = {
    transactionCount: filtered.length,
    netSalesMinor,
    grossSalesMinor: filtered.reduce((sum, s) => sum + s.subtotalMinor, 0),
    discountsMinor: filtered.reduce((sum, s) => sum + s.discountMinor, 0),
    taxMinor: filtered.reduce((sum, s) => sum + s.taxMinor, 0),
    estimatedProfitMinor: estimatedProfitMinor(filtered),
    averageSaleMinor: filtered.length ? Math.round(netSalesMinor / filtered.length) : 0,
    series: dailySeries(filtered, seriesDays),
    topProducts: topProducts(filtered, 5),
  };
  return delay(view, QUERY_DELAY_MS);
}

export async function getProfitReport(rangeDays: ReportRangeDays): Promise<ProfitReportView> {
  const [allSales, allPurchases] = await Promise.all([
    getSales({ query: '', rangeDays: 'all', paymentMethod: 'all', customerId: 'all' }),
    getPurchases({ query: '', rangeDays: 'all', supplierId: 'all', paymentStatus: 'all' }),
  ]);
  const filtered = allSales.filter((s) => withinDays(s.createdAt, rangeDays));
  const purchasesInRange = allPurchases.filter((p) => withinDays(p.createdAt, rangeDays));
  // web: revenue excludes tax; gross profit = revenue - cost of goods
  // sold. Deliberately NOT sales-minus-purchases — purchaseSpendMinor
  // below is shown only as a separate reference figure, same as the web.
  const revenueMinor = filtered.reduce((sum, s) => sum + (s.totalMinor - s.taxMinor), 0);
  const cogsMinor = filtered.reduce((sum, s) => sum + s.costMinor, 0);
  const grossProfitMinor = revenueMinor - cogsMinor;
  const view: ProfitReportView = {
    revenueMinor,
    cogsMinor,
    discountsMinor: filtered.reduce((sum, s) => sum + s.discountMinor, 0),
    grossProfitMinor,
    purchaseSpendMinor: purchasesInRange.reduce((sum, p) => sum + p.totalMinor, 0),
    transactionCount: filtered.length,
    marginPercent: revenueMinor > 0 ? Math.round((grossProfitMinor / revenueMinor) * 100) : 0,
  };
  return delay(view, QUERY_DELAY_MS);
}

export async function getPurchaseReport(filters: PurchaseReportFilters): Promise<PurchaseReportView> {
  const allPurchases = await getPurchases({ query: '', rangeDays: 'all', supplierId: 'all', paymentStatus: 'all' });
  const filtered = allPurchases
    .filter((p) => {
      if (filters.rangeDays !== 'all' && !withinDays(p.createdAt, filters.rangeDays)) return false;
      if (filters.supplierId !== 'all' && p.supplierId !== filters.supplierId) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bySupplier = groupPurchasesBySupplier(filtered);
  const view: PurchaseReportView = {
    purchases: filtered,
    bySupplier,
    totalMinor: filtered.reduce((sum, p) => sum + p.totalMinor, 0),
    unpaidMinor: filtered.filter((p) => p.paymentStatus !== 'Paid').reduce((sum, p) => sum + p.totalMinor, 0),
    supplierCount: bySupplier.length,
    unitsReceived: filtered.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0), 0),
  };
  return delay(view, QUERY_DELAY_MS);
}

export async function getInventoryReport(mode: InventoryReportMode, filters: InventoryReportFilters): Promise<InventoryReportView> {
  const [products, sales] = await Promise.all([
    getProducts(),
    mode === 'out' ? getSales({ query: '', rangeDays: 'all', paymentMethod: 'all', customerId: 'all' }) : Promise.resolve([]),
  ]);
  const base = mode === 'low' ? lowStock(products) : mode === 'out' ? outOfStock(products) : products;
  const q = filters.query.trim().toLowerCase();
  const rows = base
    .filter((p) => (q ? `${p.name} ${p.sku}`.toLowerCase().includes(q) : true))
    .filter((p) => (filters.categoryId === 'all' ? true : p.categoryId === filters.categoryId))
    .sort((a, b) => a.currentStock - b.currentStock)
    .map((p) => ({
      product: p,
      status: getStockStatus(p),
      lastSaleReceiptNo: mode === 'out' ? sales.find((s) => s.items.some((it) => it.productId === p.id))?.receiptNo : undefined,
      suggestedQuantity: mode === 'low' ? Math.max(p.minimumStock * 2 - p.currentStock, p.minimumStock) : undefined,
    }));
  const view: InventoryReportView = {
    rows,
    totalBase: base.length,
    stockValueCostMinor: mode === 'all' ? stockValueMinor(products, 'cost') : undefined,
    stockValueSellingMinor: mode === 'all' ? stockValueMinor(products, 'selling') : undefined,
  };
  return delay(view, QUERY_DELAY_MS);
}

export async function getReportsHomeSummary(): Promise<ReportsHomeSummary> {
  const [products, sales, purchases, customers, suppliers, movements] = await Promise.all([
    getProducts(),
    getSales({ query: '', rangeDays: 'all', paymentMethod: 'all', customerId: 'all' }),
    getPurchases({ query: '', rangeDays: 'all', supplierId: 'all', paymentStatus: 'all' }),
    getCustomers(),
    getSuppliers(),
    getMovements({ query: '', type: 'all', productId: 'all', rangeDays: 'all' }),
  ]);
  const salesToday = sales.filter((s) => withinDays(s.createdAt, 1));
  const salesMonth = sales.filter((s) => withinDays(s.createdAt, 30));
  const summary: ReportsHomeSummary = {
    todaySalesMinor: salesToday.reduce((sum, s) => sum + s.totalMinor, 0),
    todayProfitMinor: estimatedProfitMinor(salesToday),
    stockValueMinor: stockValueMinor(products, STOCK_VALUATION),
    monthSalesCount: salesMonth.length,
    monthSalesTotalMinor: salesMonth.reduce((sum, s) => sum + s.totalMinor, 0),
    monthProfitMinor: estimatedProfitMinor(salesMonth),
    productCount: products.length,
    purchaseCount: purchases.length,
    supplierCount: suppliers.length,
    lowStockCount: lowStock(products).length,
    outOfStockCount: outOfStock(products).length,
    movementCount: movements.length,
    customerCount: customers.length,
  };
  return delay(summary, QUERY_DELAY_MS);
}
