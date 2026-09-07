/**
 * Atomic Create Sale Return. Preserves the Phase 10 correction: remaining
 * returnable quantity is checked against saleRepository's
 * getAlreadyReturnedQuantity (summed across EVERY prior return row for
 * this sale+product, read inside this same transaction), never against
 * just the current batch — so this rejects an over-return regardless of
 * how many separate return transactions came before it.
 *
 * Only restocks/writes a SALE_RETURN movement when input.restock is
 * true, matching the "Return items to stock" toggle's existing meaning
 * (SaleReturnScreen.tsx: "No stock change" when off) — a return that
 * isn't restocked has nothing to move.
 */
import { getDatabase, productRepository, saleRepository, stockMovementRepository } from '@/database';
import { generateId } from '@/database/repositories/shared';
import { BusinessError } from '../errors';
import { pad, runInTransaction } from '../shared';
import type { CreateSaleReturnInput, SaleReturn, SaleReturnItem } from '@/features/sales/types';

export async function createSaleReturn(input: CreateSaleReturnInput): Promise<SaleReturn> {
  if (input.items.length === 0) throw new BusinessError('INVALID_RETURN_QUANTITY', 'Select at least one item to return.');

  const sale = await saleRepository.getSaleById(input.saleId);
  if (!sale) throw new BusinessError('SALE_NOT_FOUND', `Sale ${input.saleId} not found.`);

  const db = await getDatabase();

  return runInTransaction(db, async (tx) => {
    const resolvedItems: SaleReturnItem[] = [];
    let refundMinor = 0;

    for (const line of input.items) {
      if (line.quantity <= 0) throw new BusinessError('INVALID_RETURN_QUANTITY', 'Enter a return quantity greater than zero.');
      const saleLine = sale.items.find((it) => it.productId === line.productId);
      if (!saleLine) throw new BusinessError('INVALID_RETURN_QUANTITY', `${line.productId} was not part of this sale.`);

      // Validate against the FULL return history, not just this batch.
      const alreadyReturned = await saleRepository.getAlreadyReturnedQuantity(sale.id, line.productId, tx);
      const remaining = Math.max(saleLine.quantity - alreadyReturned, 0);
      if (line.quantity > remaining) {
        throw new BusinessError('INVALID_RETURN_QUANTITY', `Only ${remaining} units of ${saleLine.productName} can still be returned.`);
      }

      // Mirrors sales/utils/calculations.ts's calculateReturnItemAmount:
      // per-unit price net of that line's original discount.
      const perUnit = saleLine.unitPriceMinor - saleLine.discountMinor / saleLine.quantity;
      const amountMinor = Math.round(perUnit * line.quantity);
      refundMinor += amountMinor;
      resolvedItems.push({ productId: line.productId, productName: saleLine.productName, quantity: line.quantity, amountMinor });
    }

    const saleReturn: SaleReturn = {
      id: generateId('ret'),
      reference: `RET-${pad(Date.now() % 100000)}`,
      saleId: sale.id,
      receiptNo: sale.receiptNo,
      createdAt: new Date().toISOString(),
      items: resolvedItems,
      refundMinor,
      reason: input.reason,
      restock: input.restock,
    };

    await saleRepository.insertSaleReturn(tx, saleReturn);

    if (input.restock) {
      for (const item of resolvedItems) {
        const product = await productRepository.getProductById(item.productId, tx);
        if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found.`);
        const quantityBefore = product.currentStock;
        const quantityAfter = quantityBefore + item.quantity;
        await productRepository.updateCurrentStock(tx, item.productId, quantityAfter);
        await stockMovementRepository.insertMovement(tx, {
          productId: item.productId,
          productName: item.productName,
          type: 'SALE_RETURN',
          quantityDelta: item.quantity,
          quantityBefore,
          quantityAfter,
          reason: input.reason,
          reference: saleReturn.reference,
          recordedBy: 'Owner',
        });
      }
    }

    return saleReturn;
  });
}
