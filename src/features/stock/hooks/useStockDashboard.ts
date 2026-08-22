/**
 * View-model for StockDashboardScreen, direct port of StockDashboard.tsx's
 * `useStore()` reads. StockDashboardScreen -> this hook -> Stock domain
 * types -> stockProvider (temporary today, a repository later).
 */
import { useCallback, useEffect, useState } from 'react';
import { getRecentMovements, getStockSummary } from '../data/stockProvider';
import type { StockMovement, StockSummary } from '../types';

export type StockDashboardStatus = 'loading' | 'error' | 'ready';

const RECENT_MOVEMENTS_LIMIT = 8;

export function useStockDashboard() {
  const [status, setStatus] = useState<StockDashboardStatus>('loading');
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStockSummary(), getRecentMovements(RECENT_MOVEMENTS_LIMIT)])
      .then(([s, m]) => {
        if (cancelled) return;
        setSummary(s);
        setRecentMovements(m);
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

  return { status, summary, recentMovements, refetch };
}
