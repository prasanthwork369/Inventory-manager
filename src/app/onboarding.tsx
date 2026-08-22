import React from 'react';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';

// Thin route — all onboarding UI/flow lives under src/features/onboarding/.
// Gating logic (skip onboarding on repeat launches) needs persisted state,
// which is out of scope for this feature — deferred to the settings/
// persistence stage. Reachable directly at /onboarding for now; nothing
// currently redirects here automatically.
export default function Onboarding() {
  return <OnboardingScreen />;
}
