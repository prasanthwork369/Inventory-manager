/**
 * Atomic Create Sale: header + items + per-item stock decrease + SALE
 * movements, all in one transaction. Total calculation mirrors
 * sales/utils/calculations.ts's calculateSaleTotals; stock-sufficiency
 * check mirrors useNewSale.ts's cart guard (`quantity > currentStock &&
 * !allowNegativeStock`) — both duplicated, not imported, for the same
 * "application layer can't depend on a feature layer" reason used
 * throughout the database layer.
 */
import { getDatabase, productRepository, saleRepository, settingsRepository, stockMovementRepository } from '@/database';
import { generateId } from '@/database/repositories/shared';
import { BusinessError } from '../errors';
import { pad, runInTransaction } from '../shared';
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

    const subtotalMinor = resolvedItems.reduce((sum, it) => sum + it.quantity * it.unitPriceMinor - it.discountMinor, 0);
    const taxableMinor = Math.max(subtotalMinor - input.discountMinor, 0);
    const taxMinor = settings.tax.enabled ? Math.round((taxableMinor * settings.tax.ratePercent) / 100) : 0;
    const totalMinor = taxableMinor + taxMinor;

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
