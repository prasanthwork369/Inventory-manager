import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { colors } from '@/theme';
import { DevPlaceholderScreen } from '@/components/dev/DevPlaceholderScreen';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DevPlaceholderScreen title={`Customer ${id}`} icon={<Users size={28} color={colors.brand[600]} />} />;
}
