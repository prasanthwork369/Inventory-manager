/**
 * Stable business-rule errors use-cases throw instead of a RepositoryError
 * or raw SQLite failure — screens/hooks (Stage 4) will branch on `code`,
 * never on a message string.
 */
export type BusinessErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'SUPPLIER_NOT_FOUND'
  | 'SALE_NOT_FOUND'
  | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_RETURN_QUANTITY'
  | 'NO_STOCK_CHANGE'
  | 'EMPTY_PURCHASE'
  | 'EMPTY_SALE';

export class BusinessError extends Error {
  code: BusinessErrorCode;

  constructor(code: BusinessErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'BusinessError';
  }
}
