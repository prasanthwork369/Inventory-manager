/**
 * Repository ↔ Mapper for the `app_settings` singleton row (id=1, seeded
 * by Stage 1's migration — every read/update below assumes it already
 * exists). No `pin` column exists in the schema at all, so there is
 * nothing here that could ever persist PIN digits — same guarantee the
 * `SecuritySettings` domain type already gives.
 */
import { getDatabase } from '../client';
import { toSqliteBool, fromSqliteBool } from '../mappers';
import type { AppSettings, BusinessSettings, InventorySettings, NotificationSettings, ReceiptSettings, SecuritySettings, TaxSettings } from '@/features/settings/types';
import type { LockMode } from '@/features/onboarding/types';

interface AppSettingsRow {
  id: 1;
  business_name: string;
  business_type: string;
  business_currency: string;
  business_currency_symbol: string;
  business_country: string;
  business_phone: string;
  business_address: string;
  business_email: string;
  business_logo: string;
  tax_enabled: number;
  tax_rate_percent: number;
  tax_inclusive: number;
  tax_apply_to_purchases: number;
  inventory_low_stock_threshold: number;
  inventory_allow_negative_stock: number;
  inventory_valuation: 'cost' | 'selling';
  receipt_prefix: string;
  receipt_next_number: number;
  receipt_footer: string;
  receipt_show_tax: number;
  receipt_show_logo: number;
  security_mode: LockMode;
  security_has_pin_set: number;
  security_auto_lock: number;
  security_timeout_minutes: number;
  notifications_low_stock_alerts: number;
  notifications_out_of_stock_alerts: number;
  notifications_backup_reminders: number;
  onboarding_complete: number;
}

function mapRowToAppSettings(row: AppSettingsRow): AppSettings {
  return {
    business: {
      name: row.business_name,
      type: row.business_type,
      currency: row.business_currency as BusinessSettings['currency'],
      currencySymbol: row.business_currency_symbol,
      country: row.business_country,
      phone: row.business_phone,
      address: row.business_address,
      email: row.business_email,
      logo: row.business_logo,
    },
    tax: {
      enabled: fromSqliteBool(row.tax_enabled),
      ratePercent: row.tax_rate_percent,
      inclusive: fromSqliteBool(row.tax_inclusive),
      applyToPurchases: fromSqliteBool(row.tax_apply_to_purchases),
    },
    inventory: {
      lowStockThreshold: row.inventory_low_stock_threshold,
      allowNegativeStock: fromSqliteBool(row.inventory_allow_negative_stock),
      valuation: row.inventory_valuation,
    },
    receipt: {
      prefix: row.receipt_prefix,
      nextNumber: row.receipt_next_number,
      footer: row.receipt_footer,
      showTax: fromSqliteBool(row.receipt_show_tax),
      showLogo: fromSqliteBool(row.receipt_show_logo),
    },
    security: {
      mode: row.security_mode,
      hasPinSet: fromSqliteBool(row.security_has_pin_set),
      autoLock: fromSqliteBool(row.security_auto_lock),
      timeoutMinutes: row.security_timeout_minutes,
    },
    notifications: {
      lowStockAlerts: fromSqliteBool(row.notifications_low_stock_alerts),
      outOfStockAlerts: fromSqliteBool(row.notifications_out_of_stock_alerts),
      backupReminders: fromSqliteBool(row.notifications_backup_reminders),
    },
  };
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AppSettingsRow>(`SELECT * FROM app_settings WHERE id = 1`);
  if (!row) throw new Error('app_settings singleton row is missing — migration 001 should have seeded it');
  return mapRowToAppSettings(row);
}

export async function updateBusinessSettings(patch: BusinessSettings): Promise<AppSettings> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE app_settings SET business_name = ?, business_type = ?, business_currency = ?, business_currency_symbol = ?,
     business_country = ?, business_phone = ?, business_address = ?, business_email = ?, business_logo = ? WHERE id = 1`,
    [patch.name, patch.type, patch.currency, patch.currencySymbol, patch.country, patch.phone, patch.address, patch.email, patch.logo]
  );
  return getSettings();
}

export async function updateTaxSettings(patch: TaxSettings): Promise<AppSettings> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE app_settings SET tax_enabled = ?, tax_rate_percent = ?, tax_inclusive = ?, tax_apply_to_purchases = ? WHERE id = 1`, [
    toSqliteBool(patch.enabled),
    patch.ratePercent,
    toSqliteBool(patch.inclusive),
    toSqliteBool(patch.applyToPurchases),
  ]);
  return getSettings();
}

export async function updateInventorySettings(patch: InventorySettings): Promise<AppSettings> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE app_settings SET inventory_low_stock_threshold = ?, inventory_allow_negative_stock = ?, inventory_valuation = ? WHERE id = 1`, [
    patch.lowStockThreshold,
    toSqliteBool(patch.allowNegativeStock),
    patch.valuation,
  ]);
  return getSettings();
}

export async function updateReceiptSettings(patch: ReceiptSettings): Promise<AppSettings> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE app_settings SET receipt_prefix = ?, receipt_next_number = ?, receipt_footer = ?, receipt_show_tax = ?, receipt_show_logo = ? WHERE id = 1`, [
    patch.prefix,
    patch.nextNumber,
    patch.footer,
    toSqliteBool(patch.showTax),
    toSqliteBool(patch.showLogo),
  ]);
  return getSettings();
}

/** No `pin` field exists on SecuritySettings (see this project's Settings
 * phase decision) — only whether one has been set, so there is nothing
 * to strip here; the column is simply never in this statement. */
export async function updateSecuritySettings(patch: SecuritySettings): Promise<AppSettings> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE app_settings SET security_mode = ?, security_has_pin_set = ?, security_auto_lock = ?, security_timeout_minutes = ? WHERE id = 1`, [
    patch.mode,
    toSqliteBool(patch.hasPinSet),
    toSqliteBool(patch.autoLock),
    patch.timeoutMinutes,
  ]);
  return getSettings();
}

export async function updateNotificationSettings(patch: NotificationSettings): Promise<AppSettings> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE app_settings SET notifications_low_stock_alerts = ?, notifications_out_of_stock_alerts = ?, notifications_backup_reminders = ? WHERE id = 1`, [
    toSqliteBool(patch.lowStockAlerts),
    toSqliteBool(patch.outOfStockAlerts),
    toSqliteBool(patch.backupReminders),
  ]);
  return getSettings();
}

export async function isOnboardingComplete(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ onboarding_complete: number }>(`SELECT onboarding_complete FROM app_settings WHERE id = 1`);
  return fromSqliteBool(row?.onboarding_complete ?? 0);
}

export async function setOnboardingComplete(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE app_settings SET onboarding_complete = 1 WHERE id = 1`);
}
