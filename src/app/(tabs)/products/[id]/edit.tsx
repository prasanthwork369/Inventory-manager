import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function ProductEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Edit product ${id}`} icon={<Pencil size={28} color={colors.brand[600]} />} />;
}
