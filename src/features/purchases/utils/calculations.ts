/**
 * The one shared place purchase totals are computed — used identically
 * by the New Purchase form, its review sheet, and purchasesProvider's
 * createPurchase, so none of them can drift out of sync with each other.
 * Mirrors the web's NewPurchase.tsx inline calculation exactly:
 * subtotal -> taxable (subtotal - discount, floored at 0) -> tax (only
 * if enabled) -> total.
 */
import { TAX_APPLIES_TO_PURCHASES, TAX_RATE_PERCENT } from '../constants';

export interface PurchaseTotals {
  subtotalMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function calculatePurchaseTotals(
  items: { quantity: number; unitCostMinor: number }[],
  discountMinor: number
): PurchaseTotals {
  const subtotalMinor = items.reduce((sum, it) => sum + it.quantity * it.unitCostMinor, 0);
  const taxableMinor = Math.max(subtotalMinor - discountMinor, 0);
  const taxMinor = TAX_APPLIES_TO_PURCHASES ? Math.round((taxableMinor * TAX_RATE_PERCENT) / 100) : 0;
  const totalMinor = taxableMinor + taxMinor;
  return { subtotalMinor, taxableMinor, taxMinor, totalMinor };
}
