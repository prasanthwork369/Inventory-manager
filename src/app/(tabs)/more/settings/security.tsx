import React from 'react';
import { LockKeyhole } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function SecuritySettings() {
  return <DevPlaceholderScreen title="Security" icon={<LockKeyhole size={28} color={colors.brand[600]} />} />;
}
