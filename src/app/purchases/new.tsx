import React from 'react';
import { ShoppingCart } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

// Immersive — same reasoning as sales/new.tsx: root-level fullScreenModal,
// not nested under (tabs)/more/purchases, so the tab bar always hides.
export default function NewPurchase() {
  return <DevPlaceholderScreen title="New Purchase" icon={<ShoppingCart size={28} color={colors.brand[600]} />} />;
}
