import React from 'react';
import { ShoppingCart } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function PurchaseReport() {
  return <DevPlaceholderScreen title="Purchase report" icon={<ShoppingCart size={28} color={colors.brand[600]} />} />;
}
