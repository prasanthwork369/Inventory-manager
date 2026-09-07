/**
 * Atomic Stock Adjustment. Rejects a zero delta (physical count already
 * matches the system) — matches the current app's own validation
 * (useStockEntry.ts's `delta === 0` check), not a new rule invented here.
 */
import { getDatabase, productRepository, stockMovementRepository } from '@/database';
import { BusinessError } from '../errors';
import { pad, runInTransaction } from '../shared';
import type { StockActionResult, StockAdjustmentInput } from '@/features/stock/types';

export async function adjustStock(input: StockAdjustmentInput): Promise<StockActionResult> {
  if (input.physicalQuantity < 0) {
    throw new BusinessError('INVALID_QUANTITY', 'Enter the physical stock you counted. It cannot be negative.');
  }

  const db = await getDatabase();
  return runInTransaction(db, async (tx) => {
    const product = await productRepository.getProductById(input.productId, tx);
    if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${input.productId} not found.`);

    const quantityBefore = product.currentStock;
    // Use-case owns this calculation — never trust a screen-computed delta.
    const delta = input.physicalQuantity - quantityBefore;
    if (delta === 0) {
      throw new BusinessError('NO_STOCK_CHANGE', 'Physical stock already matches the system. No adjustment needed.');
    }

    const quantityAfter = input.physicalQuantity;
    await productRepository.updateCurrentStock(tx, product.id, quantityAfter);

    const movement = await stockMovementRepository.insertMovement(tx, {
      productId: product.id,
      productName: product.name,
      type: 'ADJUSTMENT',
      quantityDelta: delta,
      quantityBefore,
      quantityAfter,
      reason: input.reason,
      reference: `ADJ-${pad(Date.now() % 100000)}`,
      recordedBy: 'Owner',
    });

    return { movement, quantityBefore, quantityAfter };
  });
}
