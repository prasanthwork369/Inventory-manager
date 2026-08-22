import React from 'react';
import { Home } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function DashboardTab() {
  return <DevPlaceholderScreen title="Home" icon={<Home size={28} color={colors.brand[600]} />} back={false} />;
}
