import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '@/features/categories/data/categoriesProvider';
import type { CategoryWithProductCount } from '@/features/categories/types';
import { getInventoryReport } from '../data/reportsProvider';
import type { InventoryReportFilters, InventoryReportMode, InventoryReportView } from '../types';

export type InventoryReportStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: InventoryReportFilters = { query: '', categoryId: 'all' };

export function useInventoryReport(mode: InventoryReportMode) {
  const [status, setStatus] = useState<InventoryReportStatus>('loading');
  const [view, setView] = useState<InventoryReportView | null>(null);
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [filters, setFilters] = useState<InventoryReportFilters>(DEFAULT_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getInventoryReport(mode, filters)
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
  }, [mode, filters, reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  const updateFilters = useCallback((patch: Partial<InventoryReportFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return { status, view, categories, filters, updateFilters, clearFilters, refetch };
}
