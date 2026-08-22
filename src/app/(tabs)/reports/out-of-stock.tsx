import React from 'react';
import { PackageX } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function OutOfStockReport() {
  return <DevPlaceholderScreen title="Out of stock" icon={<PackageX size={28} color={colors.brand[600]} />} />;
}
