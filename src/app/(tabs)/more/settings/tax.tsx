import React from 'react';
import { Percent } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function TaxSettings() {
  return <DevPlaceholderScreen title="Tax" icon={<Percent size={28} color={colors.brand[600]} />} />;
}
