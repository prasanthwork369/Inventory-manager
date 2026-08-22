import React from 'react';
import { Store } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function BusinessSettings() {
  return <DevPlaceholderScreen title="Business profile" icon={<Store size={28} color={colors.brand[600]} />} />;
}
