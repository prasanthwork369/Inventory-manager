import { useCallback, useEffect, useState } from 'react';
import { getSettings } from '../data/settingsProvider';
import type { AppSettings } from '../types';

export type SettingsHomeStatus = 'loading' | 'error' | 'ready';

export function useSettingsHome() {
  const [status, setStatus] = useState<SettingsHomeStatus>('loading');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  return { status, settings, refetch };
}
