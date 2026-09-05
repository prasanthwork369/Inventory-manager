/**
 * Ported from the web reference's Alerts.tsx: local `filter` state plus
 * the derived `items` list. `out`/`low` counts are tracked separately
 * from the full `alerts` list because the web's Segmented "All" label
 * only counts out+low (not anomalies) — a real, minor web quirk
 * preserved exactly rather than "fixed", since nothing in this phase
 * calls for correcting it.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAlerts } from '../data/alertsProvider';
import type { AlertFilter, InventoryAlert } from '../types';

export type AlertsStatus = 'loading' | 'error' | 'ready';

export function useAlerts() {
  const [status, setStatus] = useState<AlertsStatus>('loading');
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAlerts()
      .then((list) => {
        if (cancelled) return;
        setAlerts(list);
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

  const outCount = useMemo(() => alerts.filter((a) => a.kind === 'out-of-stock').length, [alerts]);
  const lowCount = useMemo(() => alerts.filter((a) => a.kind === 'low-stock').length, [alerts]);

  const items = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'out') return alerts.filter((a) => a.kind === 'out-of-stock');
    if (filter === 'low') return alerts.filter((a) => a.kind === 'low-stock');
    return alerts.filter((a) => a.kind === 'large-adjustment');
  }, [alerts, filter]);

  return { status, alerts, items, filter, setFilter, outCount, lowCount, refetch };
}
