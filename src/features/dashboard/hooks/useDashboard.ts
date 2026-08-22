/**
 * web: useEffect(() => { setTimeout(() => setLoading(false), 420) }, [])
 * — the same artificial 420ms load delay is preserved here so the loading
 * skeleton is actually reachable/visible, matching the source exactly.
 *
 * DashboardScreen -> useDashboard -> DashboardSummary -> (today)
 * getMockDashboardSummary() / (future) DashboardRepository.getSummary().
 * The screen only ever sees `status` + `summary` — swapping the data
 * source later doesn't change this hook's return shape.
 */
import { useCallback, useEffect, useState } from 'react';
import { getMockDashboardSummary } from '../data/mockDashboardSummary';
import type { DashboardStatus, DashboardSummary } from '../types';

const LOAD_DELAY_MS = 420;

export function useDashboard() {
  const [status, setStatus] = useState<DashboardStatus>('loading');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // `status` already starts 'loading' (initial useState value) for the
  // first run; `refetch` below sets it back to 'loading' itself before
  // bumping reloadToken, so the effect never needs to setState synchronously
  // in its own body — avoids the setState-in-effect cascading-render issue.
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = getMockDashboardSummary();
      setSummary(data);
      setStatus(data.productCount === 0 ? 'empty' : 'ready');
    }, LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  return { status, summary, refetch };
}
