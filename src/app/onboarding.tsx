import React from 'react';
import { Rocket } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

// Route exists and is correctly registered in the root stack (see
// _layout.tsx). Gating logic (has this device been onboarded before?) needs
// real persisted state, which is out of scope for navigation-only work —
// deferred to the settings/persistence stage. Reachable directly at
// /onboarding for now; nothing currently redirects here automatically.
export default function Onboarding() {
  return <DevPlaceholderScreen title="Welcome" icon={<Rocket size={28} color={colors.brand[600]} />} back={false} />;
}
