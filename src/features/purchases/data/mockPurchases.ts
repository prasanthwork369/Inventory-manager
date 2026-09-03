/**
 * Temporary typed data, standing in for the web reference's seed.ts
 * `seedPurchases`. References this project's canonical MOCK_PRODUCTS and
 * Suppliers' canonical MOCK_SUPPLIERS ids — no duplicate product/supplier
 * data lives here. Three records (`PUR-000210`/`PUR-000205`/`PUR-000198`)
 * deliberately reuse the exact references Stock's own mockMovements.ts
 * already seeded for its PURCHASE-type movements, so PurchaseDetailScreen's
 * "Stock impact" section has a real populated example instead of always
 * hitting the (already web-defined) "not in your history" empty state.
 */
import type { Purchase } from '../types';

function daysAgoIso(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    reference: 'PUR-000210',
    createdAt: daysAgoIso(0, 9, 40),
    supplierId: 'sup-3',
    supplierName: 'Fresh Foods Wholesale',
    items: [{ productId: 'prd-9', productName: 'Basmati Rice 5kg', quantity: 20, unitCostMinor: 42000 }],
    subtotalMinor: 840000,
    discountMinor: 0,
    taxMinor: 42000,
    totalMinor: 882000,
    paymentStatus: 'Paid',
    notes: '',
  },
  {
    id: 'pur-2',
    reference: 'PUR-000211',
    createdAt: daysAgoIso(1, 14, 0),
    supplierId: 'sup-4',
    supplierName: 'Urban Threads Pvt Ltd',
    items: [
      { productId: 'prd-7', productName: 'Cotton T-Shirt (M)', quantity: 20, unitCostMinor: 25000 },
      { productId: 'prd-14', productName: 'Denim Jacket (L)', quantity: 5, unitCostMinor: 120000 },
    ],
    subtotalMinor: 1100000,
    discountMinor: 20000,
    taxMinor: 54000,
    totalMinor: 1134000,
    paymentStatus: 'Partial',
    notes: 'Balance due on next delivery.',
  },
  {
    id: 'pur-3',
    reference: 'PUR-000209',
    createdAt: daysAgoIso(2, 11, 0),
    supplierId: 'sup-5',
    supplierName: 'GlowKart Cosmetics',
    items: [
      { productId: 'prd-10', productName: 'Hand Sanitizer 250ml', quantity: 30, unitCostMinor: 8000 },
      { productId: 'prd-11', productName: 'Face Wash 100ml', quantity: 20, unitCostMinor: 12000 },
    ],
    subtotalMinor: 480000,
    discountMinor: 0,
    taxMinor: 24000,
    totalMinor: 504000,
    paymentStatus: 'Unpaid',
    notes: '',
  },
  {
    id: 'pur-4',
    reference: 'PUR-000205',
    createdAt: daysAgoIso(4, 9, 15),
    supplierId: 'sup-1',
    supplierName: 'Sharma Distributors',
    items: [{ productId: 'prd-13', productName: 'Ballpoint Pen (Box of 10)', quantity: 15, unitCostMinor: 6000 }],
    subtotalMinor: 90000,
    discountMinor: 0,
    taxMinor: 4500,
    totalMinor: 94500,
    paymentStatus: 'Paid',
    notes: '',
  },
  {
    id: 'pur-5',
    reference: 'PUR-000208',
    createdAt: daysAgoIso(9, 10, 30),
    supplierId: 'sup-3',
    supplierName: 'Fresh Foods Wholesale',
    items: [{ productId: 'prd-8', productName: 'Instant Coffee 200g', quantity: 25, unitCostMinor: 28000 }],
    subtotalMinor: 700000,
    discountMinor: 10000,
    taxMinor: 34500,
    totalMinor: 724500,
    paymentStatus: 'Paid',
    notes: '',
  },
  {
    id: 'pur-6',
    reference: 'PUR-000198',
    createdAt: daysAgoIso(7, 9, 0),
    supplierId: 'sup-2',
    supplierName: 'Metro Electronics Supply',
    items: [{ productId: 'prd-1', productName: 'Wireless Mouse', quantity: 10, unitCostMinor: 65000 }],
    subtotalMinor: 650000,
    discountMinor: 0,
    taxMinor: 32500,
    totalMinor: 682500,
    paymentStatus: 'Paid',
    notes: '',
  },
];
