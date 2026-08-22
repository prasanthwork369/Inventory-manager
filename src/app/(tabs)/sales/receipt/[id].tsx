import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Printer } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function Receipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Receipt ${id}`} icon={<Printer size={28} color={colors.brand[600]} />} />;
}
