/**
 * Atomic Stock In: read current stock, write the new cached value, and
 * insert its movement in one transaction so a mid-way failure leaves
 * neither change behind. Mirrors stockProvider.ts's stockIn() signature
 * so Stage 4 can swap the import with no caller change.
 */
import { getDatabase, productRepository, stockMovementRepository } from '@/database';
import { BusinessError } from '../errors';
import { runInTransaction } from '../shared';
import type { StockActionResult, StockInInput } from '@/features/stock/types';

export async function stockIn(input: StockInInput): Promise<StockActionResult> {
  if (input.quantity <= 0) throw new BusinessError('INVALID_QUANTITY', 'Enter a quantity greater than zero.');

  const db = await getDatabase();
  return runInTransaction(db, async (tx) => {
    const product = await productRepository.getProductById(input.productId, tx);
    if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${input.productId} not found.`);

    const quantityBefore = product.currentStock;
    const quantityAfter = quantityBefore + input.quantity;
    await productRepository.updateCurrentStock(tx, product.id, quantityAfter);

    const movement = await stockMovementRepository.insertMovement(tx, {
      productId: product.id,
      productName: product.name,
      type: 'MANUAL_IN',
      quantityDelta: input.quantity,
      quantityBefore,
      quantityAfter,
      reason: input.reason,
      reference: input.reference,
      recordedBy: 'Owner',
    });

    return { movement, quantityBefore, quantityAfter };
  });
}
