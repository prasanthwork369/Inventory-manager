/**
 * Temporary typed data source, standing in for the web reference's
 * `useStore()` (StoreContext + seed.ts). Kept out of presentation JSX per
 * instruction — only src/features/dashboard/hooks/useDashboard.ts reads
 * this. Returns a fully-formed DashboardSummary so the "ready" state has
 * something realistic to render; loading/error/empty are exercised by the
 * hook's own state machine, not by this data.
 *
 * Future SQLite replacement path: this function's signature/return type
 * (DashboardSummary) is exactly what a DashboardRepository.getSummary()
 * built on aggregate SQL queries would return — swapping this file for
 * that repository call is the only change useDashboard needs.
 */
import type { DashboardActivityItem, DashboardSparklinePoint, DashboardSummary } from '../types';

// web: dailySeries() labels each of the last N days with its real
// weekday-short name. Values are mocked here (no real sales data exists
// yet) but the labels use real dates so "today" is always correct.
function last7DaySparkline(values: number[]): DashboardSparklinePoint[] {
  const points: DashboardSparklinePoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: values[6 - i] ?? 0 });
  }
  return points;
}

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString();
}

const MOCK_ACTIVITY: DashboardActivityItem[] = [
  { id: 'mv-1', productId: 'p-1', productName: 'Wireless Mouse', type: 'sale', quantity: -2, reference: 'INV-1042', occurredAt: minutesAgo(12) },
  { id: 'mv-2', productId: 'p-2', productName: 'USB-C Cable 1m', type: 'purchase', quantity: 50, reference: 'PO-0231', occurredAt: minutesAgo(48) },
  { id: 'mv-3', productId: 'p-3', productName: 'Notebook A5', type: 'in', quantity: 20, reference: 'IN-8841', occurredAt: minutesAgo(95) },
  { id: 'mv-4', productId: 'p-4', productName: 'Bluetooth Speaker', type: 'out', quantity: -3, reference: 'OUT-2210', occurredAt: minutesAgo(190) },
  { id: 'mv-5', productId: 'p-5', productName: 'Steel Water Bottle', type: 'adjust', quantity: -1, reference: 'ADJ-0099', occurredAt: minutesAgo(340) },
  { id: 'mv-6', productId: 'p-6', productName: 'Desk Lamp', type: 'return', quantity: 1, reference: 'RET-0041', occurredAt: minutesAgo(610) },
];

export function getMockDashboardSummary(): DashboardSummary {
  return {
    businessName: 'Neptune General Store',
    currencySymbol: '₹',
    today: {
      salesTotal: 18450,
      salesCount: 7,
      purchasesTotal: 12800,
      purchasesCount: 2,
      estimatedProfit: 4230,
    },
    sparkline: last7DaySparkline([3200, 5400, 2100, 8900, 6200, 4100, 18450]),
    stockValue: 284500,
    productCount: 128,
    lowStock: { count: 4, names: ['Wireless Mouse', 'USB-C Cable 1m', 'Notebook A5', 'Steel Water Bottle'] },
    outOfStock: { count: 2, names: ['Bluetooth Speaker', 'Desk Lamp'] },
    recentActivity: MOCK_ACTIVITY,
  };
}
