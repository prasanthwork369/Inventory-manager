/**
 * App-entry gate: "has onboarding been completed" backed by the real
 * app_settings row (Database Stage 2/4) instead of an in-memory flag, so
 * a cold restart after completing onboarding goes straight to the app.
 *
 * `settingsRepository.isOnboardingComplete()` calls `getDatabase()`
 * internally, so importing this module (from the root layout, as early
 * as possible) is what kicks off DB open + migration — the "single
 * initialization path" every DB-backed provider then relies on.
 *
 * 'error' is a new AppEntryStatus member: a failed DB open/migration is a
 * real, if rare, failure a user should see instead of being stuck on a
 * blank splash or silently dropped into onboarding — src/app/_layout.tsx
 * renders a minimal ErrorNotice + retry for it.
 */
import { useSyncExternalStore } from 'react';
import { settingsRepository } from '@/database';

export type AppEntryStatus = 'loading' | 'needs-onboarding' | 'ready' | 'error';

type Snapshot = 'loading' | 'complete' | 'not-complete' | 'error';

let snapshot: Snapshot = 'loading';
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function load(): Promise<void> {
  snapshot = 'loading';
  notify();
  try {
    const complete = await settingsRepository.isOnboardingComplete();
    snapshot = complete ? 'complete' : 'not-complete';
  } catch {
    snapshot = 'error';
  }
  notify();
}

load();

/** Called by the onboarding feature once its flow finishes. */
export async function completeOnboarding(): Promise<void> {
  await settingsRepository.setOnboardingComplete();
  snapshot = 'complete';
  notify();
}

/** Lets the error screen retry DB initialization without a full app restart. */
export function retryAppEntry(): void {
  load();
}

const STATUS_FROM_SNAPSHOT: Record<Snapshot, AppEntryStatus> = {
  loading: 'loading',
  complete: 'ready',
  'not-complete': 'needs-onboarding',
  error: 'error',
};

export function useAppEntry(): AppEntryStatus {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return STATUS_FROM_SNAPSHOT[current];
}
