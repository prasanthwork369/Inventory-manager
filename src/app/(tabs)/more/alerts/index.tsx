import React from 'react';
import { Bell } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Alerts() {
  return <DevPlaceholderScreen title="Alerts" icon={<Bell size={28} color={colors.brand[600]} />} />;
}
