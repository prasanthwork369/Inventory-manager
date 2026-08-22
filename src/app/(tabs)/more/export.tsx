import React from 'react';
import { Download } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ExportData() {
  return <DevPlaceholderScreen title="Export data" icon={<Download size={28} color={colors.brand[600]} />} />;
}
