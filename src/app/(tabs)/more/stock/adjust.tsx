import React from 'react';
import { Scale } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function StockAdjust() {
  return <DevPlaceholderScreen title="Adjust Stock" icon={<Scale size={28} color={colors.brand[600]} />} />;
}
