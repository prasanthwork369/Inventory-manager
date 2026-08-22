import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProductFormScreen } from '@/features/products/screens/ProductFormScreen';

export default function ProductEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductFormScreen productId={id} />;
}
