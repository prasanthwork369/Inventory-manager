/**
 * Temporary typed data for SaleReturn. `RET-000009` matches Stock's own
 * mockMovements.ts SALE_RETURN entry (same reference), against sal-5
 * (SALE-000135) — see mockSales.ts.
 */
import type { SaleReturn } from '../types';

function daysAgoIso(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_RETURNS: SaleReturn[] = [
  {
    id: 'ret-1',
    reference: 'RET-000009',
    saleId: 'sal-5',
    receiptNo: 'SALE-000135',
    createdAt: daysAgoIso(3, 12, 0),
    items: [{ productId: 'prd-2', productName: 'USB-C Cable 1m', quantity: 2, amountMinor: 59800 }],
    refundMinor: 59800,
    reason: 'Customer return',
    restock: true,
  },
];
