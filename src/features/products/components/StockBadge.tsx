/**
 * Ported from the web reference's src/components/common/ProductRow.tsx
 * (StockBadge is co-located/exported there, not a separate web file).
 */
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '../types';
import { getStockStatus, stockStatusLabel } from '../utils/stockStatus';

const TONE_FOR_STATUS = { in: 'good', low: 'warn', out: 'bad' } as const;

interface StockBadgeProps {
  product: Pick<Product, 'currentStock' | 'minimumStock'>;
}

export function StockBadge({ product }: StockBadgeProps) {
  const status = getStockStatus(product);
  return (
    <Badge tone={TONE_FOR_STATUS[status]} dot>
      {stockStatusLabel[status]}
    </Badge>
  );
}
