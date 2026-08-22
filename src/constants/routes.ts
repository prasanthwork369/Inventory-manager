/**
 * Shared destination constants for routes referenced from more than one
 * place. Created for Dashboard because its Quick Actions section targets
 * the exact same 4 destinations QuickActionsSheet.tsx already hardcoded
 * (New Sale/Stock In/Stock Out/Add Product) — centralizing avoids a second,
 * independently-maintained copy of the same web-route → Expo-route mapping.
 *
 * Web path -> our path (differs where our nested route structure, decided
 * in the navigation-shell phase, doesn't mirror the web's flat routing):
 *   /sales/new     -> /sales/new       (same)
 *   /stock/in      -> /more/stock/in   (Stock lives under the More tab here)
 *   /stock/out     -> /more/stock/out
 *   /products/new  -> /products/new    (same)
 *   /purchases/new -> /purchases/new   (same)
 *   /scan          -> /scan            (same)
 */
import type { Href } from 'expo-router';

export const ROUTES = {
  newSale: '/sales/new' as Href,
  newPurchase: '/purchases/new' as Href,
  stockIn: '/more/stock/in' as Href,
  stockOut: '/more/stock/out' as Href,
  addProduct: '/products/new' as Href,
  scan: '/scan' as Href,
} as const;
