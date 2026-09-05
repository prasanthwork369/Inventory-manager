/**
 * Direct port of the web reference's src/pages/reports/InventoryReport.tsx.
 * Only the mobile Card-list branch is ported — the web's own desktop
 * `<table>` is `hidden lg:block` (never visible below the `lg` breakpoint),
 * so it never renders at phone width in the source either, same reasoning
 * already applied to every other desktop-table/grid branch in this app.
 * No supplier field on each row: Product has no supplierId in this
 * project's schema (see reports/types.ts).
 */
import React from 'react';
import { router } from 'expo-router';
import { ArrowDownToLine, CheckCircle2, Download, PackageX, TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchInput, Select } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { ProductThumb } from '@/components/common/ProductThumb';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL } from '../constants';
import { useInventoryReport } from '../hooks/useInventoryReport';
import type { InventoryReportMode, InventoryReportRow } from '../types';
import { formatCompactMoney } from '../utils/money';

const META: Record<InventoryReportMode, { title: string; subtitle: string }> = {
  all: { title: 'Inventory report', subtitle: 'Everything you hold and what it is worth' },
  low: { title: 'Low stock', subtitle: 'Products at or below their minimum' },
  out: { title: 'Out of stock', subtitle: 'Products you cannot sell right now' },
};

interface InventoryReportScreenProps {
  mode: InventoryReportMode;
}

export function InventoryReportScreen({ mode }: InventoryReportScreenProps) {
  const toast = useToast();
  const { status, view, categories, filters, updateFilters, clearFilters, refetch } = useInventoryReport(mode);
  const meta = META[mode];

  if (status === 'loading') {
    return (
      <Screen title={meta.title} subtitle={meta.subtitle} wide>
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title={meta.title} subtitle={meta.subtitle} wide>
        <ErrorNotice title="Couldn't load report" message="Something went wrong loading this report. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!view || view.totalBase === 0) {
    return (
      <Screen title={meta.title} subtitle={meta.subtitle} wide>
        <EmptyState
          icon={<CheckCircle2 size={28} color={colors.brand[600]} />}
          title={mode === 'out' ? 'Nothing is out of stock' : mode === 'low' ? 'No products are running low' : 'No products yet'}
          message={mode === 'all' ? 'Add products to see your inventory valuation here.' : 'Your shelves are healthy. This list fills up when stock drops below the minimum you set.'}
          actionLabel={mode === 'all' ? 'Add product' : 'View all products'}
          onAction={() => router.push(mode === 'all' ? '/products/new' : '/products')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={meta.title}
      subtitle={`${view.rows.length} products`}
      wide
      actions={
        <Button size="sm" variant="secondary" icon={<Download size={16} color={colors.ink.DEFAULT} />} onPress={() => toast(`${meta.title} exported as CSV.`, 'info')}>
          Export
        </Button>
      }
    >
      <View style={styles.stack}>
        {mode === 'all' && view.stockValueCostMinor !== undefined && view.stockValueSellingMinor !== undefined && (
          <Card style={styles.statsCard}>
            <Head label="Stock value (cost)" value={formatCompactMoney(view.stockValueCostMinor, CURRENCY_SYMBOL)} />
            <Head label="Selling value" value={formatCompactMoney(view.stockValueSellingMinor, CURRENCY_SYMBOL)} />
            <Head label="Potential margin" value={formatCompactMoney(view.stockValueSellingMinor - view.stockValueCostMinor, CURRENCY_SYMBOL)} />
          </Card>
        )}

        <View style={styles.filtersRow}>
          <SearchInput value={filters.query} onChangeText={(query) => updateFilters({ query })} placeholder="Search products..." style={styles.flex1} />
          <View style={styles.categorySelect}>
            <Select
              value={filters.categoryId}
              onChange={(categoryId) => updateFilters({ categoryId })}
              options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              sheetTitle="Category"
            />
          </View>
        </View>

        {view.rows.length === 0 ? (
          <EmptyState
            icon={mode === 'out' ? <PackageX size={28} color={colors.brand[600]} /> : <TriangleAlert size={28} color={colors.brand[600]} />}
            title="No products match"
            message="Try clearing the search or choosing a different category."
            actionLabel="Clear search"
            onAction={clearFilters}
          />
        ) : (
          <View style={styles.rows}>
            {view.rows.map((row) => (
              <InventoryRow key={row.product.id} mode={mode} row={row} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function InventoryRow({ mode, row }: { mode: InventoryReportMode; row: InventoryReportRow }) {
  const { product, status, lastSaleReceiptNo, suggestedQuantity } = row;
  const badgeTone = status === 'out' ? 'bad' : status === 'low' ? 'warn' : 'good';

  return (
    <Card style={styles.rowCard}>
      <Pressable onPress={() => router.push(`/products/${product.id}`)} style={styles.rowTop}>
        <ProductThumb product={product} />
        <View style={styles.flex1}>
          <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
            {product.name}
          </AppText>
          <AppText size={12.5} color={colors.ink[400]}>
            SKU {product.sku}
          </AppText>
        </View>
        <Badge tone={badgeTone} dot>
          {product.currentStock} left
        </Badge>
      </Pressable>
      <View style={styles.rowBottom}>
        <AppText size={12.5} tabular color={colors.ink[500]}>
          {mode === 'all' && (
            <>
              Value <AppText size={12.5} weight="bold" tabular color={colors.ink.DEFAULT}>{formatMoney(product.currentStock * product.purchasePriceMinor, CURRENCY_SYMBOL)}</AppText>
            </>
          )}
          {mode === 'low' && (
            <>
              Minimum {product.minimumStock} · suggest <AppText size={12.5} weight="bold" tabular color={colors.ink.DEFAULT}>{suggestedQuantity} units</AppText>
            </>
          )}
          {mode === 'out' && <>Last sale {lastSaleReceiptNo ?? '—'}</>}
        </AppText>
        <Button size="sm" icon={<ArrowDownToLine size={14} color={colors.white} />} onPress={() => router.push('/more/stock/in')}>
          Stock In
        </Button>
      </View>
    </Card>
  );
}

function Head({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex1}>
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={19} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.headValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  statsCard: { flexDirection: 'row', gap: spacing[3], padding: spacing[4] },
  headValue: { marginTop: 2 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  categorySelect: { minWidth: 160 },
  rows: { gap: spacing[2.5] },
  rowCard: { padding: spacing[3.5] },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  rowBottom: {
    marginTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingTop: spacing[3],
  },
});
