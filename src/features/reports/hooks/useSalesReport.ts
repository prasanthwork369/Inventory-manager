import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '@/features/categories/data/categoriesProvider';
import type { CategoryWithProductCount } from '@/features/categories/types';
import { getCustomers } from '@/features/customers/data/customersProvider';
import type { Customer } from '@/features/customers/types';
import { getSalesReport } from '../data/reportsProvider';
import type { SalesReportFilters, SalesReportView } from '../types';

export type SalesReportStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: SalesReportFilters = { rangeDays: 7, categoryId: 'all', customerId: 'all', paymentMethod: 'all' };

export function useSalesReport() {
  const [status, setStatus] = useState<SalesReportStatus>('loading');
  const [view, setView] = useState<SalesReportView | null>(null);
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<SalesReportFilters>(DEFAULT_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCategories(), getCustomers()]).then(([categoryList, customerList]) => {
      if (cancelled) return;
      setCategories(categoryList);
      setCustomers(customerList);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getSalesReport(filters)
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

  const updateFilters = useCallback((patch: Partial<SalesReportFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  return { status, view, categories, customers, filters, updateFilters, refetch };
}
