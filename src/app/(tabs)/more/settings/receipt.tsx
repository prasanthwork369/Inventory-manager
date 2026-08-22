import React from 'react';
import { ReceiptText } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ReceiptSettings() {
  return <DevPlaceholderScreen title="Receipt settings" icon={<ReceiptText size={28} color={colors.brand[600]} />} />;
}
