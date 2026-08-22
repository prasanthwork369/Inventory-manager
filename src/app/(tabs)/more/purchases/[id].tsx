import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function PurchaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Purchase ${id}`} icon={<ShoppingCart size={28} color={colors.brand[600]} />} />;
}
