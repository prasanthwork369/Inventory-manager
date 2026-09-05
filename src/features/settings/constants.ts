/**
 * One canonical default-settings source (per the "don't scatter defaults
 * across screens" rule). Values mirror the web reference's seed.ts
 * `defaultSettings` exactly. Several other features already hardcode a
 * piece of this same data pending Settings existing (Stock's
 * STOCK_VALUATION/ALLOW_NEGATIVE_STOCK, Purchases/Sales' TAX_RATE_PERCENT,
 * Reports/Alerts' RECEIPT_BUSINESS) — this phase does not go back and
 * rewire those call sites to read from here; each already documents that
 * intent for a future pass, and doing it now would be a multi-feature
 * refactor outside this phase's stated scope (see the final report).
 *
 * BUSINESS_TYPES/CURRENCIES/CURRENCY_SYMBOLS are Onboarding's own
 * constants, reused as-is rather than redefined — same option lists, web
 * source and phase brief both call for this.
 */
import { BUSINESS_TYPES, CURRENCY_SYMBOLS, CURRENCIES } from '@/features/onboarding/constants';
import type { AppSettings } from './types';

export { BUSINESS_TYPES, CURRENCIES, CURRENCY_SYMBOLS };

export const LOCK_TIMEOUT_OPTIONS = [1, 5, 15, 30];

export const DEFAULT_SETTINGS: AppSettings = {
  business: {
    name: 'Neptune General Store',
    type: 'General Store',
    currency: 'INR',
    currencySymbol: '₹',
    country: 'India',
    phone: '+91 98765 43210',
    address: '14 MG Road, Indiranagar, Bengaluru 560038',
    email: 'hello@neptunestore.in',
    logo: '',
  },
  tax: { enabled: true, ratePercent: 5, inclusive: false, applyToPurchases: true },
  inventory: { lowStockThreshold: 5, allowNegativeStock: false, valuation: 'cost' },
  receipt: {
    prefix: 'SALE',
    nextNumber: 129,
    footer: 'Thank you for shopping with us. Goods once sold are returnable within 7 days with receipt.',
    showTax: true,
    showLogo: true,
  },
  security: { mode: 'none', hasPinSet: false, autoLock: true, timeoutMinutes: 5 },
  notifications: { lowStockAlerts: true, outOfStockAlerts: true, backupReminders: true },
};
