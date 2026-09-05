/**
 * Read-only aggregate boundary, same shape as reportsProvider.ts: reads
 * Products/Stock, derives alerts, never persists them. Reuses Stock's
 * own lowStock/outOfStock rules and MovementType — no second low-stock
 * definition, no duplicated movement data.
 */
import { getProducts } from '@/features/products/data/productsProvider';
import { getMovements } from '@/features/stock/data/stockProvider';
import { lowStock, outOfStock } from '@/features/stock/utils/metrics';
import { dateLabel } from '@/features/stock/utils/format';
import { formatSignedQuantity } from '@/features/stock/utils/quantity';
import type { InventoryAlert } from '../types';

const QUERY_DELAY_MS = 60;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getAlerts(): Promise<InventoryAlert[]> {
  const [products, movements] = await Promise.all([
    getProducts(),
    getMovements({ query: '', type: 'all', productId: 'all', rangeDays: 'all' }),
  ]);

  const out = outOfStock(products);
  const low = lowStock(products);
  // web: movements.filter(m => m.type === 'adjust' && Math.abs(m.qty) >= 2)
  const anomalies = movements.filter((m) => m.type === 'ADJUSTMENT' && Math.abs(m.quantityDelta) >= 2).slice(0, 3);

  const alerts: InventoryAlert[] = [
    ...out.map((p) => ({
      id: `out-${p.id}`,
      kind: 'out-of-stock' as const,
      tone: 'bad' as const,
      title: `${p.name} is out of stock.`,
      body: `Last recorded stock was ${p.minimumStock} minimum. Receive new stock to keep selling.`,
      actionLabel: 'Stock In',
      productId: p.id,
    })),
    ...low.map((p) => ({
      id: `low-${p.id}`,
      kind: 'low-stock' as const,
      tone: 'warn' as const,
      title: `${p.name} is below minimum stock.`,
      body: `${p.currentStock} units left against a minimum of ${p.minimumStock}.`,
      actionLabel: 'Stock In',
      productId: p.id,
    })),
    ...anomalies.map((m) => ({
      id: `adj-${m.id}`,
      kind: 'large-adjustment' as const,
      tone: 'warn' as const,
      title: `Large stock adjustment on ${m.productName}.`,
      body: `${formatSignedQuantity(m.quantityDelta)} units on ${dateLabel(m.createdAt)} — ${m.reason}.`,
      actionLabel: 'View movements',
      productId: m.productId,
    })),
  ];
  return delay(alerts, QUERY_DELAY_MS);
}
