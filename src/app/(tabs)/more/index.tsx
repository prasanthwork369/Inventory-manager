import React from 'react';
import { MoreHorizontal } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

// Full grouped-row design (Operations/People/Data, matching web's More.tsx)
// is deferred to the More feature stage — this only proves the route is
// reachable from the floating More button without hiding the tab bar.
export default function MoreTab() {
  return <DevPlaceholderScreen title="More" icon={<MoreHorizontal size={28} color={colors.brand[600]} />} back={false} />;
}
