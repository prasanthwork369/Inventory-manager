/**
 * Ported from the web reference's utils/format.ts `compact()`. Products'
 * money.ts has no compact formatter; Dashboard and Stock each already
 * have their own feature-owned copy for the same reason — this is
 * Reports' copy, not a cross-feature import of a feature-owned utility.
 */
import { formatMoney } from '@/features/products/utils/money';

export function formatCompactMoney(minor: number, symbol: string): string {
  const rupees = minor / 100;
  const abs = Math.abs(rupees);
  if (abs >= 10000000) return `${symbol}${(rupees / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${symbol}${(rupees / 100000).toFixed(2)}L`;
  return formatMoney(minor, symbol);
}
