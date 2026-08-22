import React from 'react';
import { BoxesIcon } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ProductsTab() {
  return <DevPlaceholderScreen title="Products" icon={<BoxesIcon size={28} color={colors.brand[600]} />} back={false} />;
}
