import React from 'react';
import { ChartNoAxesColumn } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ReportsTab() {
  return <DevPlaceholderScreen title="Reports" icon={<ChartNoAxesColumn size={28} color={colors.brand[600]} />} back={false} />;
}
