/**
 * Onboarding-only contracts, derived from what the web reference's
 * Onboarding.tsx actually needs (its local `form`/`lock`/`pin` state and
 * the `settings.business`/`settings.security` slices it writes into).
 *
 * Deliberately NOT modeled here: web's full `Settings` type (tax/receipt/
 * notifications/etc.) — onboarding only ever touches business + security,
 * so only those are represented. Nothing here assumes a SQLite row shape;
 * a future SettingsRepository can map these onto however business_profile/
 * security_preferences end up stored without this feature's UI changing.
 */

export type OnboardingStep = 'splash' | 'welcome' | 'business' | 'security' | 'done';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'NGN';

export interface BusinessProfile {
  name: string;
  type: string;
  currency: CurrencyCode;
  country: string;
  phone: string;
  address: string;
}

export type LockMode = 'pin' | 'biometric' | 'none';

export interface SecurityPreferences {
  mode: LockMode;
  pin: string;
}

/** The full draft this feature collects before handing off to persistence. */
export interface OnboardingDraft {
  business: BusinessProfile;
  security: SecurityPreferences;
}
