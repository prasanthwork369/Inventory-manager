/**
 * Stable, typed errors repositories throw instead of leaking raw SQLite
 * messages ("UNIQUE constraint failed: products.sku") past the
 * persistence boundary. One flat class, not a hierarchy — a `code` union
 * is enough for the few cases callers actually branch on. The original
 * error is kept as `cause` so a caught RepositoryError can still be
 * logged/inspected fully, without exposing the raw message as the thing
 * a screen would show a user.
 */
export type RepositoryErrorCode =
  | 'DUPLICATE_SKU'
  | 'DUPLICATE_BARCODE'
  | 'DUPLICATE_NAME'
  | 'NOT_FOUND'
  | 'CONSTRAINT_VIOLATION'
  | 'DATABASE_ERROR';

export class RepositoryError extends Error {
  code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
    this.name = 'RepositoryError';
  }
}

/**
 * Inspects a caught error's message for known constraint names. Known
 * unique-constraint conflicts get a specific code; an unrecognized
 * SQLite *constraint* failure (FK/CHECK/other UNIQUE) still gets the
 * generic CONSTRAINT_VIOLATION code, since it genuinely is one — but
 * anything that isn't a constraint failure at all (connection closed,
 * disk I/O, malformed SQL, a non-Error thrown value) must NOT be
 * mislabeled as a constraint problem, or a caller branching on
 * `code === 'CONSTRAINT_VIOLATION'` would treat a real failure as a
 * simple "duplicate value" retry case. Those map to DATABASE_ERROR.
 */
export function translateSqliteError(error: unknown, context: { entity: string }): never {
  const message = error instanceof Error ? error.message : String(error);

  if (/UNIQUE constraint failed: products\.sku/i.test(message)) {
    throw new RepositoryError('DUPLICATE_SKU', `${context.entity}: SKU is already in use.`, { cause: error });
  }
  if (/UNIQUE constraint failed: products\.barcode/i.test(message)) {
    throw new RepositoryError('DUPLICATE_BARCODE', `${context.entity}: Barcode is already in use.`, { cause: error });
  }
  if (/UNIQUE constraint failed: categories\.name/i.test(message)) {
    throw new RepositoryError('DUPLICATE_NAME', `${context.entity}: Name is already in use.`, { cause: error });
  }
  if (/(UNIQUE|FOREIGN KEY|CHECK|NOT NULL) constraint failed/i.test(message)) {
    throw new RepositoryError('CONSTRAINT_VIOLATION', `${context.entity}: a data rule was violated.`, { cause: error });
  }
  throw new RepositoryError('DATABASE_ERROR', `${context.entity}: an unexpected database error occurred.`, { cause: error });
}
