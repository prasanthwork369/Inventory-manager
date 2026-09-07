/**
 * Atomic Create Purchase: header + items + per-item stock increase +
 * PURCHASE movements, all in one transaction. Total calculation mirrors
 * purchases/utils/calculations.ts's calculatePurchaseTotals exactly, but
 * reads tax config from settingsRepository (the real persisted value)
 * instead of importing that feature file or duplicating its hardcoded
 * constants — the application layer must not depend on a feature layer.
 */
import { getDatabase, purchaseRepository, productRepository, settingsRepository, stockMovementRepository, supplierRepository } from '@/database';
import { generateId } from '@/database/repositories/shared';
import { BusinessError } from '../errors';
import { pad, runInTransaction } from '../shared';
import type { CreatePurchaseInput, Purchase, PurchaseItem } from '@/features/purchases/types';

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  if (input.items.length === 0) throw new BusinessError('EMPTY_PURCHASE', 'Add at least one item to the purchase.');
  for (const item of input.items) {
    if (item.quantity <= 0) throw new BusinessError('INVALID_QUANTITY', 'Enter a quantity greater than zero for every item.');
  }

  const supplier = await supplierRepository.getSupplierById(input.supplierId);
  if (!supplier) throw new BusinessError('SUPPLIER_NOT_FOUND', `Supplier ${input.supplierId} not found.`);

  const settings = await settingsRepository.getSettings();
  const db = await getDatabase();

  return runInTransaction(db, async (tx) => {
    const resolvedItems: PurchaseItem[] = [];
    for (const item of input.items) {
      const product = await productRepository.getProductById(item.productId, tx);
      if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found.`);
      resolvedItems.push({ productId: product.id, productName: product.name, quantity: item.quantity, unitCostMinor: item.unitCostMinor });
    }

    const subtotalMinor = resolvedItems.reduce((sum, it) => sum + it.quantity * it.unitCostMinor, 0);
    const taxableMinor = Math.max(subtotalMinor - input.discountMinor, 0);
    const taxMinor = settings.tax.enabled && settings.tax.applyToPurchases ? Math.round((taxableMinor * settings.tax.ratePercent) / 100) : 0;
    const totalMinor = taxableMinor + taxMinor;

    const purchase: Purchase = {
      id: generateId('pur'),
      reference: `PUR-${pad(Date.now() % 100000)}`,
      createdAt: new Date().toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: resolvedItems,
      subtotalMinor,
      discountMinor: input.discountMinor,
      taxMinor,
      totalMinor,
      paymentStatus: input.paymentStatus,
      notes: input.notes,
    };

    await purchaseRepository.insertPurchase(tx, purchase);

    for (const item of resolvedItems) {
      // Re-read (not the earlier resolvedItems pass) so two lines for the
      // same product within one purchase stack correctly, not both
      // starting from the same stale "before" value.
      const product = await productRepository.getProductById(item.productId, tx);
      if (!product) throw new BusinessError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found.`);
      const quantityBefore = product.currentStock;
      const quantityAfter = quantityBefore + item.quantity;
      await productRepository.updateCurrentStock(tx, item.productId, quantityAfter);
      await stockMovementRepository.insertMovement(tx, {
        productId: item.productId,
        productName: item.productName,
        type: 'PURCHASE',
        quantityDelta: item.quantity,
        quantityBefore,
        quantityAfter,
        reason: `Purchase ${purchase.reference}`,
        reference: purchase.reference,
        recordedBy: 'Owner',
      });
    }

    return purchase;
  });
}
