/**
 * Ported from the web reference's NewPurchase.tsx: local `lines`/
 * `supplierId`/`discount`/`paymentStatus`/`notes` state and its
 * validate()/commit() flow. Line qty/cost are kept as raw input strings
 * (RN TextInput has no native numeric type) and parsed only at
 * calculation/submit time via parseQuantity (reused from Stock, per the
 * "one quantity representation" rule) and toMinorUnits — the web keeps
 * them as live numbers directly since <input type="number"> does that
 * natively; the parsed *values* behave identically either way.
 */
import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '@/features/products/data/productsProvider';
import type { Product } from '@/features/products/types';
import { minorUnitsToInputString, toMinorUnits } from '@/features/products/utils/money';
import { getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import type { Supplier } from '@/features/suppliers/types';
import { parseQuantity } from '@/features/stock/utils/quantity';
import { createPurchase } from '../data/purchasesProvider';
import { calculatePurchaseTotals } from '../utils/calculations';
import type { Purchase, PurchasePaymentStatus } from '../types';

export type NewPurchaseStatus = 'loading' | 'error' | 'ready';

export interface PurchaseLineDraft {
  productId: string;
  productName: string;
  quantityInput: string;
  unitCostInput: string;
}

export function useNewPurchase() {
  const [status, setStatus] = useState<NewPurchaseStatus>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<PurchaseLineDraft[]>([]);
  const [discountInput, setDiscountInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>('Paid');
  const [notes, setNotes] = useState('');
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<Purchase | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getSuppliers()])
      .then(([productList, supplierList]) => {
        if (cancelled) return;
        setProducts(productList);
        setSuppliers(supplierList);
        setSupplierId((current) => current || supplierList[0]?.id || '');
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

  const parsedLines = lines.map((l) => ({
    ...l,
    quantity: parseQuantity(l.quantityInput),
    unitCostMinor: toMinorUnits(l.unitCostInput),
  }));
  const discountMinor = toMinorUnits(discountInput);
  const totals = calculatePurchaseTotals(parsedLines, discountMinor);

  const addProduct = useCallback((product: Product) => {
    setLines((current) => {
      const existing = current.find((l) => l.productId === product.id);
      if (existing) {
        return current.map((l) =>
          l.productId === product.id ? { ...l, quantityInput: String(parseQuantity(l.quantityInput) + 1) } : l
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          productName: product.name,
          quantityInput: '1',
          unitCostInput: minorUnitsToInputString(product.purchasePriceMinor),
        },
      ];
    });
  }, []);

  const updateLine = useCallback((productId: string, patch: Partial<Pick<PurchaseLineDraft, 'quantityInput' | 'unitCostInput'>>) => {
    setLines((current) => current.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((current) => current.filter((l) => l.productId !== productId));
  }, []);

  const requestReview = () => {
    if (!supplierId) {
      setError('Choose a supplier for this purchase.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one product to this purchase.');
      return;
    }
    if (parsedLines.some((l) => l.quantity <= 0)) {
      setError('Every product needs a quantity greater than zero.');
      return;
    }
    if (parsedLines.some((l) => l.unitCostMinor < 0)) {
      setError('Cost price cannot be negative.');
      return;
    }
    setError('');
    setReview(true);
  };

  const commit = useCallback(async () => {
    setReview(false);
    setProcessing(true);
    try {
      const purchase = await createPurchase({
        supplierId,
        items: parsedLines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCostMinor: l.unitCostMinor })),
        discountMinor,
        paymentStatus,
        notes,
      });
      setProcessing(false);
      setDone(purchase);
      return purchase;
    } catch {
      setProcessing(false);
      setError('Something went wrong recording this purchase. Try again.');
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, lines, discountInput, paymentStatus, notes]);

  return {
    status,
    refetch,
    products,
    suppliers,
    supplierId,
    setSupplierId,
    lines: parsedLines,
    addProduct,
    updateLine,
    removeLine,
    discountInput,
    setDiscountInput,
    discountMinor,
    paymentStatus,
    setPaymentStatus,
    notes,
    setNotes,
    picker,
    setPicker,
    error,
    totals,
    review,
    setReview,
    processing,
    done,
    requestReview,
    commit,
  };
}
