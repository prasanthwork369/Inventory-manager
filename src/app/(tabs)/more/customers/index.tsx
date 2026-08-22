import React from 'react';
import { Users } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Customers() {
  return <DevPlaceholderScreen title="Customers" icon={<Users size={28} color={colors.brand[600]} />} />;
}
