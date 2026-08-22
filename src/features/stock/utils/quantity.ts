/**
 * The single stable quantity representation for Stock. A plain whole
 * number today, chosen so it already supports signed deltas and is
 * forward-compatible with decimal-capable units (kg/litre) later without
 * a UI contract change — screens only ever pass/receive a `number`, never
 * a storage-scaled value. Kept centralized so parsing/formatting isn't
 * reimplemented independently across Stock In/Out/Adjust.
 */
export function parseQuantity(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function formatSignedQuantity(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta}`;
}
