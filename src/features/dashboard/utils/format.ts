/**
 * Ported from the web reference's src/utils/format.ts — only the functions
 * Dashboard.tsx actually calls (money, compact, greeting, relative) plus
 * its own local describeMovement. Feature-owned for now rather than
 * promoted to a shared src/utils/ — Dashboard is the first screen with
 * real data display, so "proven reuse" doesn't exist yet; the same rule
 * applied to onboarding's constants. Promote when a second feature needs
 * the same functions.
 */
import type { DashboardMovementType } from '../types';

export function formatMoney(value: number, symbol: string): string {
  const negative = value < 0;
  const abs = Math.round(Math.abs(value));
  return `${negative ? '-' : ''}${symbol}${abs.toLocaleString('en-IN')}`;
}

export function formatCompactMoney(value: number, symbol: string): string {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `${symbol}${(value / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${symbol}${(value / 100000).toFixed(2)}L`;
  return formatMoney(value, symbol);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// web: relative() falls back to dateLabel(iso) past 7 days. dateLabel isn't
// used anywhere else in Dashboard, so its "older than a week" branch is
// inlined here rather than porting the whole of utils/format.ts.
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function describeMovement(type: DashboardMovementType, quantity: number): string {
  if (type === 'sale') return `Sold ${Math.abs(quantity)} ×`;
  if (type === 'purchase') return `Received ${quantity} units of`;
  if (type === 'in') return `Added ${quantity} units of`;
  if (type === 'out') return `Removed ${Math.abs(quantity)} units of`;
  if (type === 'return') return 'Return processed:';
  return 'Stock adjusted:';
}
