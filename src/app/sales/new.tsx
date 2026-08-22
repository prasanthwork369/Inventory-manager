import React from 'react';
import { ReceiptIndianRupee } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

// Immersive — presented as a fullScreenModal from the root stack (see
// _layout.tsx), NOT nested inside the Sales tab's own stack, so it hides
// the tab bar unconditionally whether triggered from the Sales tab or the
// FAB Quick Actions sheet from any other tab. Matches the web's
// `immersive` regex treatment for /sales/new.
export default function NewSale() {
  return <DevPlaceholderScreen title="New Sale" icon={<ReceiptIndianRupee size={28} color={colors.brand[600]} />} />;
}
