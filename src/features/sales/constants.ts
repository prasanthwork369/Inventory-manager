import type { PaymentMethod } from './types';

export const CURRENCY_SYMBOL = '₹';

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Other'];

// Segmented is string-typed; SaleFilters.rangeDays is numeric for direct
// use in withinDays(), so these get converted back at the call site.
export const RANGE_OPTIONS: { value: '1' | '7' | '30' | 'all'; label: string }[] = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Week' },
  { value: '30', label: 'Month' },
  { value: 'all', label: 'All' },
];

export const RETURN_REASONS = ['Damaged', 'Wrong item', 'Customer return', 'Other'];
