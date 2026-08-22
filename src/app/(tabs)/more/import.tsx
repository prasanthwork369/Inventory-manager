import React from 'react';
import { Upload } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ImportProducts() {
  return <DevPlaceholderScreen title="Import products" icon={<Upload size={28} color={colors.brand[600]} />} />;
}
