/**
 * The single swappable boundary between Purchases' hooks and its data
 * source — reads now go through purchaseRepository (Database Stage 2),
 * writes now go through the Database Stage 3 createPurchase use-case
 * (owns validation + the one transaction that inserts the purchase,
 * increases each product's stock, and writes PURCHASE movements).
 *
 * The old SESSION_PURCHASES in-memory array is gone: a purchase created
 * this session is now a real row, so getPurchaseById resolves it the
 * same way a call after an app restart would — no session-visibility
 * exception needed anymore.
 */
import { purchaseRepository } from '@/database';
import { createPurchase as createPurchaseUseCase } from '@/application/purchases/createPurchase';
import type { CreatePurchaseInput, Purchase, PurchaseFilters, PurchaseListSummary } from '../types';

export function getPurchases(filters: PurchaseFilters): Promise<Purchase[]> {
  return purchaseRepository.getPurchases(filters);
}

export function getPurchaseById(id: string): Promise<Purchase | undefined> {
  return purchaseRepository.getPurchaseById(id);
}

export function getPurchaseListSummary(): Promise<PurchaseListSummary> {
  return purchaseRepository.getPurchaseListSummary();
}

export function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  return createPurchaseUseCase(input);
}
