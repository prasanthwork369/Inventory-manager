/**
 * Ported from the web reference's NewSale.tsx: local `step`/`items`/
 * `orderDiscount`/`customerId`/`method`/`received` state and its add/
 * changeQty/complete flow. Unlike Purchases, the web here has no review
 * sheet — the 3-step flow (cart -> summary -> payment) itself is the
 * review, and "Complete Sale" commits directly, matching that exactly.
 *
 * Cart quantity only ever changes by +/-1 (grid tap or cart stepper),
 * never free text, so line quantity stays a plain number — no per-line
 * string-input parsing needed here (unlike Purchases' qty/cost fields).
 */
import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '@/features/products/data/productsProvider';
import type { Product } from '@/features/products/types';
import { toMinorUnits } from '@/features/products/utils/money';
import { createCustomer, getCustomers } from '@/features/customers/data/customersProvider';
import type { Customer } from '@/features/customers/types';
import { ALLOW_NEGATIVE_STOCK } from '@/features/stock/constants';
import { createSale } from '../data/salesProvider';
import { calculateSaleTotals } from '../utils/calculations';
import type { PaymentMethod, Sale } from '../types';

export type NewSaleStatus = 'loading' | 'error' | 'ready';
export type NewSaleStep = 'cart' | 'summary' | 'payment';

export interface SaleLineDraft {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
}

const ERROR_AUTOCLEAR_MS = 3000;

export function useNewSale() {
  const [status, setStatus] = useState<NewSaleStatus>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [step, setStep] = useState<NewSaleStep>('cart');
  const [items, setItems] = useState<SaleLineDraft[]>([]);
  const [query, setQuery] = useState('');
  const [orderDiscountInput, setOrderDiscountInput] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [receivedInput, setReceivedInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState<Sale | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProducts(), getCustomers()])
      .then(([productList, customerList]) => {
        if (cancelled) return;
        setProducts(productList);
        setCustomers(customerList);
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

  const customerName = customerId ? (customers.find((c) => c.id === customerId)?.name ?? 'Walk-in Customer') : 'Walk-in Customer';

  const discountMinor = toMinorUnits(orderDiscountInput);
  const totals = calculateSaleTotals(items, discountMinor);
  const receivedMinor = toMinorUnits(receivedInput);
  const changeMinor = Math.max(receivedMinor - totals.totalMinor, 0);

  const showStockError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), ERROR_AUTOCLEAR_MS);
  };

  const addToCart = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      setItems((current) => {
        const existing = current.find((i) => i.productId === productId);
        const nextQuantity = (existing?.quantity ?? 0) + 1;
        if (nextQuantity > product.currentStock && !ALLOW_NEGATIVE_STOCK) {
          showStockError(`Only ${product.currentStock} units of ${product.name} in stock.`);
          return current;
        }
        if (existing) {
          return current.map((i) => (i.productId === productId ? { ...i, quantity: nextQuantity } : i));
        }
        return [...current, { productId, productName: product.name, quantity: 1, unitPriceMinor: product.sellingPriceMinor, discountMinor: 0 }];
      });
    },
    [products]
  );

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems((current) => current.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0));
  }, []);

  const addAndSelectCustomer = useCallback(async (name: string, phone: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const customer = await createCustomer({ name: trimmed, phone, email: '', address: '', notes: '' });
    setCustomers((current) => [...current, customer]);
    setCustomerId(customer.id);
    setCustomerSheetOpen(false);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setClearOpen(false);
  }, []);

  const complete = useCallback(async () => {
    setProcessing(true);
    try {
      const sale = await createSale({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceMinor: i.unitPriceMinor, discountMinor: i.discountMinor })),
        discountMinor,
        customerId,
        customerName,
        paymentMethod: method,
        amountReceivedMinor: receivedMinor || totals.totalMinor,
      });
      setProcessing(false);
      setCompleted(sale);
      return sale;
    } catch {
      setProcessing(false);
      setError('Something went wrong completing this sale. Try again.');
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, discountMinor, customerId, customerName, method, receivedMinor]);

  const resetForNewSale = useCallback(() => {
    setCompleted(null);
    setItems([]);
    setStep('cart');
    setReceivedInput('');
    setOrderDiscountInput('');
    setCustomerId(null);
  }, []);

  return {
    status,
    refetch,
    products,
    customers,
    step,
    setStep,
    items,
    query,
    setQuery,
    orderDiscountInput,
    setOrderDiscountInput,
    discountMinor,
    customerId,
    setCustomerId,
    customerName,
    customerSheetOpen,
    setCustomerSheetOpen,
    method,
    setMethod,
    receivedInput,
    setReceivedInput,
    processing,
    completed,
    clearOpen,
    setClearOpen,
    error,
    totals,
    changeMinor,
    addToCart,
    changeQuantity,
    addAndSelectCustomer,
    clearCart,
    complete,
    resetForNewSale,
  };
}
