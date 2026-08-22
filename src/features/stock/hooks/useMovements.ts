/**
 * View-model for MovementsScreen, direct port of Movements.tsx's local
 * filter state + derived `results`/`grouped`. One deliberate architecture
 * change from the web: the web holds the full movements array in
 * StoreContext and filters it client-side with useMemo; here, filters are
 * passed to stockProvider.getMovements(filters) instead, per the "don't
 * require loading the entire future movement table into JS" requirement
 * — the *rendered result* is identical, only where the filtering happens
 * differs. `status` only flips to 'loading' on first mount / explicit
 * refetch(), not on every filter change, so typing in the search field
 * doesn't flash a skeleton (getMovements' query delay is a few ms).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProducts } from '@/features/products/data/productsProvider';
import type { Product } from '@/features/products/types';
import { getMovements } from '../data/stockProvider';
import type { StockMovement, StockMovementFilters } from '../types';
import { dateLabel } from '../utils/format';

export type MovementsStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: StockMovementFilters = { query: '', type: 'all', productId: 'all', rangeDays: 'all' };

export function useMovements() {
  const [status, setStatus] = useState<MovementsStatus>('loading');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<StockMovementFilters>(DEFAULT_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selected, setSelected] = useState<StockMovement | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProducts().then((list) => {
      if (!cancelled) setProducts(list);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    getMovements(filters)
      .then((list) => {
        if (cancelled) return;
        setMovements(list);
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

  const updateFilters = useCallback((patch: Partial<StockMovementFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  // web: the filter sheet's own "Reset" only clears type/product/range,
  // leaving the search query untouched.
  const resetFilterFields = useCallback(() => {
    setFilters((current) => ({ ...current, type: 'all', productId: 'all', rangeDays: 'all' }));
  }, []);

  // web: the empty-state's "Clear filters" action clears everything,
  // including the search query — a distinct, wider reset.
  const clearAllFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = [filters.type, filters.productId, filters.rangeDays].filter((v) => v !== 'all').length;

  const groupedMovements = useMemo(() => {
    const map = new Map<string, StockMovement[]>();
    movements.forEach((m) => {
      const key = dateLabel(m.createdAt);
      map.set(key, [...(map.get(key) ?? []), m]);
    });
    return [...map.entries()];
  }, [movements]);

  return {
    status,
    movements,
    products,
    filters,
    updateFilters,
    resetFilterFields,
    clearAllFilters,
    activeFilterCount,
    groupedMovements,
    refetch,
    filterSheetOpen,
    setFilterSheetOpen,
    selected,
    setSelected,
  };
}
