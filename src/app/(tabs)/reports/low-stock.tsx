import React from 'react';
import { TriangleAlert } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function LowStockReport() {
  return <DevPlaceholderScreen title="Low stock" icon={<TriangleAlert size={28} color={colors.brand[600]} />} />;
}
