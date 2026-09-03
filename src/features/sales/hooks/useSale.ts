/**
 * Ported from the web reference's SaleDetail.tsx: finds the sale by id,
 * plus its "Stock impact" (`movements.filter(m => m.reference ===
 * sale.receiptNo)`) and related returns. Stock impact reads Stock's own
 * getMovements — a read-only, one-directional dependency (Sales -> Stock),
 * same shape as Purchases -> Stock. Stock's filter contract has no
 * "reference" field, so this fetches the small full movement list and
 * matches exactly client-side rather than extending Stock's types for
 * one caller (same reasoning as purchases/hooks/usePurchase.ts).
 */
import { useCallback, useEffect, useState } from 'react';
import { getMovements } from '@/features/stock/data/stockProvider';
import type { StockMovement } from '@/features/stock/types';
import { getReturnsForSale, getSaleById } from '../data/salesProvider';
import type { Sale, SaleReturn } from '../types';

export type SaleDetailStatus = 'loading' | 'error' | 'ready';

export function useSale(id: string) {
  const [status, setStatus] = useState<SaleDetailStatus>('loading');
  const [sale, setSale] = useState<Sale | undefined>(undefined);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [stockImpact, setStockImpact] = useState<StockMovement[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSaleById(id)
      .then(async (found) => {
        if (cancelled) return;
        setSale(found);
        if (found) {
          const [relatedReturns, allMovements] = await Promise.all([
            getReturnsForSale(found.id),
            getMovements({ query: '', type: 'all', productId: 'all', rangeDays: 'all' }),
          ]);
          if (cancelled) return;
          setReturns(relatedReturns);
          setStockImpact(allMovements.filter((m) => m.reference === found.receiptNo));
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

  return { status, sale, returns, stockImpact, refetch };
}
