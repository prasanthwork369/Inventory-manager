/**
 * Alerts are derived, not persisted — there is no second source of truth
 * beyond Products/Stock. `productId` is the only Product reference kept
 * (never a full Product object), matching canonical-ID reuse elsewhere.
 *
 * No "backup" alert kind: the web source's Alerts.tsx also surfaces a
 * backup-staleness reminder, but Backup isn't a built feature in this
 * app yet (explicitly out of scope) — there is no backups array to check
 * staleness against, so that alert kind is omitted rather than faked.
 */

export type AlertTone = 'bad' | 'warn';
export type AlertFilter = 'all' | 'low' | 'out' | 'other';
export type AlertKind = 'out-of-stock' | 'low-stock' | 'large-adjustment';

export interface InventoryAlert {
  id: string;
  kind: AlertKind;
  tone: AlertTone;
  title: string;
  body: string;
  actionLabel: string;
  productId: string;
}
