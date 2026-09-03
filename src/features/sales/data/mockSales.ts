/**
 * Temporary typed data, standing in for the web reference's seed.ts
 * `seedSales`. References this project's canonical MOCK_PRODUCTS and
 * Customers' canonical MOCK_CUSTOMERS ids. `SALE-000142`/`SALE-000140`/
 * `SALE-000139`/`SALE-000131` deliberately reuse the exact receiptNo
 * values Stock's own mockMovements.ts already seeded for its SALE-type
 * movements (same cross-reference technique used for Purchases), so
 * SaleDetailScreen's "Stock impact" has real populated examples.
 * `SALE-000135` similarly matches Stock's `RET-000009` return movement
 * — see mockReturns.ts.
 */
import type { Sale } from '../types';

function daysAgoIso(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_SALES: Sale[] = [
  {
    id: 'sal-1',
    receiptNo: 'SALE-000142',
    createdAt: daysAgoIso(0, 11, 15),
    items: [
      { productId: 'prd-12', productName: 'Mechanical Keyboard', quantity: 2, unitPriceMinor: 459900, discountMinor: 0 },
      { productId: 'prd-1', productName: 'Wireless Mouse', quantity: 1, unitPriceMinor: 99900, discountMinor: 0 },
    ],
    subtotalMinor: 1019700,
    discountMinor: 0,
    taxMinor: 50985,
    totalMinor: 1070685,
    costMinor: 705000,
    customerId: null,
    customerName: 'Walk-in Customer',
    paymentMethod: 'UPI',
    amountReceivedMinor: 1070685,
    status: 'completed',
  },
  {
    id: 'sal-2',
    receiptNo: 'SALE-000143',
    createdAt: daysAgoIso(0, 15, 30),
    items: [
      { productId: 'prd-9', productName: 'Basmati Rice 5kg', quantity: 2, unitPriceMinor: 59900, discountMinor: 0 },
      { productId: 'prd-13', productName: 'Ballpoint Pen (Box of 10)', quantity: 3, unitPriceMinor: 9900, discountMinor: 0 },
    ],
    subtotalMinor: 149500,
    discountMinor: 0,
    taxMinor: 7475,
    totalMinor: 156975,
    costMinor: 102000,
    customerId: null,
    customerName: 'Walk-in Customer',
    paymentMethod: 'Cash',
    amountReceivedMinor: 160000,
    status: 'completed',
  },
  {
    id: 'sal-3',
    receiptNo: 'SALE-000140',
    createdAt: daysAgoIso(2, 16, 45),
    items: [{ productId: 'prd-3', productName: 'Bluetooth Speaker', quantity: 1, unitPriceMinor: 279900, discountMinor: 0 }],
    subtotalMinor: 279900,
    discountMinor: 0,
    taxMinor: 13995,
    totalMinor: 293895,
    costMinor: 180000,
    customerId: 'cus-3',
    customerName: 'Priya Menon',
    paymentMethod: 'Card',
    amountReceivedMinor: 293895,
    status: 'completed',
  },
  {
    id: 'sal-4',
    receiptNo: 'SALE-000139',
    createdAt: daysAgoIso(2, 14, 12),
    items: [{ productId: 'prd-8', productName: 'Instant Coffee 200g', quantity: 6, unitPriceMinor: 42500, discountMinor: 0 }],
    subtotalMinor: 255000,
    discountMinor: 0,
    taxMinor: 12750,
    totalMinor: 267750,
    costMinor: 168000,
    customerId: null,
    customerName: 'Walk-in Customer',
    paymentMethod: 'Cash',
    amountReceivedMinor: 267750,
    status: 'completed',
  },
  {
    id: 'sal-5',
    receiptNo: 'SALE-000135',
    createdAt: daysAgoIso(3, 12, 0),
    items: [{ productId: 'prd-2', productName: 'USB-C Cable 1m', quantity: 5, unitPriceMinor: 29900, discountMinor: 0 }],
    subtotalMinor: 149500,
    discountMinor: 0,
    taxMinor: 7475,
    totalMinor: 156975,
    costMinor: 75000,
    customerId: 'cus-2',
    customerName: 'Rakesh Kumar',
    paymentMethod: 'Cash',
    amountReceivedMinor: 156975,
    // stored as completed; salesProvider derives the real status
    // ('part-returned') from mockReturns.ts's RET-000009 on every read.
    status: 'completed',
  },
  {
    id: 'sal-6',
    receiptNo: 'SALE-000131',
    createdAt: daysAgoIso(6, 13, 0),
    items: [{ productId: 'prd-4', productName: 'Notebook A5 Ruled', quantity: 8, unitPriceMinor: 6900, discountMinor: 0 }],
    subtotalMinor: 55200,
    discountMinor: 0,
    taxMinor: 2760,
    totalMinor: 57960,
    costMinor: 28000,
    customerId: 'cus-1',
    customerName: 'Anita Rao',
    paymentMethod: 'UPI',
    amountReceivedMinor: 57960,
    status: 'completed',
  },
];
