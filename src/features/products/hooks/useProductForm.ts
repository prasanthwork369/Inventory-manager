/**
 * Ported from the web reference's ProductForm.tsx local `form`/`errors`/
 * `saving`/`success` state and its `set`/`validate`/`submit` functions.
 * Price/stock fields are kept as raw strings in the draft (what the user
 * is actively typing) and only parsed to minor-unit integers at
 * validate/submit time — presentation JSX never does that conversion.
 *
 * Navigation and toast are left to the screen (same pattern as
 * onboarding's useOnboarding) — this hook only owns draft state,
 * validation and the save call.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategories, getProductById, isBarcodeTaken, isSkuTaken, createProduct, updateProduct } from '../data/productsProvider';
import type { CreateProductInput, Product, ProductCategoryOption } from '../types';
import { toMinorUnits } from '../utils/money';
import { validateProductDraft, type ProductFormErrors } from '../utils/validation';

export interface ProductFormDraft {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brand: string;
  purchasePriceInput: string;
  sellingPriceInput: string;
  openingStockInput: string;
  minimumStockInput: string;
  location: string;
  description: string;
}

const EMPTY_DRAFT: ProductFormDraft = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  brand: '',
  purchasePriceInput: '',
  sellingPriceInput: '',
  openingStockInput: '',
  minimumStockInput: '5',
  location: '',
  description: '',
};

function productToDraft(product: Product): ProductFormDraft {
  return {
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? '',
    categoryId: product.categoryId ?? '',
    brand: product.brand ?? '',
    purchasePriceInput: product.purchasePriceMinor ? String(product.purchasePriceMinor / 100) : '',
    sellingPriceInput: product.sellingPriceMinor ? String(product.sellingPriceMinor / 100) : '',
    openingStockInput: '',
    minimumStockInput: String(product.minimumStock),
    location: product.location ?? '',
    description: product.description ?? '',
  };
}

export function useProductForm(productId?: string) {
  const isEdit = Boolean(productId);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [draft, setDraft] = useState<ProductFormDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);

  useEffect(() => {
    getCategories().then((list) => {
      setCategories(list);
      setDraft((current) => (current.categoryId ? current : { ...current, categoryId: list[0]?.id ?? '' }));
    });
  }, []);

  useEffect(() => {
    // loadingExisting's initial useState value is already `isEdit`
    // (true when productId is set, false otherwise), so this effect never
    // needs to set it synchronously on its own first run.
    if (!productId) return;
    let cancelled = false;
    getProductById(productId).then((found) => {
      if (cancelled) return;
      if (found) {
        setExistingProduct(found);
        setDraft(productToDraft(found));
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setLoadingExisting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const updateField = useCallback(<K extends keyof ProductFormDraft>(key: K, value: ProductFormDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  // web: form.price > 0 && form.costPrice > 0 && form.price > form.costPrice -> margin banner
  const marginPreview = useMemo(() => {
    const sellingMinor = toMinorUnits(draft.sellingPriceInput || '0');
    const costMinor = toMinorUnits(draft.purchasePriceInput || '0');
    if (sellingMinor > 0 && costMinor > 0 && sellingMinor > costMinor) {
      const marginMinor = sellingMinor - costMinor;
      return { marginMinor, percent: Math.round((marginMinor / sellingMinor) * 100) };
    }
    return null;
  }, [draft.sellingPriceInput, draft.purchasePriceInput]);

  const submit = useCallback(async (): Promise<{ success: boolean; product?: Product }> => {
    const [skuTaken, barcodeTaken] = await Promise.all([
      isSkuTaken(draft.sku.trim(), existingProduct?.id),
      draft.barcode.trim() ? isBarcodeTaken(draft.barcode.trim(), existingProduct?.id) : Promise.resolve(false),
    ]);
    const nextErrors = validateProductDraft(draft, { isEdit, skuTaken, barcodeTaken });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return { success: false };

    setSaving(true);
    const input: CreateProductInput = {
      name: draft.name.trim(),
      sku: draft.sku.trim().toUpperCase(),
      barcode: draft.barcode.trim() || null,
      brand: draft.brand.trim() || null,
      location: draft.location.trim() || null,
      categoryId: draft.categoryId || null,
      unitId: existingProduct?.unitId ?? null,
      purchasePriceMinor: toMinorUnits(draft.purchasePriceInput || '0'),
      sellingPriceMinor: toMinorUnits(draft.sellingPriceInput || '0'),
      minimumStock: Number(draft.minimumStockInput || '0'),
      openingStock: Number(draft.openingStockInput || '0'),
      description: draft.description.trim() || null,
    };

    const result = isEdit && existingProduct ? await updateProduct(existingProduct.id, input) : await createProduct(input);
    setSaving(false);
    setSavedProduct(result);
    if (!isEdit) setSuccess(true);
    return { success: true, product: result };
  }, [draft, isEdit, existingProduct]);

  const resetForCreateAnother = useCallback(() => {
    setSuccess(false);
    setDraft((current) => ({
      ...EMPTY_DRAFT,
      categoryId: current.categoryId,
      brand: current.brand,
      location: current.location,
      minimumStockInput: current.minimumStockInput,
    }));
    setErrors({});
  }, []);

  return {
    isEdit,
    loading: loadingExisting,
    notFound,
    draft,
    errors,
    updateField,
    categories,
    currentStock: existingProduct?.currentStock ?? null,
    marginPreview,
    saving,
    success,
    savedProduct,
    submit,
    resetForCreateAnother,
  };
}
