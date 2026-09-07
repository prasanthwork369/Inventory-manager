/**
 * One import point for every repository, namespaced (not flattened) so
 * call sites read as `productRepository.getProducts(...)` — the same
 * explicitness feature providers already use for their own imports.
 * `insert*`/`insertMovement` primitives are real exports here too (hiding
 * them from the barrel wouldn't stop a direct import anyway); their doc
 * comments are what mark them as not-a-complete-business-operation.
 */
export * as categoryRepository from './categoryRepository';
export * as productRepository from './productRepository';
export * as supplierRepository from './supplierRepository';
export * as customerRepository from './customerRepository';
export * as stockMovementRepository from './stockMovementRepository';
export * as purchaseRepository from './purchaseRepository';
export * as saleRepository from './saleRepository';
export * as settingsRepository from './settingsRepository';
