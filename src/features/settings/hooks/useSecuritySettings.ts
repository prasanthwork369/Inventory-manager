/**
 * Ported from the web reference's SecuritySettings. `pinInput` is local,
 * transient state — typed digits are validated here and then discarded;
 * only whether a PIN exists (`hasPinSet`) is ever written to the
 * settings provider (see types.ts for why).
 */
import { useCallback, useEffect, useState } from 'react';
import type { LockMode } from '@/features/onboarding/types';
import { getSettings, updateSettings } from '../data/settingsProvider';
import { validatePin } from '../utils/validation';
import type { SecuritySettings } from '../types';

export type SecuritySettingsStatus = 'loading' | 'error' | 'ready';

export function useSecuritySettings() {
  const [status, setStatus] = useState<SecuritySettingsStatus>('loading');
  const [form, setForm] = useState<SecuritySettings | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setForm(s.security);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((mode: LockMode) => {
    setForm((current) => (current ? { ...current, mode } : current));
  }, []);

  const setAutoLock = useCallback((autoLock: boolean) => {
    setForm((current) => (current ? { ...current, autoLock } : current));
  }, []);

  const setTimeoutMinutes = useCallback((timeoutMinutes: number) => {
    setForm((current) => (current ? { ...current, timeoutMinutes } : current));
  }, []);

  const updatePinInput = useCallback((raw: string) => {
    setPinInput(raw.replace(/\D/g, '').slice(0, 4));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!form) return false;
    const validationError = validatePin(form.mode, pinInput);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setError('');
    setSaving(true);
    const next: SecuritySettings = { ...form, hasPinSet: form.mode === 'pin' };
    await updateSettings({ security: next });
    setForm(next);
    setSaving(false);
    return true;
  }, [form, pinInput]);

  return { status, form, setMode, setAutoLock, setTimeoutMinutes, pinInput, updatePinInput, error, saving, save };
}
