import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Settings() {
  return <DevPlaceholderScreen title="Settings" icon={<SettingsIcon size={28} color={colors.brand[600]} />} />;
}
