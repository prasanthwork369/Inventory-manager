/**
 * Ported from the web reference's PartyList.tsx (kind="customer") — see
 * suppliers/hooks/useSuppliers.ts's header for why there's no "edit an
 * existing contact" flow (the web itself never wires one up); the same
 * applies here.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createCustomer, getCustomers, isCustomerPhoneTaken } from '../data/customersProvider';
import type { Customer } from '../types';

export type CustomersStatus = 'loading' | 'error' | 'ready';

interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function blankDraft(): CustomerDraft {
  return { name: '', phone: '', email: '', address: '', notes: '' };
}

export function useCustomers() {
  const [status, setStatus] = useState<CustomersStatus>('loading');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [query, setQuery] = useState('');
  const [editingDraft, setEditingDraft] = useState<CustomerDraft | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCustomers()
      .then((list) => {
        if (cancelled) return;
        setCustomers(list);
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

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q));
  }, [customers, query]);

  const openCreate = useCallback(() => {
    setEditingDraft(blankDraft());
    setFormError('');
  }, []);

  const closeEditor = useCallback(() => {
    setEditingDraft(null);
    setFormError('');
  }, []);

  const updateDraftField = useCallback(<K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) => {
    setEditingDraft((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!editingDraft) return false;
    const trimmedName = editingDraft.name.trim();
    if (!trimmedName) {
      setFormError('Name is required.');
      return false;
    }
    if (editingDraft.phone) {
      const taken = await isCustomerPhoneTaken(editingDraft.phone);
      if (taken) {
        setFormError('Another contact already uses this phone number.');
        return false;
      }
    }

    setSaving(true);
    await createCustomer({ ...editingDraft, name: trimmedName });
    setSaving(false);
    setEditingDraft(null);
    setFormError('');
    return true;
  }, [editingDraft]);

  return {
    status,
    customers,
    refetch,
    query,
    setQuery,
    filteredCustomers,
    editingDraft,
    formError,
    saving,
    openCreate,
    closeEditor,
    updateDraftField,
    save,
  };
}
