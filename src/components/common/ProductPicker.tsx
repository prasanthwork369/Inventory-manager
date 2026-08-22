/**
 * Ported from the web reference's src/components/common/ProductPicker.tsx.
 * Lives in components/common (not features/products) matching the web
 * source's own structure — there it's imported by NewSale.tsx and
 * StockEntry.tsx (Sales/Stock), proving cross-feature reuse in the
 * inspected project, even though those features aren't built yet here.
 *
 * Data is injected via props (`products`, `currencySymbol`), not fetched
 * internally — this component has no idea a temporary provider or SQLite
 * exists. Whichever feature uses it owns fetching the product list.
 */
import React, { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Product } from '../../features/products/types';
import { formatMoney } from '../../features/products/utils/money';
import { getStockStatus } from '../../features/products/utils/stockStatus';
import { colors, radius, spacing, withOpacity } from '../../theme';
import { AppSheet } from '../ui/AppSheet';
import { AppText } from '../ui/AppText';
import { SearchInput } from '../ui/Fields';
import { EmptyState } from '../ui/States';
import { ProductThumb } from './ProductThumb';

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  products: Product[];
  currencySymbol: string;
  title?: string;
  excludeOutOfStock?: boolean;
}

const RESULT_LIMIT = 60;

export function ProductPicker({
  open,
  onClose,
  onSelect,
  products,
  currencySymbol,
  title = 'Choose a product',
  excludeOutOfStock,
}: ProductPickerProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (excludeOutOfStock ? p.currentStock > 0 : true))
      .filter((p) => (q ? `${p.name} ${p.sku} ${p.barcode ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(q) : true))
      .slice(0, RESULT_LIMIT);
  }, [products, query, excludeOutOfStock]);

  return (
    <AppSheet open={open} onClose={onClose} title={title} description="Search by name, SKU or barcode." size="lg">
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search products..." style={styles.search} />
      {results.length === 0 ? (
        <EmptyState
          icon={<SearchX size={28} color={colors.brand[600]} />}
          title="No products found"
          message={query ? `Nothing matches "${query}". Try a different name or SKU.` : 'No products available.'}
        />
      ) : (
        <View style={styles.list}>
          {results.map((p) => {
            const status = getStockStatus(p);
            const statusColor = status === 'out' ? colors.bad[600] : status === 'low' ? colors.warn[600] : colors.ink[400];
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  onSelect(p);
                  onClose();
                  setQuery('');
                }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <ProductThumb product={p} size="sm" />
                <View style={styles.body}>
                  <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                    {p.name}
                  </AppText>
                  <AppText size={12} color={colors.ink[400]} numberOfLines={1}>
                    SKU {p.sku}
                  </AppText>
                </View>
                <View style={styles.trailing}>
                  <AppText size={14} weight="bold" color={colors.ink.DEFAULT} tabular>
                    {formatMoney(p.sellingPriceMinor, currencySymbol)}
                  </AppText>
                  <AppText size={12} weight="semibold" color={statusColor} tabular>
                    {p.currentStock} in stock
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </AppSheet>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing[3] },
  list: { gap: spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    padding: spacing[2.5],
  },
  rowPressed: { backgroundColor: withOpacity(colors.brand[50], 50), borderColor: colors.brand[200] },
  body: { flex: 1, minWidth: 0 },
  trailing: { alignItems: 'flex-end', gap: 2 },
});
