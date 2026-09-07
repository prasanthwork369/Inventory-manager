export const DATABASE_NAME = 'inventory.db';

/**
 * Every quantity column is stored as this-scaled INTEGER (round(qty *
 * 1000)) instead of REAL, so a future decimal-capable unit (kg, litre)
 * works down to 0.001 without floating-point drift, while today's
 * whole-count products (5 units -> 5000) round-trip exactly. Repositories
 * are the only code that should ever see this constant — domain
 * types/screens keep working with plain numbers via toScaledQuantity/
 * fromScaledQuantity (see mappers.ts).
 */
export const QUANTITY_SCALE = 1000;
