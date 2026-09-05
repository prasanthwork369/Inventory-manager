/**
 * Unlike every other feature's temporary provider, this one is
 * genuinely mutable within the session — Settings is an editable
 * configuration feature, not historical/transactional data, and the
 * phase brief explicitly allows session-level state here so reopening a
 * settings screen shows what was just saved. Still no AsyncStorage/
 * SQLite/localStorage: a plain module-scoped variable, reset on app
 * reload. Future SQLite swap only changes this file's internals —
 * getSettings/updateSettings' shapes already match what a
 * SettingsRepository would expose.
 */
import { DEFAULT_SETTINGS } from '../constants';
import type { AppSettings } from '../types';

const SIMULATED_DELAY_MS = 300;
const SAVE_DELAY_MS = 450;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };

export function getSettings(): Promise<AppSettings> {
  return delay(currentSettings, SIMULATED_DELAY_MS);
}

export function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  currentSettings = { ...currentSettings, ...patch };
  return delay(currentSettings, SAVE_DELAY_MS);
}
