import React from 'react';
import { Layers } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function InventorySettings() {
  return <DevPlaceholderScreen title="Inventory settings" icon={<Layers size={28} color={colors.brand[600]} />} />;
}
