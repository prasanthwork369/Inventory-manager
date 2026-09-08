/**
 * The single swappable boundary between Settings' hooks and its data
 * source — now backed by settingsRepository's singleton `app_settings`
 * row (Database Stage 2) instead of a module-scoped variable, so a save
 * now genuinely survives an app restart.
 *
 * `updateSettings` keeps its existing `Partial<AppSettings>` shape: every
 * settings hook calls it with exactly one section key (`{ tax: form }`,
 * `{ business: trimmed }`, ...), which this dispatches to the matching
 * settingsRepository.update*Settings call. Onboarding's completion (see
 * OnboardingScreen.tsx) is the one caller that passes two keys
 * (business + security) in a single patch, so every present key is
 * applied, not just the first.
 */
import { settingsRepository } from '@/database';
import type { AppSettings } from '../types';

export function getSettings(): Promise<AppSettings> {
  return settingsRepository.getSettings();
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  if (patch.business) await settingsRepository.updateBusinessSettings(patch.business);
  if (patch.tax) await settingsRepository.updateTaxSettings(patch.tax);
  if (patch.inventory) await settingsRepository.updateInventorySettings(patch.inventory);
  if (patch.receipt) await settingsRepository.updateReceiptSettings(patch.receipt);
  if (patch.security) await settingsRepository.updateSecuritySettings(patch.security);
  if (patch.notifications) await settingsRepository.updateNotificationSettings(patch.notifications);
  return settingsRepository.getSettings();
}
