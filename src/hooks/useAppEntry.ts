/**
 * App-entry gate abstraction: "has onboarding been completed" as a single
 * cross-feature source of truth, consumed by src/app/index.tsx (the entry
 * gate) and updated by the onboarding feature on completion.
 *
 * Temporary in-memory implementation — a module-scoped value + a minimal
 * subscriber set, read reactively via useSyncExternalStore (built into
 * React, no new dependency). No AsyncStorage/SQLite here.
 *
 * Future SQLite swap: replace `getSnapshot`/`setOnboardingComplete`'s
 * bodies with a repository-backed read/write (and, if that read becomes
 * async, have `getSnapshot` return 'loading' until the first resolved
 * value arrives). `AppEntryStatus`'s existing 'loading' member means
 * src/app/index.tsx and this hook's return type do not need to change
 * shape when that happens — only this file's internals do.
 */
import { useSyncExternalStore } from 'react';

export type AppEntryStatus = 'loading' | 'needs-onboarding' | 'ready';

let onboardingComplete = false;
const listeners = new Set<() => void>();

function getSnapshot(): boolean {
  return onboardingComplete;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called by the onboarding feature once its flow finishes. */
export function completeOnboarding(): void {
  onboardingComplete = true;
  listeners.forEach((listener) => listener());
}

export function useAppEntry(): AppEntryStatus {
  const complete = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return complete ? 'ready' : 'needs-onboarding';
}
