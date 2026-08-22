/**
 * Ported from the web reference's src/components/common/ProductRow.tsx.
 *
 * Chevron color: web sets `text-ink-300` with no explicit color anywhere
 * up its ancestor chain — per the empirical finding from the parity-patch
 * phase (compiled the web project's actual Tailwind output), that class
 * resolves to zero CSS and inherits the ambient body color (ink.DEFAULT,
 * near-black), not a light gray. Used accordingly, same as Dashboard's
 * GlanceRow.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProductThumb } from '@/components/common/ProductThumb';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, shadows, spacing, withOpacity } from '@/theme';
import type { Product } from '../types';
import { formatMoney } from '../utils/money';
import { getStockStatus } from '../utils/stockStatus';
import { StockBadge } from './StockBadge';

interface ProductRowProps {
  product: Product;
  currencySymbol: string;
  onPress?: () => void;
  right?: React.ReactNode;
}

export function ProductRow({ product, currencySymbol, onPress, right }: ProductRowProps) {
  const status = getStockStatus(product);
  const stockColor = status === 'out' ? colors.bad[600] : status === 'low' ? colors.warn[600] : colors.ink[700];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <ProductThumb product={product} />
      <View style={styles.body}>
        <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
          {product.name}
        </AppText>
        <AppText size={12.5} color={colors.ink[400]} numberOfLines={1} style={styles.subtitle}>
          SKU {product.sku}
          {product.brand ? ` · ${product.brand}` : ''}
        </AppText>
        <View style={styles.stockRow}>
          <AppText size={13} weight="bold" color={stockColor} tabular>
            {product.currentStock} units
          </AppText>
          <View style={styles.dot} />
          <AppText size={12.5} weight="medium" color={colors.ink[500]}>
            min {product.minimumStock}
          </AppText>
        </View>
      </View>
      <View style={styles.trailing}>
        <AppText size={16} weight="bold" color={colors.ink.DEFAULT} tabular>
          {formatMoney(product.sellingPriceMinor, currencySymbol)}
        </AppText>
        <StockBadge product={product} />
      </View>
      {right ?? <ChevronRight size={18} color={colors.ink.DEFAULT} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[3],
    ...shadows.card,
  },
  rowPressed: { backgroundColor: withOpacity(colors.brand[50], 40), borderColor: colors.brand[200] },
  body: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 2 },
  stockRow: { marginTop: spacing[1.5], flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  dot: { height: 4, width: 4, borderRadius: 2, backgroundColor: colors.ink[200] },
  trailing: { alignItems: 'flex-end', gap: spacing[1.5], flexShrink: 0 },
});
