/**
 * Copied from the web reference's Onboarding.tsx validation:
 * `submitBusiness` (name length < 2) and the security step's Continue
 * button disabled condition (`lock === 'pin' && pin.length < 4`).
 * Centralized here so neither rule is re-implemented per step/screen.
 */
import type { BusinessProfile, SecurityPreferences } from '../types';

export function validateBusinessProfile(business: BusinessProfile): string | null {
  if (business.name.trim().length < 2) {
    return 'Enter your business name so it can appear on receipts.';
  }
  return null;
}

export function isSecurityValid(security: SecurityPreferences): boolean {
  return security.mode !== 'pin' || security.pin.length === 4;
}
