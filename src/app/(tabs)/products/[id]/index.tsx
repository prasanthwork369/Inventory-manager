import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/features/products/screens/ProductDetailScreen';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen productId={id} />;
}
