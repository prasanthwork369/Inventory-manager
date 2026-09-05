export const CURRENCY_SYMBOL = '₹';

export const SALES_PROFIT_RANGE_OPTIONS: { value: '1' | '7' | '30' | '90'; label: string }[] = [
  { value: '1', label: 'Today' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

export const PROFIT_RANGE_OPTIONS: { value: '1' | '7' | '30' | '90'; label: string }[] = [
  { value: '1', label: 'Daily' },
  { value: '7', label: 'Weekly' },
  { value: '30', label: 'Monthly' },
  { value: '90', label: 'Quarter' },
];

export const PURCHASE_RANGE_OPTIONS: { value: '7' | '30' | '90' | 'all'; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'all', label: 'All' },
];
