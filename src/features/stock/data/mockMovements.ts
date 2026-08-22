/**
 * Temporary typed data, standing in for the web reference's seed.ts
 * `seedMovements`. References this project's actual MOCK_PRODUCTS ids/
 * names (mockProducts.ts) rather than the web's own product set. Spans a
 * mix of every MovementType the current UI can produce or has historical
 * data for (SALE/PURCHASE/MANUAL_IN/MANUAL_OUT/ADJUSTMENT/SALE_RETURN/
 * DAMAGE) so every Movements-screen filter bucket and badge tone has real
 * rows to exercise. Like the rest of this project's mock data, this array
 * is read-only — Stock In/Out/Adjust never push into it (see
 * stockProvider.ts's header for why).
 */
import type { StockMovement } from '../types';

function daysAgoIso(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

let seq = 0;
function mv(
  productId: string,
  productName: string,
  type: StockMovement['type'],
  delta: number,
  after: number,
  reason: string,
  reference: string,
  createdAt: string
): StockMovement {
  seq += 1;
  return {
    id: `mov-${seq}`,
    productId,
    productName,
    type,
    quantityDelta: delta,
    quantityBefore: after - delta,
    quantityAfter: after,
    reason,
    reference,
    recordedBy: 'Owner',
    createdAt,
  };
}

export const MOCK_MOVEMENTS: StockMovement[] = [
  mv('prd-12', 'Mechanical Keyboard', 'SALE', -2, 14, 'Sale', 'SALE-000142', daysAgoIso(0, 11, 15)),
  mv('prd-1', 'Wireless Mouse', 'SALE', -1, 4, 'Sale', 'SALE-000142', daysAgoIso(0, 11, 15)),
  mv('prd-9', 'Basmati Rice 5kg', 'PURCHASE', 20, 73, 'Purchase received', 'PUR-000210', daysAgoIso(0, 9, 40)),
  mv('prd-5', 'Steel Water Bottle 1L', 'MANUAL_IN', 6, 11, 'Received from Sharma Distributors', 'IN-000042', daysAgoIso(0, 8, 10)),
  mv('prd-14', 'Denim Jacket (L)', 'ADJUSTMENT', -1, 2, 'Physical count correction', 'ADJ-000031', daysAgoIso(1, 15, 5)),
  mv('prd-11', 'Face Wash 100ml', 'DAMAGE', -2, 0, 'Damaged', 'OUT-000058', daysAgoIso(1, 12, 30)),
  mv('prd-6', 'Desk Lamp LED', 'MANUAL_OUT', -3, 0, 'Lost', 'OUT-000057', daysAgoIso(1, 10, 20)),
  mv('prd-3', 'Bluetooth Speaker', 'SALE', -1, 0, 'Sale', 'SALE-000140', daysAgoIso(2, 16, 45)),
  mv('prd-8', 'Instant Coffee 200g', 'SALE', -6, 19, 'Sale', 'SALE-000139', daysAgoIso(2, 14, 12)),
  mv('prd-2', 'USB-C Cable 1m', 'SALE_RETURN', 2, 86, 'Return — unopened', 'RET-000009', daysAgoIso(3, 12, 0)),
  mv('prd-13', 'Ballpoint Pen (Box of 10)', 'PURCHASE', 15, 35, 'Purchase received', 'PUR-000205', daysAgoIso(4, 9, 15)),
  mv('prd-10', 'Hand Sanitizer 250ml', 'MANUAL_OUT', -4, 6, 'Internal use', 'OUT-000050', daysAgoIso(5, 17, 30)),
  mv('prd-4', 'Notebook A5 Ruled', 'SALE', -8, 142, 'Sale', 'SALE-000131', daysAgoIso(6, 13, 0)),
  mv('prd-7', 'Cotton T-Shirt (M)', 'ADJUSTMENT', 3, 58, 'Data entry error', 'ADJ-000028', daysAgoIso(6, 10, 45)),
  mv('prd-1', 'Wireless Mouse', 'PURCHASE', 10, 14, 'Purchase received', 'PUR-000198', daysAgoIso(7, 9, 0)),
];
