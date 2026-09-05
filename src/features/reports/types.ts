/**
 * Report-specific view/query types only — Product, Sale, Purchase,
 * StockMovement etc. are read from their own canonical providers and
 * reused directly, never redefined here (see data/reportsProvider.ts).
 */
import type { PaymentMethod } from '@/features/sales/types';
import type { Product, ProductStockStatus } from '@/features/products/types';
import type { Purchase } from '@/features/purchases/types';

export type ReportRangeDays = 1 | 7 | 30 | 90;

export interface DailySeriesPoint {
  label: string;
  valueMinor: number;
}

export interface TopProductRow {
  productId: string;
  productName: string;
  quantitySold: number;
  valueMinor: number;
}

export interface SalesReportFilters {
  rangeDays: ReportRangeDays;
  categoryId: string | 'all';
  customerId: string | 'all';
  paymentMethod: PaymentMethod | 'all';
}

export interface SalesReportView {
  transactionCount: number;
  netSalesMinor: number;
  grossSalesMinor: number;
  discountsMinor: number;
  taxMinor: number;
  estimatedProfitMinor: number;
  averageSaleMinor: number;
  series: DailySeriesPoint[];
  topProducts: TopProductRow[];
}

export interface ProfitReportView {
  revenueMinor: number;
  cogsMinor: number;
  discountsMinor: number;
  grossProfitMinor: number;
  purchaseSpendMinor: number;
  transactionCount: number;
  marginPercent: number;
}

export interface PurchaseReportFilters {
  rangeDays: 7 | 30 | 90 | 'all';
  supplierId: string | 'all';
}

export interface PurchaseSupplierBreakdownRow {
  supplierId: string;
  supplierName: string;
  totalMinor: number;
  purchaseCount: number;
  unitsReceived: number;
}

export interface PurchaseReportView {
  purchases: Purchase[];
  bySupplier: PurchaseSupplierBreakdownRow[];
  totalMinor: number;
  unpaidMinor: number;
  supplierCount: number;
  unitsReceived: number;
}

export type InventoryReportMode = 'all' | 'low' | 'out';

export interface InventoryReportFilters {
  query: string;
  categoryId: string | 'all';
}

/** No supplier field: Product has no supplierId in this project's schema
 * (a deliberate decision from the Products phase — suppliers link
 * through Purchases, not a direct product FK) — same omission already
 * made in Suppliers' detail screen and Purchases' item rows. */
export interface InventoryReportRow {
  product: Product;
  status: ProductStockStatus;
  lastSaleReceiptNo?: string;
  suggestedQuantity?: number;
}

export interface InventoryReportView {
  rows: InventoryReportRow[];
  totalBase: number;
  stockValueCostMinor?: number;
  stockValueSellingMinor?: number;
}

export interface ReportsHomeSummary {
  todaySalesMinor: number;
  todayProfitMinor: number;
  stockValueMinor: number;
  monthSalesCount: number;
  monthSalesTotalMinor: number;
  monthProfitMinor: number;
  productCount: number;
  purchaseCount: number;
  supplierCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  movementCount: number;
  customerCount: number;
}
