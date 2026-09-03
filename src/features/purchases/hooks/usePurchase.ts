/**
 * Ported from the web reference's PurchaseDetail.tsx: finds the purchase
 * by id, plus its "Stock impact" (`movements.filter(m => m.reference ===
 * purchase.ref)`). Reads Stock's own getMovements for that — a read-only,
 * one-directional dependency (Purchases -> Stock), same shape as
 * Categories reading Products. Stock's filter contract has no
 * "reference" field (it wasn't needed for Stock's own screens), so this
 * fetches the small full movement list and matches the reference exactly
 * client-side rather than extending Stock's types for one caller.
 */
import { useCallback, useEffect, useState } from 'react';
import { getMovements } from '@/features/stock/data/stockProvider';
import type { StockMovement } from '@/features/stock/types';
import { getPurchaseById } from '../data/purchasesProvider';
import type { Purchase } from '../types';

export type PurchaseDetailStatus = 'loading' | 'error' | 'ready';

export function usePurchase(id: string) {
  const [status, setStatus] = useState<PurchaseDetailStatus>('loading');
  const [purchase, setPurchase] = useState<Purchase | undefined>(undefined);
  const [stockImpact, setStockImpact] = useState<StockMovement[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPurchaseById(id)
      .then(async (found) => {
        if (cancelled) return;
        setPurchase(found);
        if (found) {
          const allMovements = await getMovements({ query: '', type: 'all', productId: 'all', rangeDays: 'all' });
          if (cancelled) return;
          setStockImpact(allMovements.filter((m) => m.reference === found.reference));
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  return { status, purchase, stockImpact, refetch };
}
