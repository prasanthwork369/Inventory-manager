/**
 * Direct port of the web reference's src/pages/purchases/PurchasesHome.tsx.
 * `lg:grid-cols-3` is desktop-only; the web renders a single column at
 * mobile width (main column, then "Suppliers with balance"), so this is
 * that same DOM order, not a redesign.
 *
 * "Suppliers with balance" always renders the web's own empty state
 * ("No outstanding supplier balances.") — Phase 8 deliberately removed
 * `outstanding` from the Supplier entity (it's a future derived
 * financial aggregate, not intrinsic party data) and no credit-ledger
 * feature exists yet to compute a real per-supplier balance, so there is
 * honestly nothing to list, not a fake substitute.
 */
import React from 'react';
import { router } from 'expo-router';
import { Plus, ShoppingCart } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { SearchInput, Segmented, Select } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, PAYMENT_STATUS_OPTIONS, RANGE_OPTIONS } from '../constants';
import { usePurchases } from '../hooks/usePurchases';
import type { Purchase, PurchasePaymentStatus } from '../types';
import { dateLabel } from '../utils/format';

const STATUS_TONE: Record<PurchasePaymentStatus, 'good' | 'warn' | 'bad'> = {
  Paid: 'good',
  Partial: 'warn',
  Unpaid: 'bad',
};

export function PurchasesListScreen() {
  const { status, purchases, summary, suppliers, filters, updateFilters, refetch } = usePurchases();

  return (
    <Screen
      title="Purchases"
      subtitle={status === 'ready' ? `${purchases.length} shown` : undefined}
      back={false}
      wide
      actions={
        <Button size="sm" icon={<Plus size={16} color={colors.white} />} onPress={() => router.push('/purchases/new')}>
          New
        </Button>
      }
    >
      <View style={styles.stack}>
        {summary && (
          <Card style={styles.summaryCard}>
            <AppText size={13} weight="semibold" color={colors.ink[500]}>
              Purchases this month
            </AppText>
            <AppText size={32} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.summaryAmount}>
              {formatMoney(summary.monthTotalMinor, CURRENCY_SYMBOL)}
            </AppText>
            <AppText size={13} color={colors.ink[400]} style={styles.summaryCaption}>
              {summary.monthCount} purchase orders received
            </AppText>
            <View style={styles.metricsRow}>
              <Metric label="Today" value={formatMoney(summary.todayTotalMinor, CURRENCY_SYMBOL)} caption={`${summary.todayCount} received`} />
              <Metric label="Unpaid" value={formatMoney(summary.unpaidTotalMinor, CURRENCY_SYMBOL)} caption={`${summary.unpaidCount} pending`} />
              <Metric label="Suppliers" value={`${summary.supplierCount}`} caption="active" />
            </View>
          </Card>
        )}

        <View>
          <SectionHeader title="Purchase history" action="Purchase report" onAction={() => router.push('/reports/purchases')} />

          <View style={styles.filtersStack}>
            <SearchInput value={filters.query} onChangeText={(query) => updateFilters({ query })} placeholder="Search reference or supplier..." />
            <View style={styles.filtersRow}>
              <Segmented
                value={String(filters.rangeDays) as '1' | '7' | '30' | 'all'}
                onChange={(v) => updateFilters({ rangeDays: v === 'all' ? 'all' : ((Number(v) as 1 | 7 | 30) ?? 30) })}
                options={RANGE_OPTIONS}
              />
            </View>
            <View style={styles.filtersRow}>
              <View style={styles.filterSelect}>
                <Select
                  value={filters.supplierId}
                  onChange={(supplierId) => updateFilters({ supplierId })}
                  options={[{ value: 'all', label: 'All suppliers' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
                  sheetTitle="Supplier"
                />
              </View>
              <View style={styles.filterSelect}>
                <Select
                  value={filters.paymentStatus}
                  onChange={(paymentStatus) => updateFilters({ paymentStatus })}
                  options={[{ value: 'all', label: 'Any status' }, ...PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
                  sheetTitle="Payment status"
                />
              </View>
            </View>
          </View>

          {status === 'loading' && <ListSkeleton rows={5} />}

          {status === 'error' && (
            <ErrorNotice title="Couldn't load purchases" message="Something went wrong loading your purchases. Try again." action="Retry" onAction={refetch} />
          )}

          {status === 'ready' && purchases.length === 0 && (
            <EmptyState
              icon={<ShoppingCart size={28} color={colors.brand[600]} />}
              title="No purchases here"
              message="Record a purchase when new stock arrives and your inventory updates automatically."
              actionLabel="New purchase"
              onAction={() => router.push('/purchases/new')}
            />
          )}

          {status === 'ready' && purchases.length > 0 && (
            <Card style={styles.overflowHidden}>
              {purchases.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider />}
                  <PurchaseRow purchase={p} onPress={() => router.push(`/more/purchases/${p.id}`)} />
                </View>
              ))}
            </Card>
          )}
        </View>

        <View>
          <SectionHeader title="Suppliers with balance" action="All" onAction={() => router.push('/more/suppliers')} />
          <Card style={styles.overflowHidden}>
            <AppText size={13.5} color={colors.ink[500]} style={styles.noBalanceText}>
              No outstanding supplier balances.
            </AppText>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

function PurchaseRow({ purchase, onPress }: { purchase: Purchase; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.flex1}>
        <View style={styles.rowTop}>
          <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1} style={styles.flex1}>
            {purchase.supplierName}
          </AppText>
          <Badge tone={STATUS_TONE[purchase.paymentStatus]}>{purchase.paymentStatus}</Badge>
        </View>
        <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
          {purchase.reference} · {purchase.items.length} items · {dateLabel(purchase.createdAt)}
        </AppText>
      </View>
      <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
        {formatMoney(purchase.totalMinor, CURRENCY_SYMBOL)}
      </AppText>
    </Pressable>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <View style={styles.flex1}>
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={17} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.metricValue}>
        {value}
      </AppText>
      <AppText size={11.5} color={colors.ink[400]}>
        {caption}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  summaryCard: { padding: spacing[5] },
  summaryAmount: { marginTop: spacing[1], lineHeight: 32, letterSpacing: -0.8 },
  summaryCaption: { marginTop: spacing[1.5] },
  metricsRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingTop: spacing[4],
  },
  metricValue: { marginTop: 2 },
  filtersStack: { marginBottom: spacing[3], gap: spacing[2.5] },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] },
  filterSelect: { flex: 1, minWidth: 140 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  rowPressed: { backgroundColor: colors.ink[50] },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  noBalanceText: { textAlign: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[6] },
});
