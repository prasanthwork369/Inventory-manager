/**
 * The single swappable boundary between Sales' hooks and its data
 * source — mirrors purchasesProvider.ts's shape (including its session-
 * visibility exception, see below) closely.
 *
 * createSale/createSaleReturn append to SESSION_SALES/SESSION_RETURNS (small
 * in-memory arrays, not a general mutable store) rather than mutating
 * MOCK_SALES/MOCK_RETURNS — every read function reads through
 * allSalesRaw()/allReturnsRaw() so a sale or return created this session
 * resolves the same way a seed one does (list, detail, receipt, return
 * flow), matching the web's real behavior. This is the same deliberate,
 * narrow exception already used for Purchases; MOCK_SALES/MOCK_RETURNS
 * themselves are never mutated, so seed data is unaffected.
 *
 * Sale -> Stock: a completed sale is, conceptually, a SALE stock
 * movement per item (outgoing); a return is a SALE_RETURN movement
 * (incoming, only if restocked). This provider does not create or write
 * any StockMovement — Stock's own mockMovements.ts already seeds
 * matching entries for some of the mock sales/returns below (by
 * receiptNo/reference) so "Stock impact" has real examples to show. The
 * real, atomic (sale + stock movement + products.currentStock) write is
 * the future SaleRepository/StockRepository transaction this boundary is
 * shaped for — not implemented now.
 */
import { getProductById } from '@/features/products/data/productsProvider';
import { PAYMENT_METHODS } from '../constants';
import { calculateReturnItemAmount, calculateReturnRefund, calculateSaleTotals } from '../utils/calculations';
import { withinDays } from '../utils/format';
import { deriveSaleStatus } from '../utils/returns';
import { MOCK_RETURNS } from './mockReturns';
import { MOCK_SALES } from './mockSales';
import type {
  CreateSaleInput,
  CreateSaleReturnInput,
  PaymentMethod,
  Sale,
  SaleFilters,
  SaleItem,
  SaleListSummary,
  SaleReturn,
  SaleReturnItem,
} from '../types';

const SIMULATED_DELAY_MS = 420;
const QUERY_DELAY_MS = 30;
const SAVE_DELAY_MS = 650;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function pad(n: number, len = 6): string {
  return n.toString().padStart(len, '0');
}

const SESSION_SALES: Sale[] = [];
const SESSION_RETURNS: SaleReturn[] = [];

function allSalesRaw(): Sale[] {
  return [...SESSION_SALES, ...MOCK_SALES];
}

function allReturnsRaw(): SaleReturn[] {
  return [...SESSION_RETURNS, ...MOCK_RETURNS];
}

function withDerivedStatus(sale: Sale, returns: SaleReturn[]): Sale {
  return { ...sale, status: deriveSaleStatus(sale, returns) };
}

