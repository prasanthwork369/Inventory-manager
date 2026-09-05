import { useCallback, useEffect, useState } from 'react';
import { getReportsHomeSummary } from '../data/reportsProvider';
import type { ReportsHomeSummary } from '../types';

export type ReportsHomeStatus = 'loading' | 'error' | 'ready';

export function useReportsHome() {
  const [status, setStatus] = useState<ReportsHomeStatus>('loading');
  const [summary, setSummary] = useState<ReportsHomeSummary | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getReportsHomeSummary()
      .then((s) => {
        if (cancelled) return;
        setSummary(s);
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

  return { status, summary, refetch };
}
