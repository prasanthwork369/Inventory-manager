/**
 * Direct conversion of the web reference's `Settings` type (src/types/
 * index.ts). Business/security deliberately reuse Onboarding's existing
 * `BusinessProfile`/`LockMode` (Onboarding.tsx and this phase's web
 * source collect overlapping business/security fields) rather than
 * defining a second, competing business-profile shape — Onboarding's
 * file is untouched, this only imports its types and extends them with
 * the extra fields Settings' fuller form needs.
 *
 * `SecuritySettings` intentionally has no `pin` field: nothing in this
 * app enforces the PIN anywhere (there is no lock screen), so persisting
 * the actual digits — even in this temporary, in-memory provider — would
 * be a stored "credential" with no real protection behind it. Only
 * whether a PIN has been set is tracked; the typed digits the user enters
 * live in the screen's own local form state just long enough to validate
 * length, then are discarded on save (see hooks/useSecuritySettings.ts).
 */
import type { BusinessProfile, LockMode } from '@/features/onboarding/types';

export interface BusinessSettings extends BusinessProfile {
  currencySymbol: string;
  email: string;
  logo: string;
}

export interface TaxSettings {
  enabled: boolean;
  ratePercent: number;
  inclusive: boolean;
  applyToPurchases: boolean;
}

export interface InventorySettings {
  lowStockThreshold: number;
  allowNegativeStock: boolean;
  valuation: 'cost' | 'selling';
}

export interface ReceiptSettings {
  prefix: string;
  nextNumber: number;
  footer: string;
  showTax: boolean;
  showLogo: boolean;
}

export interface SecuritySettings {
  mode: LockMode;
  hasPinSet: boolean;
  autoLock: boolean;
  timeoutMinutes: number;
}

export interface NotificationSettings {
  lowStockAlerts: boolean;
  outOfStockAlerts: boolean;
  backupReminders: boolean;
}

export interface AppSettings {
  business: BusinessSettings;
  tax: TaxSettings;
  inventory: InventorySettings;
  receipt: ReceiptSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
}
