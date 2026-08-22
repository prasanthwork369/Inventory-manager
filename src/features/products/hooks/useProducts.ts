/**
 * List/filter/sort view-model for ProductListScreen, ported from the web
 * reference's ProductList.tsx local state + derived `results`/`brands`/
 * `activeFilters`. ProductsScreen -> this hook -> Product domain types ->
 * productsProvider (temporary today, a repository later) — the screen
 * never touches the provider directly.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategories, getProducts } from '../data/productsProvider';
import type { Product, ProductCategoryOption, ProductFilters } from '../types';
import { getStockStatus } from '../utils/stockStatus';

export type ProductsStatus = 'loading' | 'error' | 'ready';

const DEFAULT_FILTERS: ProductFilters = { query: '', categoryId: 'all', brand: 'all', status: 'all', sort: 'name' };

export function useProducts() {
  const [status, setStatus] = useState<ProductsStatus>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        if (cancelled) return;
        setProducts(productList);
        setCategories(categoryList);
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

  // web: [...new Set(products.map(p => p.brand))].sort()
  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)));
    return [...set].sort();
  }, [products]);

  const updateFilters = useCallback((patch: Partial<ProductFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q) {
        const haystack = `${p.name} ${p.sku} ${p.barcode ?? ''} ${p.brand ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.categoryId !== 'all' && p.categoryId !== filters.categoryId) return false;
      if (filters.brand !== 'all' && p.brand !== filters.brand) return false;
      if (filters.status !== 'all' && getStockStatus(p) !== filters.status) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (filters.sort === 'stock') return a.currentStock - b.currentStock;
      if (filters.sort === 'price') return b.sellingPriceMinor - a.sellingPriceMinor;
      if (filters.sort === 'recent') return b.createdAt.localeCompare(a.createdAt);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [products, filters]);

  // web: activeFilters counts category/brand/supplier/status; supplier is
  // dropped (no supplierId on Product here), so 3 not 4.
  const activeFilterCount = [filters.categoryId, filters.brand, filters.status].filter((v) => v !== 'all').length;

  return {
    status,
    products,
    categories,
    brands,
    filters,
    updateFilters,
    resetFilters,
    filteredProducts,
    activeFilterCount,
    refetch,
  };
}
