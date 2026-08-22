/**
 * Direct port of the web reference's src/pages/stock/Movements.tsx.
 * `reportMode` isn't ported — it's only ever passed from the (out of
 * scope) Reports feature; this screen serves `/more/stock/movements`
 * only, with the same title/behavior as the web's default (non-report)
 * mode.
 */
import React from 'react';
import { History, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { AppSheet } from '@/components/ui/AppSheet';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider } from '@/components/ui/Card';
import { Field, SearchInput, Select } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { MOVEMENT_TYPE_FILTER_OPTIONS } from '../constants';
import { MovementSheet, movementLabel, movementTone } from '../components/MovementSheet';
import { useMovements } from '../hooks/useMovements';
import type { StockMovementFilters } from '../types';
import { timeLabel } from '../utils/format';
import { formatSignedQuantity } from '../utils/quantity';

const RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

export function MovementsScreen() {
  const {
    status,
    movements,
    products,
    filters,
    updateFilters,
    resetFilterFields,
    clearAllFilters,
    activeFilterCount,
    groupedMovements,
    refetch,
    filterSheetOpen,
    setFilterSheetOpen,
    selected,
    setSelected,
  } = useMovements();

  return (
    <Screen title="Stock movements" subtitle={status === 'ready' ? `${movements.length} movements` : undefined} wide>
      <View style={styles.searchRow}>
        <SearchInput
          value={filters.query}
          onChangeText={(query) => updateFilters({ query })}
          placeholder="Search product or reference..."
          style={styles.flex1}
        />
        <Pressable onPress={() => setFilterSheetOpen(true)} style={styles.filtersButton} accessibilityRole="button">
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

      {status === 'loading' && <ListSkeleton rows={6} />}

      {status === 'error' && (
        <ErrorNotice
          title="Couldn't load movements"
          message="Something went wrong loading stock movements. Try again."
          action="Retry"
          onAction={refetch}
        />
      )}

      {status === 'ready' && movements.length === 0 && (
        <EmptyState
          icon={<History size={28} color={colors.brand[600]} />}
          title="No movements found"
          message="Nothing matches these filters yet. Every sale, purchase and adjustment lands here automatically."
          actionLabel="Clear filters"
          onAction={clearAllFilters}
        />
      )}

      {status === 'ready' && movements.length > 0 && (
        <View style={styles.groups}>
          {groupedMovements.map(([day, items]) => (
            <View key={day}>
              <AppText size={13} weight="bold" color={colors.ink[500]} style={styles.dayHeading}>
                {day}
              </AppText>
              <Card style={styles.overflowHidden}>
                {items.map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <Divider />}
                    <Pressable
                      onPress={() => setSelected(m)}
                      style={({ pressed }) => [styles.movementRow, pressed && styles.movementRowPressed]}
                    >
                      <View style={styles.badgeSlot}>
                        <Badge tone={movementTone[m.type]}>{movementLabel[m.type]}</Badge>
                      </View>
                      <View style={styles.movementBody}>
                        <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                          {m.productName}
                        </AppText>
                        <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
                          {m.reason} · {m.reference} · {timeLabel(m.createdAt)}
                        </AppText>
                      </View>
                      <View style={styles.movementTrailing}>
                        <AppText
                          size={15}
                          weight="bold"
                          tabular
                          color={m.quantityDelta > 0 ? colors.good[600] : m.quantityDelta < 0 ? colors.bad[600] : colors.ink[400]}
                        >
                          {formatSignedQuantity(m.quantityDelta)}
                        </AppText>
                        <AppText size={11.5} tabular color={colors.ink[400]}>
                          {m.quantityBefore} → {m.quantityAfter}
                        </AppText>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </View>
      )}

      <AppSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter movements"
        footer={
          <View style={styles.sheetFooter}>
            <View style={styles.flex1}>
              <Button variant="secondary" block onPress={resetFilterFields}>
                Reset
              </Button>
            </View>
            <View style={styles.flex1}>
              <Button block onPress={() => setFilterSheetOpen(false)}>
                Show {movements.length}
              </Button>
            </View>
          </View>
        }
      >
        <View style={styles.sheetFields}>
          <Field label="Movement type">
            <Select
              value={filters.type}
              onChange={(value) => updateFilters({ type: value })}
              options={[{ value: 'all', label: 'All types' }, ...MOVEMENT_TYPE_FILTER_OPTIONS]}
              sheetTitle="Movement type"
            />
          </Field>
          <Field label="Product">
            <Select
              value={filters.productId}
              onChange={(value) => updateFilters({ productId: value })}
              options={[{ value: 'all', label: 'All products' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
              sheetTitle="Product"
            />
          </Field>
          <Field label="Date range">
            <Select
              value={String(filters.rangeDays)}
              onChange={(value) =>
                updateFilters({ rangeDays: (value === 'all' ? 'all' : Number(value)) as StockMovementFilters['rangeDays'] })
              }
              options={RANGE_OPTIONS}
              sheetTitle="Date range"
            />
          </Field>
        </View>
      </AppSheet>

      <MovementSheet movement={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  overflowHidden: { overflow: 'hidden' },
  searchRow: { marginBottom: spacing[4], flexDirection: 'row', gap: spacing[2] },
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
  groups: { gap: spacing[5] },
  dayHeading: { paddingHorizontal: spacing[1], paddingBottom: spacing[2] },
  movementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  movementRowPressed: { backgroundColor: colors.ink[50] },
  badgeSlot: { width: 74 },
  movementBody: { flex: 1, minWidth: 0 },
  movementTrailing: { alignItems: 'flex-end' },
  sheetFooter: { flexDirection: 'row', gap: spacing[3] },
  sheetFields: { gap: spacing[4] },
});
