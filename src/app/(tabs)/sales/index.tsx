import React from 'react';
import { ReceiptIndianRupee } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function SalesTab() {
  return <DevPlaceholderScreen title="Sales" icon={<ReceiptIndianRupee size={28} color={colors.brand[600]} />} back={false} />;
}
