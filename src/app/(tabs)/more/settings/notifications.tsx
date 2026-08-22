import React from 'react';
import { Bell } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function NotificationSettings() {
  return <DevPlaceholderScreen title="Notifications" icon={<Bell size={28} color={colors.brand[600]} />} />;
}
