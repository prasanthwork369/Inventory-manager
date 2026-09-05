import { useCallback, useEffect, useState } from 'react';
import { getProfitReport } from '../data/reportsProvider';
import type { ProfitReportView, ReportRangeDays } from '../types';

export type ProfitReportStatus = 'loading' | 'error' | 'ready';

export function useProfitReport() {
  const [status, setStatus] = useState<ProfitReportStatus>('loading');
  const [view, setView] = useState<ProfitReportView | null>(null);
  const [rangeDays, setRangeDays] = useState<ReportRangeDays>(30);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProfitReport(rangeDays)
      .then((v) => {
        if (cancelled) return;
        setView(v);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [rangeDays, reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  return { status, view, rangeDays, setRangeDays, refetch };
}
