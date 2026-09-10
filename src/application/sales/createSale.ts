/**
 * Atomic Create Sale: header + items + per-item stock decrease + SALE
 * movements, all in one transaction. Totals are computed by the same
 * calculateSaleTotals() the New Sale cart preview uses (both read live
 * settingsRepository tax config), so the preview and the saved sale can
 * never disagree — this is the one place that math lives. Stock-
 * sufficiency check mirrors useNewSale.ts's cart guard (`quantity >
 * currentStock && !allowNegativeStock`), duplicated since it's a one-line
 * guard, not a calculation worth sharing a module for.
 */
import { getDatabase, productRepository, saleRepository, settingsRepository, stockMovementRepository } from '@/database';
import { generateId } from '@/database/repositories/shared';
import { BusinessError } from '../errors';
import { pad, runInTransaction } from '../shared';
import { calculateSaleTotals } from '@/features/sales/utils/calculations';
import type { CreateSaleInput, Sale, SaleItem } from '@/features/sales/types';

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  if (input.items.length === 0) throw new BusinessError('EMPTY_SALE', 'Add at least one item to the sale.');
  for (const item of input.items) {
    if (item.quantity <= 0) throw new BusinessError('INVALID_QUANTITY', 'Enter a quantity greater than zero for every item.');
  }

  const settings = await settingsRepository.getSettings();
  const db = await getDatabase();

  return runInTransaction(db, async (tx) => {
    const resolvedItems: SaleItem[] = [];
    let costMinor = 0;
    for (const item of input.items) {
      const product = await productRepository.getProductById(item.productId, tx);
      if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found.`);
      if (item.quantity > product.currentStock && !settings.inventory.allowNegativeStock) {
        throw new BusinessError('INSUFFICIENT_STOCK', `Only ${product.currentStock} units of ${product.name} in stock.`);
      }
      costMinor += product.purchasePriceMinor * item.quantity;
      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
      });
    }

    const { subtotalMinor, taxMinor, totalMinor } = calculateSaleTotals(resolvedItems, input.discountMinor, {
      enabled: settings.tax.enabled,
      ratePercent: settings.tax.ratePercent,
    });

    const sale: Sale = {
      id: generateId('sal'),
      receiptNo: `SALE-${pad(Date.now() % 100000)}`,
      createdAt: new Date().toISOString(),
      items: resolvedItems,
      subtotalMinor,
      discountMinor: input.discountMinor,
      taxMinor,
      totalMinor,
      costMinor,
      customerId: input.customerId,
      customerName: input.customerName,
      paymentMethod: input.paymentMethod,
      amountReceivedMinor: input.amountReceivedMinor,
      status: 'completed',
    };

    await saleRepository.insertSale(tx, sale);

    for (const item of resolvedItems) {
      const product = await productRepository.getProductById(item.productId, tx);
      if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found.`);
      const quantityBefore = product.currentStock;
      const quantityAfter = quantityBefore - item.quantity;
      await productRepository.updateCurrentStock(tx, item.productId, quantityAfter);
      await stockMovementRepository.insertMovement(tx, {
        productId: item.productId,
        productName: item.productName,
        type: 'SALE',
        quantityDelta: -item.quantity,
        quantityBefore,
        quantityAfter,
        reason: `Sale ${sale.receiptNo}`,
        reference: sale.receiptNo,
        recordedBy: 'Owner',
      });
    }

    return sale;
  });
}
