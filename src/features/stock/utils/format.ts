/**
 * Ported from the web reference's src/utils/format.ts — only the date
 * helpers Stock's screens actually call (dateLabel/timeLabel/
 * dateTimeLabel/relative). Feature-owned for now rather than promoted to
 * a shared src/utils/, matching the precedent set by dashboard/utils and
 * products/utils — promote when a second feature needs the same
 * functions.
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

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return dateLabel(iso);
}
