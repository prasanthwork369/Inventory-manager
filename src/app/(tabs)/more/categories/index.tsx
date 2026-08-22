import React from 'react';
import { Tag } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Categories() {
  return <DevPlaceholderScreen title="Categories" icon={<Tag size={28} color={colors.brand[600]} />} />;
}
