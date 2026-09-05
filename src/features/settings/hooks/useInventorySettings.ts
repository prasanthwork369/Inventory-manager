import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../data/settingsProvider';
import type { InventorySettings } from '../types';

export type InventorySettingsStatus = 'loading' | 'error' | 'ready';

export function useInventorySettings() {
  const [status, setStatus] = useState<InventorySettingsStatus>('loading');
  const [form, setForm] = useState<InventorySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setForm(s.inventory);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback(<K extends keyof InventorySettings>(key: K, value: InventorySettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    await updateSettings({ inventory: form });
    setSaving(false);
  }, [form]);

  return { status, form, updateField, saving, save };
}
