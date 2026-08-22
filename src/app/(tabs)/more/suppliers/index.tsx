import React from 'react';
import { Truck } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Suppliers() {
  return <DevPlaceholderScreen title="Suppliers" icon={<Truck size={28} color={colors.brand[600]} />} />;
}
