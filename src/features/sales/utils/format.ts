/**
 * Ported from the web reference's src/utils/format.ts — only the date
 * helpers Sales' screens actually call. Feature-owned, matching the
 * precedent set by stock/utils/format.ts and purchases/utils/format.ts.
 */
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(today.getTime() - 86400000);
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function dateTimeLabel(iso: string): string {
  return `${dateLabel(iso)} · ${timeLabel(iso)}`;
}

export function withinDays(iso: string, days: number): boolean {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return new Date(iso).getTime() >= start.getTime();
}
