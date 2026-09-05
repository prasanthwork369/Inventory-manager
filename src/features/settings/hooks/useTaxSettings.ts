import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../data/settingsProvider';
import { calculateTaxPreview } from '../utils/calculations';
import type { TaxSettings } from '../types';

export type TaxSettingsStatus = 'loading' | 'error' | 'ready';

const PREVIEW_SAMPLE_MINOR = 100000; // ₹1,000, matching the web's `sample = 1000`

export function useTaxSettings() {
  const [status, setStatus] = useState<TaxSettingsStatus>('loading');
  const [form, setForm] = useState<TaxSettings | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setForm(s.tax);
        setCurrencySymbol(s.business.currencySymbol);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback(<K extends keyof TaxSettings>(key: K, value: TaxSettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    await updateSettings({ tax: form });
    setSaving(false);
  }, [form]);

  const preview = form ? calculateTaxPreview(PREVIEW_SAMPLE_MINOR, form.ratePercent, form.enabled, form.inclusive) : null;

  return { status, form, updateField, currencySymbol, previewSampleMinor: PREVIEW_SAMPLE_MINOR, preview, saving, save };
}
