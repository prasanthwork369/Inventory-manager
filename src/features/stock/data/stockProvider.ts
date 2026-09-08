/**
 * The single swappable boundary between Stock's hooks and its data
 * source — reads now go through stockMovementRepository (Database Stage
 * 2), writes now go through the Database Stage 3 use-cases (stockIn/
 * stockOut/adjustStock own validation + the one transaction that updates
 * products.current_stock and inserts the movement together). This
 * provider never calls a repository write primitive directly — the
 * use-case is the only thing allowed to.
 *
 * getStockSuppliers still reads Suppliers' own canonical provider
 * (unchanged cross-feature dependency, same as before Stage 4).
 * getStockSummary now reads InventorySettings.valuation from
 * settingsRepository instead of the old hardcoded STOCK_VALUATION
 * constant — one source of truth now that Settings persists for real.
 *
 * BusinessError (Stage 3) is re-thrown as-is: hooks already treat any
 * thrown error as "show a generic failure message" (see
 * useStockEntry.ts's commit() catch block), so no error-shape mapping
 * was needed here to keep that behavior working.
 */
import { getProducts } from '@/features/products/data/productsProvider';
import { getSuppliers } from '@/features/suppliers/data/suppliersProvider';
import { stockMovementRepository, settingsRepository } from '@/database';
import { adjustStock as adjustStockUseCase } from '@/application/stock/adjustStock';
import { stockIn as stockInUseCase } from '@/application/stock/stockIn';
import { stockOut as stockOutUseCase } from '@/application/stock/stockOut';
import type {
  StockActionResult,
  StockAdjustmentInput,
  StockInInput,
  StockMovement,
  StockMovementFilters,
  StockOutInput,
  StockSummary,
  StockSupplierOption,
} from '../types';
import { lowStock, outOfStock, stockValueMinor, totalUnits } from '../utils/metrics';

export async function getStockSummary(): Promise<StockSummary> {
  const [products, settings, totalMovements] = await Promise.all([getProducts(), settingsRepository.getSettings(), stockMovementRepository.countMovements()]);
  return {
    totalStockValueMinor: stockValueMinor(products, settings.inventory.valuation),
    sellingStockValueMinor: stockValueMinor(products, 'selling'),
    valuation: settings.inventory.valuation,
    totalProducts: products.length,
    totalUnits: totalUnits(products),
    totalMovements,
    lowStock: lowStock(products),
    outOfStock: outOfStock(products),
  };
}

export function getRecentMovements(limit: number): Promise<StockMovement[]> {
  return stockMovementRepository.getRecentMovements(limit);
}

export async function getStockSuppliers(): Promise<StockSupplierOption[]> {
  const suppliers = await getSuppliers();
  return suppliers.filter((s) => s.isActive).map((s) => ({ id: s.id, name: s.name }));
}

export function getMovements(filters: StockMovementFilters): Promise<StockMovement[]> {
  return stockMovementRepository.getMovements(filters);
}

export function stockIn(input: StockInInput): Promise<StockActionResult> {
  return stockInUseCase(input);
}

export function stockOut(input: StockOutInput): Promise<StockActionResult> {
  return stockOutUseCase(input);
}

export function adjustStock(input: StockAdjustmentInput): Promise<StockActionResult> {
  return adjustStockUseCase(input);
}
