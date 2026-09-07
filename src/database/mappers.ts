/**
 * Small, pure conversions between SQLite's storage shapes and the domain
 * shapes every feature's types already use (ISO date strings, plain
 * booleans, plain-number quantities). Repository code (Database Stage 2)
 * is the only intended caller — screens/hooks never touch these.
 */
import { QUANTITY_SCALE } from './constants';

export function toSqliteBool(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

export function fromSqliteBool(value: number): boolean {
  return value !== 0;
}

export function toEpochMs(iso: string): number {
  return new Date(iso).getTime();
}

export function fromEpochMs(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

/** See constants.ts's QUANTITY_SCALE doc comment for why this exists. */
export function toScaledQuantity(quantity: number): number {
  return Math.round(quantity * QUANTITY_SCALE);
}

export function fromScaledQuantity(scaled: number): number {
  return scaled / QUANTITY_SCALE;
}
