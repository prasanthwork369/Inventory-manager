/**
 * Ported from the web reference's PartyDetail.tsx (kind="customer"):
 * finds the party by id, plus its `confirm` delete-dialog state. Also
 * fetches the party's CustomerDetailSummary (sales/outstanding figures)
 * — a separate view-only aggregate from the Customer entity itself,
 * always zero today since Sales/the credit ledger don't exist yet.
 */
import { useCallback, useEffect, useState } from 'react';
import { archiveCustomer, getCustomerById, getCustomerDetailSummary } from '../data/customersProvider';
import type { Customer, CustomerDetailSummary } from '../types';

export type CustomerDetailStatus = 'loading' | 'error' | 'ready';

export function useCustomer(id: string) {
  const [status, setStatus] = useState<CustomerDetailStatus>('loading');
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [summary, setSummary] = useState<CustomerDetailSummary | undefined>(undefined);
  const [reloadToken, setReloadToken] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCustomerById(id), getCustomerDetailSummary(id)])
      .then(([found, foundSummary]) => {
        if (cancelled) return;
        setCustomer(found);
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
    if (!customer) return;
    setArchiving(true);
    await archiveCustomer(customer.id);
    setArchiving(false);
    setConfirmOpen(false);
  }, [customer]);

  return { status, customer, summary, refetch, confirmOpen, setConfirmOpen, archiving, confirmArchive };
}
