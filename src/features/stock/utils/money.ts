/**
 * Port of the web reference's utils/format.ts `compact()` for Stock's
 * "Total stock value" card. Products' own money.ts has no compact
 * formatter (product prices are always shown in full there); Dashboard
 * has its own feature-owned copy for the same reason. This is Stock's
 * copy of the same logic rather than a cross-feature import, matching
 * the existing precedent (dashboard/utils, products/utils) of each
 * feature owning its own format utils until a second consumer inside the
 * same feature boundary justifies promoting it to shared.
 */
import { formatMoney } from '@/features/products/utils/money';

export function formatCompactMoney(minor: number, symbol: string): string {
  const rupees = minor / 100;
  const abs = Math.abs(rupees);
  if (abs >= 10000000) return `${symbol}${(rupees / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${symbol}${(rupees / 100000).toFixed(2)}L`;
  return formatMoney(minor, symbol);
}
