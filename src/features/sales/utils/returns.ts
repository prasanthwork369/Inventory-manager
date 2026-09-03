/**
 * Return-quantity safety, kept outside JSX per the phase brief: the web
 * source caps a return's stepper at the *original* sold quantity only,
 * so a sale returned twice (e.g. 2 of 5, then later up to 5 more of the
 * same 5) can be over-returned across separate return transactions — a
 * real gap in the source, not something to preserve. These functions
 * account for everything already returned so the max is always
 * (sold - already returned), and status reflects the full history.
 */
import type { Sale, SaleReturn } from '../types';

export function alreadyReturnedQuantity(returns: SaleReturn[], saleId: string, productId: string): number {
  return returns
    .filter((r) => r.saleId === saleId)
    .reduce((sum, r) => sum + (r.items.find((it) => it.productId === productId)?.quantity ?? 0), 0);
}

export function maxReturnableQuantity(soldQuantity: number, alreadyReturned: number): number {
  return Math.max(soldQuantity - alreadyReturned, 0);
}

export function deriveSaleStatus(sale: Sale, returns: SaleReturn[]): Sale['status'] {
  const totalSold = sale.items.reduce((sum, it) => sum + it.quantity, 0);
  const totalReturned = returns
    .filter((r) => r.saleId === sale.id)
    .reduce((sum, r) => sum + r.items.reduce((s, it) => s + it.quantity, 0), 0);
  if (totalReturned <= 0) return 'completed';
  return totalReturned >= totalSold ? 'returned' : 'part-returned';
}
