import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../data/settingsProvider';
import type { NotificationSettings } from '../types';

export type NotificationSettingsStatus = 'loading' | 'error' | 'ready';

export function useNotificationSettings() {
  const [status, setStatus] = useState<NotificationSettingsStatus>('loading');
  const [form, setForm] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setForm(s.notifications);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback(<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    await updateSettings({ notifications: form });
    setSaving(false);
  }, [form]);

  return { status, form, updateField, saving, save };
}
