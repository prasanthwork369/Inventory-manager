/**
 * Ported from the web reference's PurchasesHome.tsx: local `range`/
 * `query`/`supplier`/`status` filter state plus the summary metrics
 * (today/month/outstanding), which the web derives from the full,
 * unfiltered `purchases` array — kept as a separate fetch here
 * (getPurchaseListSummary) rather than computed from the filtered
 * `purchases` state, matching that same independence.
 */
import { useCallback, useEffect, useState } from 'react';
import { getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import type { Supplier } from '@/features/suppliers/types';
import { getPurchaseListSummary, getPurchases } from '../data/purchasesProvider';
import type { Purchase, PurchaseFilters, PurchaseListSummary } from '../types';

export type PurchasesStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: PurchaseFilters = { query: '', rangeDays: 30, supplierId: 'all', paymentStatus: 'all' };

export function usePurchases() {
  const [status, setStatus] = useState<PurchasesStatus>('loading');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<PurchaseListSummary | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<PurchaseFilters>(DEFAULT_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSuppliers(), getPurchaseListSummary()]).then(([supplierList, listSummary]) => {
      if (cancelled) return;
      setSuppliers(supplierList);
      setSummary(listSummary);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getPurchases(filters)
      .then((list) => {
        if (cancelled) return;
        setPurchases(list);
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

  const updateFilters = useCallback((patch: Partial<PurchaseFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  return { status, purchases, summary, suppliers, filters, updateFilters, refetch };
}
