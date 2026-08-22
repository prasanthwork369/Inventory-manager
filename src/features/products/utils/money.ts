/**
 * The only place price values cross between the domain's integer minor
 * units (paise) and either a display string or a user-typed decimal
 * string. Nothing in presentation JSX should do this conversion itself —
 * screens pass raw minor-unit numbers or raw input strings through these.
 *
 * formatMoney mirrors the web reference's utils/format.ts `money()`
 * rounding/grouping behavior, just operating on minor units first.
 */

export function toMinorUnits(rupeesInput: string): number {
  const rupees = Number(rupeesInput);
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number, symbol: string): string {
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const rupees = Math.round(abs / 100);
  return `${negative ? '-' : ''}${symbol}${rupees.toLocaleString('en-IN')}`;
}

/** For editable price fields: minor units -> the decimal string a user
 * would type (e.g. 125050 -> "1250.50"), with trailing ".00" trimmed for
 * whole-rupee amounts so an empty/new field doesn't show "0.00". */
export function minorUnitsToInputString(minor: number): string {
  if (minor === 0) return '';
  const rupees = minor / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}
