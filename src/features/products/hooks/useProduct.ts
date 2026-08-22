/**
 * Single-product view-model for ProductDetailScreen. Ported from the web
 * reference's `products.find(p => p.id === id)` plus its "product no
 * longer exists" branch — that lookup is synchronous there (everything is
 * already in the in-memory store); here it goes through the async
 * provider boundary, with 'loading' as the state in between. Also
 * resolves the category name (web's `categoryName()` store helper).
 *
 * `archive` calls the provider's archiveProduct (isActive = false in the
 * future SQLite model), never a delete — see productsProvider.ts.
 */
import { useCallback, useEffect, useState } from 'react';
import { archiveProduct, getCategories, getProductById } from '../data/productsProvider';
import type { Product } from '../types';

export type ProductDetailStatus = 'loading' | 'not-found' | 'ready';

export function useProduct(id: string | undefined) {
  const [status, setStatus] = useState<ProductDetailStatus>(id ? 'loading' : 'not-found');
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getProductById(id), getCategories()]).then(([found, categories]) => {
      if (cancelled) return;
      if (found) {
        setProduct(found);
        setCategoryName(categories.find((c) => c.id === found.categoryId)?.name ?? null);
        setStatus('ready');
      } else {
        setStatus('not-found');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  const archive = useCallback(async () => {
    if (!id) return;
    setArchiving(true);
    await archiveProduct(id);
    setArchiving(false);
  }, [id]);

  return { status, product, categoryName, refetch, archive, archiving };
}
