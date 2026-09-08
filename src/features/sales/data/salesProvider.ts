/**
 * The single swappable boundary between Sales' hooks and its data source
 * — reads now go through saleRepository (Database Stage 2, which
 * re-derives `status` from the full sale_returns history on every read —
 * preserves the Phase 10 cumulative-returns correction), writes now go
 * through the Database Stage 3 createSale/createSaleReturn use-cases
 * (validation + the one transaction that updates product stock and
 * writes SALE/SALE_RETURN movements).
 *
 * SESSION_SALES/SESSION_RETURNS are gone: a sale or return created this
 * session is a real row now, so getSaleById/getReturnsForSale resolve it
 * the same way a call after an app restart would.
 */
import { saleRepository } from '@/database';
import { createSale as createSaleUseCase } from '@/application/sales/createSale';
import { createSaleReturn as createSaleReturnUseCase } from '@/application/sales/createSaleReturn';
import type { CreateSaleInput, CreateSaleReturnInput, Sale, SaleFilters, SaleListSummary, SaleReturn } from '../types';

export function getSales(filters: SaleFilters): Promise<Sale[]> {
  return saleRepository.getSales(filters);
}

export function getSaleById(id: string): Promise<Sale | undefined> {
  return saleRepository.getSaleById(id);
}

export function getSaleListSummary(): Promise<SaleListSummary> {
  return saleRepository.getSaleListSummary();
}

export function createSale(input: CreateSaleInput): Promise<Sale> {
  return createSaleUseCase(input);
}

export function getReturnsForSale(saleId: string): Promise<SaleReturn[]> {
  return saleRepository.getReturnsForSale(saleId);
}

export function createSaleReturn(input: CreateSaleReturnInput): Promise<SaleReturn> {
  return createSaleReturnUseCase(input);
}
