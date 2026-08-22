import React from 'react';
import { PackagePlus } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ProductCreate() {
  return <DevPlaceholderScreen title="Add product" icon={<PackagePlus size={28} color={colors.brand[600]} />} />;
}
