import React from 'react';
import { ShoppingCart } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Purchases() {
  return <DevPlaceholderScreen title="Purchases" icon={<ShoppingCart size={28} color={colors.brand[600]} />} />;
}
