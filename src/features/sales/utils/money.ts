/**
 * Ported from the web reference's utils/format.ts `moneyPrecise()` for
 * the Receipt screen's line items (2 decimal places) — Products' money.ts
 * only has the whole-rupee `formatMoney`, which Sales still reuses for
 * every other amount; this is the one Sales-specific addition.
 */
export function formatMoneyPrecise(minor: number, symbol: string): string {
  const negative = minor < 0;
  const rupees = Math.abs(minor) / 100;
  return `${negative ? '-' : ''}${symbol}${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
