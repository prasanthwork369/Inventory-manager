/**
 * Ported from the web reference's PartyList.tsx (kind="supplier"): local
 * `query`/`editing`/`error` state and its `save`/`blank` functions.
 *
 * Note on scope: the web's `save()` upserts by id, but the only place
 * `editing` is ever set is `setEditing(blank())` — there is no "edit an
 * existing supplier" entry point anywhere in the web source (no edit
 * button on the list row or the detail screen), only create + delete.
 * This hook preserves that exact behavior rather than adding an edit flow
 * the source doesn't have — `openCreate` is the only way to open the
 * sheet, always with a blank draft.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupplier, getSuppliers, isSupplierPhoneTaken } from '../data/suppliersProvider';
import type { Supplier } from '../types';

export type SuppliersStatus = 'loading' | 'error' | 'ready';

interface SupplierDraft {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function blankDraft(): SupplierDraft {
  return { name: '', phone: '', email: '', address: '', notes: '' };
}

export function useSuppliers() {
  const [status, setStatus] = useState<SuppliersStatus>('loading');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [query, setQuery] = useState('');
  const [editingDraft, setEditingDraft] = useState<SupplierDraft | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSuppliers()
      .then((list) => {
        if (cancelled) return;
        setSuppliers(list);
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

  const filteredSuppliers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => `${s.name} ${s.phone} ${s.email}`.toLowerCase().includes(q));
  }, [suppliers, query]);

  const openCreate = useCallback(() => {
    setEditingDraft(blankDraft());
    setFormError('');
  }, []);

  const closeEditor = useCallback(() => {
    setEditingDraft(null);
    setFormError('');
  }, []);

  const updateDraftField = useCallback(<K extends keyof SupplierDraft>(key: K, value: SupplierDraft[K]) => {
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
      const taken = await isSupplierPhoneTaken(editingDraft.phone);
      if (taken) {
        setFormError('Another contact already uses this phone number.');
        return false;
      }
    }

    setSaving(true);
    await createSupplier({ ...editingDraft, name: trimmedName });
    setSaving(false);
    setEditingDraft(null);
    setFormError('');
    return true;
  }, [editingDraft]);

  return {
    status,
    suppliers,
    refetch,
    query,
    setQuery,
    filteredSuppliers,
    editingDraft,
    formError,
    saving,
    openCreate,
    closeEditor,
    updateDraftField,
    save,
  };
}
