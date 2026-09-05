import { useCallback, useEffect, useState } from 'react';
import { getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import type { Supplier } from '@/features/suppliers/types';
import { getPurchaseReport } from '../data/reportsProvider';
import type { PurchaseReportFilters, PurchaseReportView } from '../types';

export type PurchaseReportStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: PurchaseReportFilters = { rangeDays: 30, supplierId: 'all' };

export function usePurchaseReport() {
  const [status, setStatus] = useState<PurchaseReportStatus>('loading');
  const [view, setView] = useState<PurchaseReportView | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<PurchaseReportFilters>(DEFAULT_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSuppliers().then((list) => {
      if (!cancelled) setSuppliers(list);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getPurchaseReport(filters)
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
  }, [filters, reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  const updateFilters = useCallback((patch: Partial<PurchaseReportFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  return { status, view, suppliers, filters, updateFilters, refetch };
}
