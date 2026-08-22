/**
 * Ported from the web reference's ProductForm.tsx `validate()`. Centralized
 * here (not duplicated between create/edit) since both flows share this
 * exact rule set, and kept independent of persistence — swapping the
 * temporary provider for SQLite later doesn't touch this file.
 */
import { toMinorUnits } from './money';

export interface ProductFormErrors {
  name?: string;
  sku?: string;
  barcode?: string;
  sellingPrice?: string;
  purchasePrice?: string;
  openingStock?: string;
  minimumStock?: string;
}

export interface ProductDraftForValidation {
  name: string;
  sku: string;
  barcode: string;
  purchasePriceInput: string;
  sellingPriceInput: string;
  openingStockInput: string;
  minimumStockInput: string;
}

interface ValidateOptions {
  isEdit: boolean;
  skuTaken: boolean;
  barcodeTaken: boolean;
}

export function validateProductDraft(draft: ProductDraftForValidation, options: ValidateOptions): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!draft.name.trim()) {
    errors.name = 'Product name is required.';
  }

  if (!draft.sku.trim()) {
    errors.sku = 'SKU is required — it identifies this product.';
  } else if (options.skuTaken) {
    errors.sku = `SKU "${draft.sku.trim()}" already belongs to another product. Use a unique code.`;
  }

  if (draft.barcode.trim() && options.barcodeTaken) {
    errors.barcode = 'This barcode is already assigned to another product.';
  }

  const sellingPriceMinor = toMinorUnits(draft.sellingPriceInput || '0');
  const purchasePriceMinor = toMinorUnits(draft.purchasePriceInput || '0');

  if (sellingPriceMinor <= 0) {
    errors.sellingPrice = 'Selling price must be greater than zero.';
  }
  if (purchasePriceMinor < 0) {
    errors.purchasePrice = 'Cost price cannot be negative.';
  }
  if (sellingPriceMinor > 0 && purchasePriceMinor > sellingPriceMinor) {
    errors.sellingPrice = 'Selling price is below cost price — check your numbers.';
  }

  if (!options.isEdit) {
    const openingStock = Number(draft.openingStockInput || '0');
    if (openingStock < 0) {
      errors.openingStock = 'Opening stock cannot be negative.';
    }
  }

  const minimumStock = Number(draft.minimumStockInput || '0');
  if (minimumStock < 0) {
    errors.minimumStock = 'Minimum stock cannot be negative.';
  }

  return errors;
}
