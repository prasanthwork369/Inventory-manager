/**
 * The single swappable boundary between Scanner's hook and product
 * lookup. Reuses Products' canonical getProducts() — no duplicate product
 * model, no direct access to Products' mock array.
 *
 * web: Scanner.tsx has no real camera/barcode reader. After a fixed delay
 * it "detects" whichever product currently has stock, falling back to the
 * first product overall, so the demo always shows a successful scan
 * unless the catalogue is empty. simulateScan() reproduces that exact
 * selection rule rather than inventing a real decoder the source doesn't
 * have. Manual entry is the only path that can genuinely miss, via
 * findProductByCode() — matching the web's `products.find(p => p.barcode
 * === code)`.
 *
 * Future: simulateScan() is replaced by a real decoded-barcode value once
 * a camera is introduced; findProductByCode() becomes a ProductRepository
 * lookup by barcode. Scanner itself doesn't change either way.
 */
import { getProducts } from '@/features/products/data/productsProvider';
import type { Product } from '@/features/products/types';

const SIMULATED_SCAN_DELAY_MS = 2600;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function simulateScan(): Promise<Product | undefined> {
  const products = await getProducts();
  const sample = products.find((p) => p.currentStock > 0) ?? products[0];
  return delay(sample, SIMULATED_SCAN_DELAY_MS);
}

export async function findProductByCode(code: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.barcode === code);
}
