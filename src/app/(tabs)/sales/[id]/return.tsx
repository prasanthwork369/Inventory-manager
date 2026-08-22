import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Undo2 } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function SaleReturn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Return sale ${id}`} icon={<Undo2 size={28} color={colors.brand[600]} />} />;
}
