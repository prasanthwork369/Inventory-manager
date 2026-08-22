import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProductListScreen } from '@/features/products/screens/ProductListScreen';

export default function ProductsTab() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  return <ProductListScreen initialCategoryId={category} />;
}
