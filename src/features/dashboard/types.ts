/**
 * Dashboard-only view-model types, derived from what the web reference's
 * Dashboard.tsx actually reads off `useStore()` and `utils/metrics.ts`.
 *
 * Deliberately NOT modeled as Product/Sale/Purchase/Movement rows — every
 * field here is an already-aggregated value (a total, a count, a name
 * list capped at what the UI shows), matching how a future SQLite
 * aggregate query (SUM/COUNT/GROUP BY) would actually return data. No
 * formatted strings and no navigation targets live here — those are
 * presentation concerns composed in the screen/components, not domain
 * data, so this type stays exactly what a future
 * DashboardRepository.getSummary() could return unchanged.
 */

export type DashboardMovementType = 'in' | 'out' | 'sale' | 'purchase' | 'adjust' | 'return';

export interface DashboardSparklinePoint {
  label: string;
  value: number;
}

export interface DashboardActivityItem {
  id: string;
  productId: string;
  productName: string;
  type: DashboardMovementType;
  quantity: number;
  reference: string;
  occurredAt: string;
}

export interface DashboardSummary {
  businessName: string;
  currencySymbol: string;
  today: {
    salesTotal: number;
    salesCount: number;
    purchasesTotal: number;
    purchasesCount: number;
    estimatedProfit: number;
  };
  sparkline: DashboardSparklinePoint[];
  stockValue: number;
  productCount: number;
  lowStock: { count: number; names: string[] };
  outOfStock: { count: number; names: string[] };
  recentActivity: DashboardActivityItem[];
}

export type DashboardStatus = 'loading' | 'error' | 'empty' | 'ready';
