/**
 * Ported from the web reference's PartyDetail.tsx (kind="supplier"):
 * finds the party by id, plus its `confirm` delete-dialog state. Also
 * fetches the party's SupplierDetailSummary (purchase/outstanding
 * figures) — a separate view-only aggregate from the Supplier entity
 * itself, always zero today since Purchases/the credit ledger don't
 * exist yet. "Products supplied" isn't sourced here either — Product has
 * no supplierId (a deliberate schema decision from the Products phase)
 * — see SupplierDetailScreen for how that's rendered honestly.
 */
import { useCallback, useEffect, useState } from 'react';
import { archiveSupplier, getSupplierById, getSupplierDetailSummary } from '../data/suppliersProvider';
import type { Supplier, SupplierDetailSummary } from '../types';

export type SupplierDetailStatus = 'loading' | 'error' | 'ready';

export function useSupplier(id: string) {
  const [status, setStatus] = useState<SupplierDetailStatus>('loading');
  const [supplier, setSupplier] = useState<Supplier | undefined>(undefined);
  const [summary, setSummary] = useState<SupplierDetailSummary | undefined>(undefined);
  const [reloadToken, setReloadToken] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSupplierById(id), getSupplierDetailSummary(id)])
      .then(([found, foundSummary]) => {
        if (cancelled) return;
        setSupplier(found);
        setSummary(foundSummary);
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

  const confirmArchive = useCallback(async () => {
    if (!supplier) return;
    setArchiving(true);
    await archiveSupplier(supplier.id);
    setArchiving(false);
    setConfirmOpen(false);
  }, [supplier]);

  return { status, supplier, summary, refetch, confirmOpen, setConfirmOpen, archiving, confirmArchive };
}
