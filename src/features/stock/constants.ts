/**
 * Direct copy of StockEntry.tsx's reason option lists, plus the two
 * settings.inventory values the web reads for Stock (valuation /
 * allowNegative). Settings isn't built yet in this app, so these are
 * fixed at the values seed.ts's defaultSettings already ships
 * (`valuation: 'cost'`, `allowNegative: false`) — move to a real
 * Settings read once that feature exists; no screen/hook change needed
 * when it does, since both are only ever read through here.
 */
import type { StockMovementFilterType } from './types';

export const STOCK_OUT_REASONS = ['Damaged', 'Lost', 'Internal use', 'Expired', 'Correction', 'Other'] as const;
export const STOCK_ADJUST_REASONS = [
  'Physical count correction',
  'Damaged goods found',
  'Data entry error',
  'Theft / shrinkage',
  'Other',
] as const;

export const STOCK_VALUATION: 'cost' | 'selling' = 'cost';
export const ALLOW_NEGATIVE_STOCK = false;

export const CURRENCY_SYMBOL = '₹';

/** Wording copied verbatim from the web's `movementLabel[t]` for the 6
 * keys the Movements filter exposes. */
export const MOVEMENT_TYPE_FILTER_OPTIONS: { value: Exclude<StockMovementFilterType, 'all'>; label: string }[] = [
  { value: 'in', label: 'Stock In' },
  { value: 'out', label: 'Stock Out' },
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'adjust', label: 'Adjustment' },
  { value: 'return', label: 'Return' },
];
