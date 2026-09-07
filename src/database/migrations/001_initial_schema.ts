/**
 * Version 1: the complete base schema for every feature that exists
 * today (Onboarding/Dashboard/Products/Categories/Units/Stock/Suppliers/
 * Customers/Purchases/Sales/Returns/Settings). Table/column shapes are
 * taken directly from each feature's current `types.ts` — see the Stage 1
 * final report for the full mapping. No repository code reads these
 * tables yet (Database Stage 2); this only establishes them.
 *
 * Deliberately NOT created here: a `backups` table (Backup/Import/Export
 * stay simulated until a later persistence stage actually needs backup
 * history to survive app restarts — creating it now would be speculative
 * schema with no reader), a `purchase_returns`/`purchase_return_items`
 * pair (no Purchase Return UI/domain exists yet — PURCHASE_RETURN and
 * REVERSAL are still valid `stock_movements.type` values, just not backed
 * by their own relational tables), and a standalone `app_meta` table
 * (PRAGMA user_version already tracks schema version; nothing else needs
 * a second version register yet).
 *
 * Historical integrity: purchase/sale/return line items snapshot
 * `product_name` (and purchases snapshot `supplier_name`, sales snapshot
 * `customer_name`) exactly like the current in-memory providers already
 * do — a past transaction must keep showing what a product/party was
 * called even after it's renamed or archived, so those columns are never
 * back-filled from a join.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Migration } from './index';

const CREATE_TABLES_SQL = `
CREATE TABLE units (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE,
  description TEXT,
  icon TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (name)
);

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- purchase_price_minor/selling_price_minor/current_stock/minimum_stock
-- are all money-or-quantity integers (see database/constants.ts +
-- mappers.ts) — never REAL.
CREATE TABLE products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL COLLATE NOCASE,
  barcode TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  brand TEXT,
  location TEXT,
  purchase_price_minor INTEGER NOT NULL,
  selling_price_minor INTEGER NOT NULL,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (sku),
  UNIQUE (barcode)
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- The audit/source-of-truth log for every stock change. reference_type/
-- reference_id are nullable, additive beyond today's StockMovement type
-- (which only has a display 'reference' string) — a future repository
-- can populate them (e.g. reference_type='purchase', reference_id=<id>)
-- for real joins without another migration.
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'OPENING_STOCK','PURCHASE','SALE','SALE_RETURN','PURCHASE_RETURN',
    'DAMAGE','MANUAL_IN','MANUAL_OUT','ADJUSTMENT','REVERSAL'
  )),
  quantity_delta INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  reference_type TEXT,
  reference_id TEXT,
  recorded_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_created ON stock_movements(created_at);
CREATE INDEX idx_movements_type ON stock_movements(type);

CREATE TABLE purchases (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  subtotal_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Paid','Partial','Unpaid')),
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_created ON purchases(created_at);

CREATE TABLE purchase_items (
  id TEXT PRIMARY KEY NOT NULL,
  purchase_id TEXT NOT NULL REFERENCES purchases(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost_minor INTEGER NOT NULL
);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

CREATE TABLE sales (
  id TEXT PRIMARY KEY NOT NULL,
  receipt_no TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
  subtotal_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL,
  cost_minor INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash','UPI','Card','Other')),
  amount_received_minor INTEGER NOT NULL,
  -- Cache of a value re-derived from sale_returns on every read (see
  -- salesProvider.ts's deriveSaleStatus) — stored so a row is never
  -- ambiguous at rest, not treated as the source of truth by readers.
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','returned','part-returned')),
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_created ON sales(created_at);

CREATE TABLE sale_items (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_minor INTEGER NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- One sale can have many rows here (multiple partial returns over time)
-- — sale_id is a plain FK, not unique, by design (see Phase 10's
-- cumulative-returns correction).
CREATE TABLE sale_returns (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  receipt_no TEXT NOT NULL,
  refund_minor INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  restock INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sale_returns_sale ON sale_returns(sale_id);

CREATE TABLE sale_return_items (
  id TEXT PRIMARY KEY NOT NULL,
  sale_return_id TEXT NOT NULL REFERENCES sale_returns(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  amount_minor INTEGER NOT NULL
);
CREATE INDEX idx_sale_return_items_return ON sale_return_items(sale_return_id);

-- Singleton row (id always 1) holding every AppSettings section flattened,
-- plus onboarding completion — one business, one settings config, one
-- onboarding flag per install, so a single-row table avoids a join for
-- what is never a list. security_pin is deliberately absent: the app
-- never persists PIN digits, only whether one has been set.
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  business_currency TEXT NOT NULL,
  business_currency_symbol TEXT NOT NULL,
  business_country TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  business_address TEXT NOT NULL,
  business_email TEXT NOT NULL,
  business_logo TEXT NOT NULL DEFAULT '',
  tax_enabled INTEGER NOT NULL,
  tax_rate_percent INTEGER NOT NULL,
  tax_inclusive INTEGER NOT NULL,
  tax_apply_to_purchases INTEGER NOT NULL,
  inventory_low_stock_threshold INTEGER NOT NULL,
  inventory_allow_negative_stock INTEGER NOT NULL,
  inventory_valuation TEXT NOT NULL CHECK (inventory_valuation IN ('cost','selling')),
  receipt_prefix TEXT NOT NULL,
  receipt_next_number INTEGER NOT NULL,
  receipt_footer TEXT NOT NULL,
  receipt_show_tax INTEGER NOT NULL,
  receipt_show_logo INTEGER NOT NULL,
  security_mode TEXT NOT NULL CHECK (security_mode IN ('pin','biometric','none')),
  security_has_pin_set INTEGER NOT NULL DEFAULT 0,
  security_auto_lock INTEGER NOT NULL,
  security_timeout_minutes INTEGER NOT NULL,
  notifications_low_stock_alerts INTEGER NOT NULL,
  notifications_out_of_stock_alerts INTEGER NOT NULL,
  notifications_backup_reminders INTEGER NOT NULL,
  onboarding_complete INTEGER NOT NULL DEFAULT 0
);
`;

// Mirrors settings/constants.ts's DEFAULT_SETTINGS exactly, plus
// onboarding_complete=0 — a genuinely required structural default (the
// singleton row must exist), not demo data. tax_rate_percent is scaled
// by 100 relative to nothing (it's a whole percent, e.g. 5 for 5%), left
// as a plain integer since fractional percents aren't part of any
// current contract.
const SEED_APP_SETTINGS_SQL = `
INSERT INTO app_settings (
  id, business_name, business_type, business_currency, business_currency_symbol,
  business_country, business_phone, business_address, business_email, business_logo,
  tax_enabled, tax_rate_percent, tax_inclusive, tax_apply_to_purchases,
  inventory_low_stock_threshold, inventory_allow_negative_stock, inventory_valuation,
  receipt_prefix, receipt_next_number, receipt_footer, receipt_show_tax, receipt_show_logo,
  security_mode, security_has_pin_set, security_auto_lock, security_timeout_minutes,
  notifications_low_stock_alerts, notifications_out_of_stock_alerts, notifications_backup_reminders,
  onboarding_complete
) VALUES (
  1, 'Neptune General Store', 'General Store', 'INR', '₹',
  'India', '+91 98765 43210', '14 MG Road, Indiranagar, Bengaluru 560038', 'hello@neptunestore.in', '',
  1, 5, 0, 1,
  5, 0, 'cost',
  'SALE', 129, 'Thank you for shopping with us. Goods once sold are returnable within 7 days with receipt.', 1, 1,
  'none', 0, 1, 5,
  1, 1, 1,
  0
);
`;

// The only genuinely required default row for `units` — Product.unit_id
// is nullable and no Units screen exists, but a product created without
// picking a unit should have a sane fallback to reference rather than
// staying NULL forever. Timestamp is computed in JS (Date.now()) rather
// than a SQLite date function, so this doesn't depend on which SQLite
// build version ships inside expo-sqlite.
function seedDefaultUnitSql(nowMs: number): string {
  return `INSERT INTO units (id, name, symbol, is_active, created_at, updated_at)
VALUES ('unit-piece', 'Piece', 'pcs', 1, ${nowMs}, ${nowMs});`;
}

async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);
  await db.execAsync(seedDefaultUnitSql(Date.now()));
  await db.execAsync(SEED_APP_SETTINGS_SQL);
}

export const migration001InitialSchema: Migration = { version: 1, up };
