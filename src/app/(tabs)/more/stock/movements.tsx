import React from 'react';
import { History } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function StockMovements() {
  return <DevPlaceholderScreen title="Stock movements" icon={<History size={28} color={colors.brand[600]} />} />;
}
