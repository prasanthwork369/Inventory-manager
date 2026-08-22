/**
 * Ported from the web reference's Categories.tsx local `categories`
 * (via useStore), `editing`/`removing`/`error` state and its `open`/
 * `save` functions. The web keeps the whole feature (list + add/edit +
 * delete) in one component with no sub-hooks — this hook mirrors that
 * single-surface shape rather than splitting into several, matching the
 * source's own structure.
 *
 * CategoriesScreen -> this hook -> Category domain types ->
 * categoriesProvider.ts (temporary today, a repository later).
 */
import { useCallback, useEffect, useState } from 'react';
import {
  archiveCategory,
  createCategory,
  getCategories,
  isCategoryNameTaken,
  updateCategory,
} from '../data/categoriesProvider';
import { DEFAULT_CATEGORY_ICON } from '../constants';
import type { CategoryWithProductCount } from '../types';

export type CategoriesStatus = 'loading' | 'error' | 'ready';

interface CategoryDraft {
  id: string;
  name: string;
  icon: string;
  description: string;
}

function blankDraft(): CategoryDraft {
  return { id: `cat-${Date.now()}`, name: '', icon: DEFAULT_CATEGORY_ICON, description: '' };
}

function draftFromCategory(category: CategoryWithProductCount): CategoryDraft {
  return { id: category.id, name: category.name, icon: category.icon, description: category.description ?? '' };
}

export function useCategories() {
  const [status, setStatus] = useState<CategoriesStatus>('loading');
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [editingDraft, setEditingDraft] = useState<CategoryDraft | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [removingCategory, setRemovingCategory] = useState<CategoryWithProductCount | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((list) => {
        if (cancelled) return;
        setCategories(list);
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

  const isEditingExisting = editingDraft ? categories.some((c) => c.id === editingDraft.id) : false;

  const openCreate = useCallback(() => {
    setEditingDraft(blankDraft());
    setFormError('');
  }, []);

  const openEdit = useCallback((category: CategoryWithProductCount) => {
    setEditingDraft(draftFromCategory(category));
    setFormError('');
  }, []);

  const closeEditor = useCallback(() => {
    setEditingDraft(null);
    setFormError('');
  }, []);

  const updateDraftField = useCallback(<K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) => {
    setEditingDraft((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!editingDraft) return false;
    const trimmedName = editingDraft.name.trim();
    if (!trimmedName) {
      setFormError('Give the category a name.');
      return false;
    }
    const taken = await isCategoryNameTaken(trimmedName, editingDraft.id);
    if (taken) {
      setFormError('A category with this name already exists.');
      return false;
    }

    setSaving(true);
    const input = { name: trimmedName, icon: editingDraft.icon, description: editingDraft.description.trim() || null };
    if (isEditingExisting) {
      await updateCategory(editingDraft.id, input);
    } else {
      await createCategory(input);
    }
    setSaving(false);
    setEditingDraft(null);
    setFormError('');
    return true;
  }, [editingDraft, isEditingExisting]);

  const openRemove = useCallback((category: CategoryWithProductCount) => setRemovingCategory(category), []);
  const closeRemove = useCallback(() => setRemovingCategory(null), []);

  const confirmArchive = useCallback(async () => {
    if (!removingCategory) return;
    setArchiving(true);
    await archiveCategory(removingCategory.id);
    setArchiving(false);
    setRemovingCategory(null);
  }, [removingCategory]);

  return {
    status,
    categories,
    refetch,
    editingDraft,
    isEditingExisting,
    formError,
    saving,
    openCreate,
    openEdit,
    closeEditor,
    updateDraftField,
    save,
    removingCategory,
    archiving,
    openRemove,
    closeRemove,
    confirmArchive,
  };
}
