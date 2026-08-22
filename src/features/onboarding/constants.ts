/**
 * Copied verbatim from the web reference's Onboarding.tsx (business type
 * list, `symbolFor`, country list — all defined inline there; extracted
 * here only because this feature is now split across a hook + screen that
 * both need them, where web had one function scope). Same order, same
 * strings, same currency set.
 */
import type { BusinessProfile, CurrencyCode } from './types';

export const BUSINESS_TYPES = [
  'General Store',
  'Mini Supermarket',
  'Electronics Shop',
  'Clothing Store',
  'Hardware Store',
  'Cosmetics Store',
  'Wholesaler',
  'Home Business',
] as const;

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  NGN: '₦',
};

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[];

export const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Nigeria', 'UAE', 'Kenya'] as const;

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  name: '',
  type: 'General Store',
  currency: 'INR',
  country: 'India',
  phone: '',
  address: '',
};
