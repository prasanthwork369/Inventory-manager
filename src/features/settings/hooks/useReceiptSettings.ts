import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../data/settingsProvider';
import type { ReceiptSettings } from '../types';

export type ReceiptSettingsStatus = 'loading' | 'error' | 'ready';

export function useReceiptSettings() {
  const [status, setStatus] = useState<ReceiptSettingsStatus>('loading');
  const [form, setForm] = useState<ReceiptSettings | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setForm(s.receipt);
        setBusinessName(s.business.name);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback(<K extends keyof ReceiptSettings>(key: K, value: ReceiptSettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    await updateSettings({ receipt: form });
    setSaving(false);
  }, [form]);

  return { status, form, updateField, businessName, saving, save };
}
