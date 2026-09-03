/**
 * Direct port of the web reference's src/pages/sales/SalesHome.tsx.
 * `lg:grid-cols-3` is desktop-only; the web renders a single column at
 * mobile width (main column, then Shortcuts/Payment mix), so this is
 * that same DOM order, not a redesign.
 */
import React from 'react';
import { router } from 'expo-router';
import { Plus, ReceiptIndianRupee, SearchX } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { SearchInput, Segmented, Select } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, PAYMENT_METHODS, RANGE_OPTIONS } from '../constants';
import { useSales } from '../hooks/useSales';
import type { Sale, SaleStatus } from '../types';
import { timeLabel } from '../utils/format';

const SHORTCUTS: { label: string; to: '/reports/sales' | '/reports/profit' | '/more/customers' | '/more/settings/receipt' }[] = [
  { label: 'Sales report', to: '/reports/sales' },
  { label: 'Profit report', to: '/reports/profit' },
  { label: 'Customers', to: '/more/customers' },
  { label: 'Receipt settings', to: '/more/settings/receipt' },
];

export function SalesListScreen() {
  const { status, sales, groupedSales, summary, customers, filters, updateFilters, refetch } = useSales();

  return (
    <Screen
      title="Sales"
      subtitle={status === 'ready' ? `${sales.length} transactions shown` : undefined}
      back={false}
      wide
      actions={
        <Button size="sm" icon={<Plus size={16} color={colors.white} />} onPress={() => router.push('/sales/new')}>
          New Sale
        </Button>
      }
    >
      <View style={styles.stack}>
        {summary && (
          <Card style={styles.summaryCard}>
            <AppText size={13} weight="semibold" color={colors.ink[500]}>
              Today&apos;s sales
            </AppText>
            <AppText size={34} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.summaryAmount}>
              {formatMoney(summary.todayTotalMinor, CURRENCY_SYMBOL)}
            </AppText>
            <AppText size={13} color={colors.ink[400]} style={styles.summaryCaption}>
              {summary.todayCount} transactions · {formatMoney(summary.todayProfitMinor, CURRENCY_SYMBOL)} estimated profit
            </AppText>
            <View style={styles.metricsRow}>
              <Metric label="This week" value={formatMoney(summary.weekTotalMinor, CURRENCY_SYMBOL)} caption={`${summary.weekCount} sales`} />
              <Metric label="This month" value={formatMoney(summary.monthTotalMinor, CURRENCY_SYMBOL)} caption={`${summary.monthCount} sales`} />
              <Metric label="Est. profit (30d)" value={formatMoney(summary.monthProfitMinor, CURRENCY_SYMBOL)} caption="after cost" />
            </View>
          </Card>
        )}

        <View>
          <SectionHeader title="Sales history" action="Sales report" onAction={() => router.push('/reports/sales')} />

          <View style={styles.filtersStack}>
            <SearchInput value={filters.query} onChangeText={(query) => updateFilters({ query })} placeholder="Search receipt number or customer..." />
            <View style={styles.filtersRow}>
              <Segmented
                value={String(filters.rangeDays) as '1' | '7' | '30' | 'all'}
                onChange={(v) => updateFilters({ rangeDays: v === 'all' ? 'all' : ((Number(v) as 1 | 7 | 30) ?? 1) })}
                options={RANGE_OPTIONS}
              />
            </View>
            <View style={styles.filtersRow}>
              <View style={styles.filterSelect}>
                <Select
                  value={filters.paymentMethod}
                  onChange={(paymentMethod) => updateFilters({ paymentMethod })}
                  options={[{ value: 'all', label: 'All payments' }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: m }))]}
                  sheetTitle="Payment method"
                />
              </View>
              <View style={styles.filterSelect}>
                <Select
                  value={filters.customerId}
                  onChange={(customerId) => updateFilters({ customerId })}
                  options={[{ value: 'all', label: 'All customers' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
                  sheetTitle="Customer"
                />
              </View>
            </View>
          </View>

          {status === 'loading' && <ListSkeleton rows={5} />}

          {status === 'error' && (
            <ErrorNotice title="Couldn't load sales" message="Something went wrong loading your sales. Try again." action="Retry" onAction={refetch} />
          )}

          {status === 'ready' && sales.length === 0 && (
            <EmptyState
              icon={filters.query ? <SearchX size={28} color={colors.brand[600]} /> : <ReceiptIndianRupee size={28} color={colors.brand[600]} />}
              title={filters.query ? 'No matching sales' : 'No sales in this period'}
              message={
                filters.query
                  ? `Nothing found for "${filters.query}". Try a different receipt number or customer.`
                  : 'Record your first sale and it will appear here with its receipt.'
              }
              actionLabel="New Sale"
              onAction={() => router.push('/sales/new')}
              secondaryLabel={filters.query ? 'Clear search' : undefined}
              onSecondary={filters.query ? () => updateFilters({ query: '' }) : undefined}
            />
          )}

          {status === 'ready' && sales.length > 0 && (
            <View style={styles.groups}>
              {groupedSales.map(([day, list]) => (
                <View key={day}>
                  <View style={styles.dayHeadingRow}>
                    <AppText size={13} weight="bold" color={colors.ink[500]}>
                      {day}
                    </AppText>
                    <AppText size={13} weight="bold" tabular color={colors.ink[700]}>
                      {formatMoney(
                        list.reduce((sum, s) => sum + s.totalMinor, 0),
                        CURRENCY_SYMBOL
                      )}
                    </AppText>
                  </View>
                  <Card style={styles.overflowHidden}>
                    {list.map((s, i) => (
                      <View key={s.id}>
                        {i > 0 && <Divider />}
                        <SaleRow sale={s} onPress={() => router.push(`/sales/${s.id}`)} />
                      </View>
                    ))}
                  </Card>
                </View>
              ))}
            </View>
          )}
        </View>

        <View>
          <SectionHeader title="Shortcuts" />
          <Card style={styles.overflowHidden}>
            {SHORTCUTS.map((s, i) => (
              <View key={s.to}>
                {i > 0 && <Divider />}
                <Pressable onPress={() => router.push(s.to)} style={({ pressed }) => [styles.shortcutRow, pressed && styles.rowPressed]}>
                  <AppText size={14} weight="semibold" color={colors.ink.DEFAULT}>
                    {s.label}
                  </AppText>
                </Pressable>
              </View>
            ))}
          </Card>
        </View>

        {summary && (
          <View>
            <SectionHeader title="Payment mix" />
            <Card style={styles.paymentMixCard}>
              {PAYMENT_METHODS.map((m) => {
                const value = summary.paymentMixMinor[m];
                const totalMonth = summary.monthTotalMinor || 1;
                const pct = Math.min((value / totalMonth) * 100, 100);
                return (
                  <View key={m}>
                    <View style={styles.mixRow}>
                      <AppText size={12.5} weight="semibold" color={colors.ink[700]}>
                        {m}
                      </AppText>
                      <AppText size={12.5} weight="bold" tabular color={colors.ink.DEFAULT}>
                        {formatMoney(value, CURRENCY_SYMBOL)}
                      </AppText>
                    </View>
                    <View style={styles.mixTrack}>
                      <View style={[styles.mixFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}
      </View>
    </Screen>
  );
}

const STATUS_LABEL: Record<Exclude<SaleStatus, 'completed'>, string> = {
  returned: 'Returned',
  'part-returned': 'Part returned',
};

function SaleRow({ sale, onPress }: { sale: Sale; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.flex1}>
        <View style={styles.rowTop}>
          <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1} style={styles.flex1}>
            {sale.receiptNo}
          </AppText>
          {sale.status !== 'completed' && <Badge tone="warn">{STATUS_LABEL[sale.status]}</Badge>}
        </View>
        <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
          {sale.customerName} · {sale.items.length} items · {timeLabel(sale.createdAt)}
        </AppText>
      </View>
      <View style={styles.trailing}>
        <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
          {formatMoney(sale.totalMinor, CURRENCY_SYMBOL)}
        </AppText>
        <AppText size={11.5} weight="semibold" color={colors.ink[400]}>
          {sale.paymentMethod}
        </AppText>
      </View>
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
  summaryAmount: { marginTop: spacing[1], lineHeight: 34, letterSpacing: -0.85 },
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
  groups: { gap: spacing[5] },
  dayHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing[1], paddingBottom: spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  rowPressed: { backgroundColor: colors.ink[50] },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  trailing: { alignItems: 'flex-end', flexShrink: 0 },
  shortcutRow: { paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  paymentMixCard: { padding: spacing[4], gap: spacing[2] },
  mixRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  mixTrack: { marginTop: spacing[1], height: 6, borderRadius: radius.full, backgroundColor: colors.ink[100] },
  mixFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.brand[500] },
});
