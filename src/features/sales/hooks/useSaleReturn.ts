/**
 * Ported from the web reference's ReturnSale.tsx: local `qtys`/`reason`/
 * `restock`/`notes` state and its commit() flow. Per-item max return
 * quantity is (sold - already returned across all prior returns for
 * this sale), not just the original sold quantity — see
 * utils/returns.ts for why that's a deliberate correction, not a
 * redesign.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getReturnsForSale, getSaleById, createSaleReturn } from '../data/salesProvider';
import { RETURN_REASONS } from '../constants';
import { calculateReturnRefund } from '../utils/calculations';
import { alreadyReturnedQuantity, maxReturnableQuantity } from '../utils/returns';
import type { Sale, SaleReturn } from '../types';

export type SaleReturnStatus = 'loading' | 'error' | 'ready';

export function useSaleReturn(saleId: string) {
  const [status, setStatus] = useState<SaleReturnStatus>('loading');
  const [sale, setSale] = useState<Sale | undefined>(undefined);
  const [existingReturns, setExistingReturns] = useState<SaleReturn[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [restock, setRestock] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<SaleReturn | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSaleById(saleId)
      .then(async (found) => {
        if (cancelled) return;
        setSale(found);
        if (found) {
          const returns = await getReturnsForSale(found.id);
          if (cancelled) return;
          setExistingReturns(returns);
        }
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [saleId, reloadToken]);

  const refetch = useCallback(() => {
    setStatus('loading');
    setReloadToken((t) => t + 1);
  }, []);

  const maxReturnable = useCallback(
    (productId: string, soldQuantity: number) => maxReturnableQuantity(soldQuantity, alreadyReturnedQuantity(existingReturns, saleId, productId)),
    [existingReturns, saleId]
  );

  const setQuantity = useCallback(
    (productId: string, next: number, max: number) => {
      setQuantities((current) => ({ ...current, [productId]: Math.min(Math.max(next, 0), max) }));
    },
    []
  );

  const selectedLines = useMemo(() => {
    if (!sale) return [];
    return sale.items
      .map((it) => ({ ...it, returnQuantity: quantities[it.productId] ?? 0 }))
      .filter((it) => it.returnQuantity > 0);
  }, [sale, quantities]);

  const refundMinor = useMemo(
    () =>
      calculateReturnRefund(
        selectedLines.map((it) => ({
          unitPriceMinor: it.unitPriceMinor,
          lineDiscountMinor: it.discountMinor,
          soldQuantity: it.quantity,
          returnQuantity: it.returnQuantity,
        }))
      ),
    [selectedLines]
  );

  const requestReview = () => {
    if (selectedLines.length === 0) {
      setError('Select at least one item and quantity to return.');
      return;
    }
    setError('');
    setReview(true);
  };

  const commit = useCallback(async (): Promise<SaleReturn | null> => {
    setReview(false);
    setProcessing(true);
    try {
      const record = await createSaleReturn({
        saleId,
        items: selectedLines.map((it) => ({ productId: it.productId, quantity: it.returnQuantity })),
        reason,
        restock,
      });
      setProcessing(false);
      setDone(record);
      return record;
    } catch {
      setProcessing(false);
      setError('Something went wrong recording this return. Try again.');
      return null;
    }
  }, [saleId, selectedLines, reason, restock]);

  return {
    status,
    refetch,
    sale,
    quantities,
    maxReturnable,
    setQuantity,
    reason,
    setReason,
    restock,
    setRestock,
    notes,
    setNotes,
    error,
    selectedLines,
    refundMinor,
    review,
    setReview,
    processing,
    done,
    requestReview,
    commit,
  };
}
