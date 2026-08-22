import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function SaleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Sale ${id}`} icon={<ReceiptText size={28} color={colors.brand[600]} />} />;
}
