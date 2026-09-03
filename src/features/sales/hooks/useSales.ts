/**
 * Ported from the web reference's SalesHome.tsx: local `range`/`query`/
 * `method`/`customer` filter state, the day-grouped results, and the
 * summary metrics (today/week/month/paymentMix), which the web derives
 * from the full, unfiltered `sales` array — kept as a separate fetch
 * (getSaleListSummary) rather than computed from the filtered `sales`
 * state, matching that same independence.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCustomers } from '@/features/customers/data/customersProvider';
import type { Customer } from '@/features/customers/types';
import { getSaleListSummary, getSales } from '../data/salesProvider';
import type { Sale, SaleFilters, SaleListSummary } from '../types';
import { dateLabel } from '../utils/format';

export type SalesStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: SaleFilters = { query: '', rangeDays: 1, paymentMethod: 'all', customerId: 'all' };

export function useSales() {
  const [status, setStatus] = useState<SalesStatus>('loading');
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SaleListSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<SaleFilters>(DEFAULT_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCustomers(), getSaleListSummary()]).then(([customerList, listSummary]) => {
      if (cancelled) return;
      setCustomers(customerList);
      setSummary(listSummary);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getSales(filters)
      .then((list) => {
        if (cancelled) return;
        setSales(list);
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

  const updateFilters = useCallback((patch: Partial<SaleFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const groupedSales = useMemo(() => {
    const map = new Map<string, Sale[]>();
    sales.forEach((s) => {
      const key = dateLabel(s.createdAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    });
    return [...map.entries()];
  }, [sales]);

  return { status, sales, groupedSales, summary, customers, filters, updateFilters, refetch };
}
