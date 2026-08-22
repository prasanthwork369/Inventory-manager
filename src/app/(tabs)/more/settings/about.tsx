import React from 'react';
import { Info } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function AboutSettings() {
  return <DevPlaceholderScreen title="About" icon={<Info size={28} color={colors.brand[600]} />} />;
}
