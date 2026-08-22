import React from 'react';
import { ArrowDownToLine } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function StockIn() {
  return <DevPlaceholderScreen title="Stock In" icon={<ArrowDownToLine size={28} color={colors.brand[600]} />} />;
}
