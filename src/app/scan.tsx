import React from 'react';
import { ScanLine } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

// Immersive — presented as a fullScreenModal from the root stack (see
// _layout.tsx), so the tab bar is hidden regardless of which tab this was
// triggered from. Real camera/barcode work (expo-camera) is out of scope.
export default function Scan() {
  return <DevPlaceholderScreen title="Scan barcode" icon={<ScanLine size={28} color={colors.brand[600]} />} />;
}
