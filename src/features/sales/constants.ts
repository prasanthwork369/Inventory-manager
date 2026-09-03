import type { PaymentMethod } from './types';

export const CURRENCY_SYMBOL = '₹';

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Other'];

/** Mirrors web's defaultSettings.tax (enabled: true, rate: 5) — Settings
 * doesn't exist yet in this app, same pattern as Stock/Purchases. Only
 * utils/calculations.ts reads this. */
export const TAX_ENABLED = true;
export const TAX_RATE_PERCENT = 5;

// Segmented is string-typed; SaleFilters.rangeDays is numeric for direct
// use in withinDays(), so these get converted back at the call site.
export const RANGE_OPTIONS: { value: '1' | '7' | '30' | 'all'; label: string }[] = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Week' },
  { value: '30', label: 'Month' },
  { value: 'all', label: 'All' },
];

export const RETURN_REASONS = ['Damaged', 'Wrong item', 'Customer return', 'Other'];

/** Mirrors web's defaultSettings.business/receipt — Settings doesn't
 * exist yet, same reasoning as TAX_*. Only ReceiptScreen reads these. */
export const RECEIPT_BUSINESS = {
  name: 'Neptune General Store',
  address: '14 MG Road, Indiranagar, Bengaluru 560038',
  phone: '+91 98765 43210',
};
export const RECEIPT_FOOTER = 'Thank you for shopping with us. Goods once sold are returnable within 7 days with receipt.';
