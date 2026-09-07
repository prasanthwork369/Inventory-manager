/**
 * Atomic Stock Out. Reads InventorySettings.allowNegativeStock through
 * settingsRepository (the real persisted value) rather than a duplicate
 * hardcoded constant — settings don't need to be read inside the
 * transaction itself since nothing here writes back to them.
 */
import { getDatabase, productRepository, settingsRepository, stockMovementRepository } from '@/database';
import { BusinessError } from '../errors';
import { pad, runInTransaction } from '../shared';
import type { MovementType, StockActionResult, StockOutInput } from '@/features/stock/types';

// Mirrors stockProvider.ts's movementTypeForStockOut — a Stock Out
// reasoned "Damaged" gets the more specific DAMAGE type.
function movementTypeForStockOut(reason: string): MovementType {
  return reason === 'Damaged' ? 'DAMAGE' : 'MANUAL_OUT';
}

export async function stockOut(input: StockOutInput): Promise<StockActionResult> {
  if (input.quantity <= 0) throw new BusinessError('INVALID_QUANTITY', 'Enter a quantity greater than zero.');

  const settings = await settingsRepository.getSettings();
  const db = await getDatabase();

  return runInTransaction(db, async (tx) => {
    const product = await productRepository.getProductById(input.productId, tx);
    if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${input.productId} not found.`);

    const quantityBefore = product.currentStock;
    if (input.quantity > quantityBefore && !settings.inventory.allowNegativeStock) {
      throw new BusinessError('INSUFFICIENT_STOCK', `Only ${quantityBefore} units of ${product.name} in stock.`);
    }

    const quantityAfter = quantityBefore - input.quantity;
    await productRepository.updateCurrentStock(tx, product.id, quantityAfter);

    const movement = await stockMovementRepository.insertMovement(tx, {
      productId: product.id,
      productName: product.name,
      type: movementTypeForStockOut(input.reason),
      quantityDelta: -input.quantity,
      quantityBefore,
      quantityAfter,
      reason: input.reason,
      reference: `OUT-${pad(Date.now() % 100000)}`,
      recordedBy: 'Owner',
    });

    return { movement, quantityBefore, quantityAfter };
  });
}
