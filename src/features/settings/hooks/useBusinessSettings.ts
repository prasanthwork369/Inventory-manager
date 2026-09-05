/**
 * Ported from the web reference's BusinessSettings: seeds local form
 * state from the current settings, validates + saves back on demand.
 */
import { useCallback, useEffect, useState } from 'react';
import { CURRENCY_SYMBOLS } from '@/features/onboarding/constants';
import type { CurrencyCode } from '@/features/onboarding/types';
import { getSettings, updateSettings } from '../data/settingsProvider';
import { validateBusinessName } from '../utils/validation';
import type { BusinessSettings } from '../types';

export type BusinessSettingsStatus = 'loading' | 'error' | 'ready';

export function useBusinessSettings() {
  const [status, setStatus] = useState<BusinessSettingsStatus>('loading');
  const [form, setForm] = useState<BusinessSettings | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setForm(s.business);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback(<K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  // web: changing currency also updates the derived symbol in one step.
  const updateCurrency = useCallback((currency: CurrencyCode) => {
    setForm((current) => (current ? { ...current, currency, currencySymbol: CURRENCY_SYMBOLS[currency] } : current));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!form) return false;
    const validationError = validateBusinessName(form.name);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setError('');
    setSaving(true);
    const trimmed = { ...form, name: form.name.trim() };
    await updateSettings({ business: trimmed });
    setForm(trimmed);
    setSaving(false);
    return true;
  }, [form]);

  return { status, form, updateField, updateCurrency, error, saving, save };
}
