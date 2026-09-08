/**
 * DashboardScreen -> this hook -> DashboardSummary -> dashboardProvider
 * (Database Stage 4: composes real Products/Sales/Purchases/Stock/
 * Settings data). The screen only ever sees `status` + `summary`.
 *
 * The artificial setTimeout this hook used while Dashboard's data was a
 * literal mock is gone — a real DB read already takes genuine async time,
 * so this now follows the same effect/.then/.catch shape every other
 * hook in the app uses.
 */
import { useCallback, useEffect, useState } from 'react';
import { getDashboardSummary } from '../data/dashboardProvider';
import type { DashboardStatus, DashboardSummary } from '../types';

export function useDashboard() {
  const [status, setStatus] = useState<DashboardStatus>('loading');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setStatus(data.productCount === 0 ? 'empty' : 'ready');
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
