import React from 'react';
import { TrendingUp } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ProfitReport() {
  return <DevPlaceholderScreen title="Profit report" icon={<TrendingUp size={28} color={colors.brand[600]} />} />;
}
