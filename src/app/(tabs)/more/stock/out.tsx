import React from 'react';
import { ArrowUpFromLine } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function StockOut() {
  return <DevPlaceholderScreen title="Stock Out" icon={<ArrowUpFromLine size={28} color={colors.brand[600]} />} />;
}
