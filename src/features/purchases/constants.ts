import type { PurchasePaymentStatus } from './types';

export const CURRENCY_SYMBOL = '₹';

export const PAYMENT_STATUS_OPTIONS: PurchasePaymentStatus[] = ['Paid', 'Partial', 'Unpaid'];

/** Mirrors web's defaultSettings.tax (enabled: true, applyToPurchases:
 * true, rate: 5) — Settings doesn't exist yet in this app, so this is
 * fixed here, same pattern as Stock's STOCK_VALUATION/ALLOW_NEGATIVE_STOCK.
 * Move to a real Settings read once that feature exists; only
 * utils/calculations.ts reads this, so no other change needed then. */
export const TAX_APPLIES_TO_PURCHASES = true;
export const TAX_RATE_PERCENT = 5;

// Segmented is string-typed (T extends string); PurchaseFilters.rangeDays
// is numeric for direct use in withinDays(), so these string option
// values get converted back to number|'all' at the call site.
export const RANGE_OPTIONS: { value: '1' | '7' | '30' | 'all'; label: string }[] = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Week' },
  { value: '30', label: 'Month' },
  { value: 'all', label: 'All' },
];
