import React from 'react';
import { ScannerScreen } from '@/features/scanner/screens/ScannerScreen';

// Immersive — presented as a fullScreenModal from the root stack (see
// _layout.tsx), so the tab bar is hidden regardless of which tab this was
// triggered from.
export default function Scan() {
  return <ScannerScreen />;
}
