import React from 'react';
import { ReceiptIndianRupee } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function SalesReport() {
  return <DevPlaceholderScreen title="Sales report" icon={<ReceiptIndianRupee size={28} color={colors.brand[600]} />} />;
}
