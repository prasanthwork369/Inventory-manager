/**
 * Direct port of the web reference's src/pages/products/ProductList.tsx.
 * Section order/content preserved exactly: search + filters row -> status
 * segmented row -> results (empty state or row list) -> filter sheet.
 * `lg:grid-cols-2` is a desktop-only breakpoint the web source never
 * applies at mobile width either, so this is the same single-column list
 * web already renders on a phone-sized viewport — not a redesign.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { Boxes, Plus, ScanLine, SearchX, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { ROUTES } from '@/constants/routes';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { AppSheet } from '@/components/ui/AppSheet';
import { Field, Segmented, Select, SearchInput } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { ProductRow } from '../components/ProductRow';
import { useProducts } from '../hooks/useProducts';
import type { ProductStockStatus } from '../types';

const CURRENCY_SYMBOL = '₹';

const STATUS_OPTIONS: { value: ProductStockStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low' },
  { value: 'out', label: 'Out' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'stock', label: 'Stock (low to high)' },
  { value: 'price', label: 'Price (high to low)' },
  { value: 'recent', label: 'Recently added' },
] as const;

interface ProductListScreenProps {
  initialCategoryId?: string;
}

export function ProductListScreen({ initialCategoryId }: ProductListScreenProps) {
  const { status, products, categories, brands, filters, updateFilters, resetFilters, filteredProducts, activeFilterCount, refetch } =
    useProducts(initialCategoryId);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Screen
      title="Products"
      subtitle={status === 'ready' ? `${products.length} products · ${filteredProducts.length} shown` : undefined}
      back={false}
      wide
      actions={
        <>
          <IconButton accessibilityLabel="Scan barcode" onPress={() => router.push(ROUTES.scan)}>
            <ScanLine size={20} color={colors.ink[700]} />
          </IconButton>
          <Button size="sm" icon={<Plus size={16} color={colors.white} />} onPress={() => router.push(ROUTES.addProduct)}>
            Add
          </Button>
        </>
      }
    >
      <View style={styles.searchRow}>
        <SearchInput
          value={filters.query}
          onChangeText={(query) => updateFilters({ query })}
          placeholder="Search products, SKU or barcode..."
          style={styles.flex1}
        />
        <Pressable onPress={() => setFiltersOpen(true)} style={styles.filtersButton} accessibilityRole="button">
          <SlidersHorizontal size={18} color={colors.ink[700]} />
          <AppText size={14} weight="semibold" color={colors.ink[700]}>
            Filters
          </AppText>
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <AppText size={11} weight="bold" color={colors.white}>
                {activeFilterCount}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Segmented value={filters.status} onChange={(value) => updateFilters({ status: value })} options={STATUS_OPTIONS} />
        {activeFilterCount > 0 && (
          <Pressable onPress={resetFilters}>
            <AppText size={13} weight="semibold" color={colors.brand[600]}>
              Clear filters
            </AppText>
          </Pressable>
        )}
      </View>

      {status === 'loading' && <ListSkeleton rows={6} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load products" message="Something went wrong loading your catalogue. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && filteredProducts.length === 0 && (
        filters.query ? (
          <EmptyState
            icon={<SearchX size={28} color={colors.brand[600]} />}
            title="No products match your search"
            message={`Nothing found for "${filters.query}". Check the spelling, or add it as a new product.`}
            actionLabel="Add product"
            onAction={() => router.push(ROUTES.addProduct)}
            secondaryLabel="Clear search"
            onSecondary={() => updateFilters({ query: '' })}
          />
        ) : (
          <EmptyState
            icon={<Boxes size={28} color={colors.brand[600]} />}
            title="No products yet"
            message="Add your first product to start tracking stock, sales and purchases."
            actionLabel="Add product"
            onAction={() => router.push(ROUTES.addProduct)}
            secondaryLabel="Import from CSV"
            onSecondary={() => router.push('/more/import')}
          />
        )
      )}

      {status === 'ready' && filteredProducts.length > 0 && (
        <View style={styles.list}>
          {filteredProducts.map((p) => (
            <ProductRow key={p.id} product={p} currencySymbol={CURRENCY_SYMBOL} onPress={() => router.push(`/products/${p.id}`)} />
          ))}
        </View>
      )}

      <AppSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter & sort"
        description="Narrow down your product list."
        footer={
          <View style={styles.sheetFooter}>
            <Button variant="secondary" block onPress={resetFilters}>
              Reset
            </Button>
            <Button block onPress={() => setFiltersOpen(false)}>
              Show {filteredProducts.length} products
            </Button>
          </View>
        }
      >
        <View style={styles.sheetFields}>
          <Field label="Category">
            <Select
              value={filters.categoryId}
              onChange={(value) => updateFilters({ categoryId: value })}
              options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              sheetTitle="Category"
            />
          </Field>
          <Field label="Brand">
            <Select
              value={filters.brand}
              onChange={(value) => updateFilters({ brand: value })}
              options={[{ value: 'all', label: 'All brands' }, ...brands.map((b) => ({ value: b, label: b }))]}
              sheetTitle="Brand"
            />
          </Field>
          <Field label="Sort by">
            <Select
              value={filters.sort}
              onChange={(value) => updateFilters({ sort: value })}
              options={[...SORT_OPTIONS]}
              sheetTitle="Sort by"
            />
          </Field>
          <View style={styles.badgeRow}>
            <Badge tone="brand">{filteredProducts.length} matching</Badge>
            <Badge tone="neutral">{products.length} total</Badge>
          </View>
        </View>
      </AppSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  searchRow: { marginBottom: spacing[3], flexDirection: 'row', gap: spacing[2] },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    height: spacing[12],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3.5],
  },
  filterCountBadge: {
    height: spacing[5],
    width: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { marginBottom: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  list: { gap: spacing[2.5] },
  sheetFooter: { flexDirection: 'row', gap: spacing[3] },
  sheetFields: { gap: spacing[4] },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingTop: spacing[1] },
});