export function getSales(filters: SaleFilters): Promise<Sale[]> {
  const returns = allReturnsRaw();
  const q = filters.query.trim().toLowerCase();
  const results = allSalesRaw()
    .map((s) => withDerivedStatus(s, returns))
    .filter((s) => {
      if (filters.rangeDays !== 'all' && !withinDays(s.createdAt, filters.rangeDays)) return false;
      if (q && !`${s.receiptNo} ${s.customerName}`.toLowerCase().includes(q)) return false;
      if (filters.paymentMethod !== 'all' && s.paymentMethod !== filters.paymentMethod) return false;
      if (filters.customerId !== 'all' && s.customerId !== filters.customerId) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(results, QUERY_DELAY_MS);
}

export function getSaleById(id: string): Promise<Sale | undefined> {
  const returns = allReturnsRaw();
  const found = allSalesRaw().find((s) => s.id === id);
  return delay(found ? withDerivedStatus(found, returns) : undefined, SIMULATED_DELAY_MS);
}

// web: today/week/month/paymentMix are derived from the full `sales`
// array, independent of whatever filters the list view has active.
export async function getSaleListSummary(): Promise<SaleListSummary> {
  const sales = allSalesRaw();
  const today = sales.filter((s) => withinDays(s.createdAt, 1));
  const week = sales.filter((s) => withinDays(s.createdAt, 7));
  const month = sales.filter((s) => withinDays(s.createdAt, 30));
  const totalOf = (list: Sale[]) => list.reduce((sum, s) => sum + s.totalMinor, 0);
  const profitOf = (list: Sale[]) => list.reduce((sum, s) => sum + (s.totalMinor - s.taxMinor - s.costMinor), 0);
  const paymentMixMinor = PAYMENT_METHODS.reduce(
    (acc, m) => {
      acc[m] = month.filter((s) => s.paymentMethod === m).reduce((sum, s) => sum + s.totalMinor, 0);
      return acc;
    },
    {} as Record<PaymentMethod, number>
  );
  const summary: SaleListSummary = {
    todayTotalMinor: totalOf(today),
    todayCount: today.length,
    todayProfitMinor: profitOf(today),
    weekTotalMinor: totalOf(week),
    weekCount: week.length,
    monthTotalMinor: totalOf(month),
    monthCount: month.length,
    monthProfitMinor: profitOf(month),
    paymentMixMinor,
  };
  return delay(summary, SIMULATED_DELAY_MS);
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  let costMinor = 0;
  const items: SaleItem[] = await Promise.all(
    input.items.map(async (line) => {
      const product = await getProductById(line.productId);
      costMinor += (product?.purchasePriceMinor ?? 0) * line.quantity;
      return {
        productId: line.productId,
        productName: product?.name ?? '',
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
        discountMinor: line.discountMinor,
      };
    })
  );
  const totals = calculateSaleTotals(items, input.discountMinor);
  const sale: Sale = {
    id: `sal-${Date.now()}`,
    receiptNo: `SALE-${pad(Date.now() % 100000)}`,
    createdAt: new Date().toISOString(),
    items,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: input.discountMinor,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
    costMinor,
    customerId: input.customerId,
    customerName: input.customerName,
    paymentMethod: input.paymentMethod,
    amountReceivedMinor: input.amountReceivedMinor,
    status: 'completed',
  };
  SESSION_SALES.unshift(sale);
  return delay(sale, SAVE_DELAY_MS);
}

export function getReturnsForSale(saleId: string): Promise<SaleReturn[]> {
  const results = allReturnsRaw()
    .filter((r) => r.saleId === saleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(results, QUERY_DELAY_MS);
}

export async function createSaleReturn(input: CreateSaleReturnInput): Promise<SaleReturn> {
  const sale = allSalesRaw().find((s) => s.id === input.saleId);
  if (!sale) throw new Error('Sale not found');

  const items: SaleReturnItem[] = input.items.map((line) => {
    const saleLine = sale.items.find((it) => it.productId === line.productId);
    const soldQuantity = saleLine?.quantity || 1;
    return {
      productId: line.productId,
      productName: saleLine?.productName ?? '',
      quantity: line.quantity,
      amountMinor: calculateReturnItemAmount(saleLine?.unitPriceMinor ?? 0, saleLine?.discountMinor ?? 0, soldQuantity, line.quantity),
    };
  });
  const refundMinor = calculateReturnRefund(
    input.items.map((line) => {
      const saleLine = sale.items.find((it) => it.productId === line.productId);
      return {
        unitPriceMinor: saleLine?.unitPriceMinor ?? 0,
        lineDiscountMinor: saleLine?.discountMinor ?? 0,
        soldQuantity: saleLine?.quantity || 1,
        returnQuantity: line.quantity,
      };
    })
  );

  const record: SaleReturn = {
    id: `ret-${Date.now()}`,
    reference: `RET-${pad(Date.now() % 100000)}`,
    saleId: input.saleId,
    receiptNo: sale.receiptNo,
    createdAt: new Date().toISOString(),
    items,
    refundMinor,
    reason: input.reason,
    restock: input.restock,
  };
  SESSION_RETURNS.unshift(record);
  return delay(record, SAVE_DELAY_MS);
}
