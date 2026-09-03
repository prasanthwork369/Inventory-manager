/**
 * The one shared place sale totals are computed — used by the New Sale
 * cart/summary steps and salesProvider's createSale, so none of them can
 * drift out of sync. Mirrors NewSale.tsx's inline calculation exactly:
 * line totals (qty*price - line discount) -> subtotal -> taxable
 * (subtotal - order discount, floored at 0) -> tax -> total.
 *
 * Return refund math is kept separate (calculateReturnRefund) — it's a
 * genuinely different computation (per-unit price net of the original
 * line discount, times the quantity being returned), not a variant of
 * the sale-total path.
 */
import { TAX_ENABLED, TAX_RATE_PERCENT } from '../constants';

export interface SaleTotals {
  subtotalMinor: number;
  taxableMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function calculateSaleTotals(
  items: { quantity: number; unitPriceMinor: number; discountMinor: number }[],
  orderDiscountMinor: number
): SaleTotals {
  const subtotalMinor = items.reduce((sum, it) => sum + it.quantity * it.unitPriceMinor - it.discountMinor, 0);
  const taxableMinor = Math.max(subtotalMinor - orderDiscountMinor, 0);
  const taxMinor = TAX_ENABLED ? Math.round((taxableMinor * TAX_RATE_PERCENT) / 100) : 0;
  const totalMinor = taxableMinor + taxMinor;
  return { subtotalMinor, taxableMinor, taxMinor, totalMinor };
}

// web: (it.price - it.discount/it.qty) * returnQty, rounded — the
// per-unit price net of that line's original discount, not a share of
// the order-level discount/tax (the web source doesn't refund those).
// Exposed per-item (not just totalled) so salesProvider can use the same
// formula for each SaleReturnItem.amountMinor it stores.
export function calculateReturnItemAmount(unitPriceMinor: number, lineDiscountMinor: number, soldQuantity: number, returnQuantity: number): number {
  const perUnit = unitPriceMinor - lineDiscountMinor / soldQuantity;
  return Math.round(perUnit * returnQuantity);
}

export function calculateReturnRefund(items: { unitPriceMinor: number; lineDiscountMinor: number; soldQuantity: number; returnQuantity: number }[]): number {
  return items.reduce((sum, it) => sum + calculateReturnItemAmount(it.unitPriceMinor, it.lineDiscountMinor, it.soldQuantity, it.returnQuantity), 0);
}
