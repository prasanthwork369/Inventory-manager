/**
 * View-model for the shared Stock In/Out/Adjust screen — one hook driving
 * all three modes, direct port of StockEntry.tsx's local state +
 * validate()/commit(), keyed on `mode` exactly like the web's single
 * component.
 */
import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '@/features/products/data/productsProvider';
import type { Product } from '@/features/products/types';
import { toMinorUnits } from '@/features/products/utils/money';
import { ALLOW_NEGATIVE_STOCK, STOCK_ADJUST_REASONS, STOCK_OUT_REASONS } from '../constants';
import { adjustStock, getStockSuppliers, stockIn, stockOut } from '../data/stockProvider';
import type { StockEntryMode, StockSupplierOption } from '../types';
import { parseQuantity } from '../utils/quantity';

export type StockEntryStatus = 'loading' | 'error' | 'ready';

export function useStockEntry(mode: StockEntryMode) {
  const [status, setStatus] = useState<StockEntryStatus>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<StockSupplierOption[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [picker, setPicker] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [physical, setPhysical] = useState('');
  const [cost, setCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState<string>(mode === 'out' ? STOCK_OUT_REASONS[0] : STOCK_ADJUST_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<{ before: number; after: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getStockSuppliers()])
      .then(([p, s]) => {
        if (cancelled) return;
        setProducts(p);
        setSuppliers(s);
        setSupplierId((current) => current || s[0]?.id || '');
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

  // web: `store.products.find(p => p.id === product.id) ?? product` — a
  // defensive re-lookup against the freshest fetched list.
  const live = product ? (products.find((p) => p.id === product.id) ?? product) : null;
  const numQty = parseQuantity(qty);
  const numPhysical = Number(physical);
  const delta = mode === 'adjust' && live ? (physical === '' ? 0 : numPhysical - live.currentStock) : 0;
  const nextStock = live ? (mode === 'in' ? live.currentStock + numQty : mode === 'out' ? live.currentStock - numQty : numPhysical) : 0;

  const validate = (): boolean => {
    if (!live) {
      setError('Choose a product first.');
      return false;
    }
    if (mode === 'adjust') {
      if (physical === '' || Number.isNaN(numPhysical) || numPhysical < 0) {
        setError('Enter the physical stock you counted. It cannot be negative.');
        return false;
      }
      if (delta === 0) {
        setError('Physical stock already matches the system. No adjustment needed.');
        return false;
      }
    } else {
      if (numQty <= 0) {
        setError('Enter a quantity greater than zero.');
        return false;
      }
      if (mode === 'out' && numQty > live.currentStock && !ALLOW_NEGATIVE_STOCK) {
        setError(`Only ${live.currentStock} units in stock. Reduce the quantity, or allow negative stock in Inventory Settings.`);
        return false;
      }
    }
    setError('');
    return true;
  };

  const requestReview = () => {
    if (validate()) setReview(true);
  };

  const commit = useCallback(async (): Promise<{ before: number; after: number } | null> => {
    if (!live) return null;
    setReview(false);
    setProcessing(true);
    try {
      const result =
        mode === 'in'
          ? await stockIn({
              productId: live.id,
              quantity: numQty,
              unitCostMinor: cost.trim() ? toMinorUnits(cost) : live.purchasePriceMinor,
              reference,
              reason: `Received from ${suppliers.find((s) => s.id === supplierId)?.name ?? 'supplier'}`,
            })
          : mode === 'out'
            ? await stockOut({ productId: live.id, quantity: numQty, reason })
            : await adjustStock({ productId: live.id, physicalQuantity: numPhysical, reason });
      setProcessing(false);
      const outcome = { before: result.quantityBefore, after: result.quantityAfter };
      setDone(outcome);
      return outcome;
    } catch {
      setProcessing(false);
      setError('Something went wrong updating stock. Try again.');
      return null;
    }
  }, [live, mode, numQty, numPhysical, cost, reference, reason, supplierId, suppliers]);

  // web: "Record another" resets done/product/qty/physical/cost/notes —
  // reference, reason and supplierId are deliberately left as-is.
  const resetForAnother = () => {
    setDone(null);
    setProduct(null);
    setQty('');
    setPhysical('');
    setCost('');
    setNotes('');
  };

  return {
    status,
    refetch,
    products,
    suppliers,
    picker,
    setPicker,
    product,
    setProduct,
    live,
    qty,
    setQty,
    physical,
    setPhysical,
    cost,
    setCost,
    supplierId,
    setSupplierId,
    reference,
    setReference,
    reason,
    setReason,
    notes,
    setNotes,
    error,
    numQty,
    delta,
    nextStock,
    review,
    setReview,
    processing,
    done,
    requestReview,
    commit,
    resetForAnother,
  };
}
