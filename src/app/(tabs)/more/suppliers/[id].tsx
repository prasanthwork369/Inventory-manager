import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Truck } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function SupplierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Supplier ${id}`} icon={<Truck size={28} color={colors.brand[600]} />} />;
}
