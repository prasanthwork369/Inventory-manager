import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Package } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Product ${id}`} icon={<Package size={28} color={colors.brand[600]} />} />;
}
