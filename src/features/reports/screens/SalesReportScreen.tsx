/**
 * Direct port of the web reference's src/pages/reports/SalesReport.tsx.
 * The daily bar chart is a handful of plain Views (proportional height +
 * label per day) — simple enough to reproduce exactly without a chart
 * library, matching the web's own CSS-only bar implementation.
 * `lg:grid-cols-3` is desktop-only; single column at mobile width.
 */
import React from 'react';
import { router } from 'expo-router';
import { Download, ReceiptIndianRupee } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { Segmented, Select } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { PAYMENT_METHODS } from '@/features/sales/constants';
import { CURRENCY_SYMBOL, SALES_PROFIT_RANGE_OPTIONS } from '../constants';
import { useSalesReport } from '../hooks/useSalesReport';
import type { ReportRangeDays } from '../types';

export function SalesReportScreen() {
  const toast = useToast();
  const { status, view, categories, customers, filters, updateFilters, refetch } = useSalesReport();

  return (
    <Screen
      title="Sales report"
      subtitle={view ? `${view.transactionCount} transactions` : undefined}
      wide
      actions={
        <Button size="sm" variant="secondary" icon={<Download size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Sales report exported as PDF.', 'info')}>
          Export
        </Button>
      }
    >
      <View style={styles.filtersRow}>
        <Segmented
          value={String(filters.rangeDays) as '1' | '7' | '30' | '90'}
          onChange={(v) => updateFilters({ rangeDays: Number(v) as ReportRangeDays })}
          options={SALES_PROFIT_RANGE_OPTIONS}
        />
        <View style={styles.filterSelect}>
          <Select
            value={filters.categoryId}
            onChange={(categoryId) => updateFilters({ categoryId })}
            options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            sheetTitle="Category"
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
        <View style={styles.filterSelect}>
          <Select
            value={filters.paymentMethod}
            onChange={(paymentMethod) => updateFilters({ paymentMethod })}
            options={[{ value: 'all', label: 'All payments' }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: m }))]}
            sheetTitle="Payment method"
          />
        </View>
      </View>

      {status === 'loading' && <ListSkeleton rows={4} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load report" message="Something went wrong loading the sales report. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && view && view.transactionCount === 0 && (
        <EmptyState
          icon={<ReceiptIndianRupee size={28} color={colors.brand[600]} />}
          title="No sales in this period"
          message="Try widening the date range or clearing the filters."
          actionLabel="New sale"
          onAction={() => router.push('/sales/new')}
        />
      )}

      {status === 'ready' && view && view.transactionCount > 0 && (
        <View style={styles.stack}>
          <Card style={styles.heroCard}>
            <AppText size={13} weight="semibold" color={colors.ink[500]}>
              Net sales
            </AppText>
            <AppText size={34} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.heroAmount}>
              {formatMoney(view.netSalesMinor, CURRENCY_SYMBOL)}
            </AppText>
            <AppText size={13} color={colors.ink[400]} style={styles.heroCaption}>
              {view.transactionCount} transactions · {formatMoney(view.estimatedProfitMinor, CURRENCY_SYMBOL)} estimated profit
            </AppText>
            <BarChart series={view.series} />
          </Card>

          <View>
            <SectionHeader title="Top products" action="All products" onAction={() => router.push('/products')} />
            <Card style={styles.overflowHidden}>
              {view.topProducts.map((t, i) => (
                <View key={t.productId}>
                  {i > 0 && <Divider />}
                  <Pressable onPress={() => router.push(`/products/${t.productId}`)} style={({ pressed }) => [styles.topRow, pressed && styles.rowPressed]}>
                    <AppText size={13} weight="bold" color={colors.ink.DEFAULT} style={styles.topRank}>
                      {i + 1}
                    </AppText>
                    <View style={styles.flex1}>
                      <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                        {t.productName}
                      </AppText>
                      <AppText size={12.5} color={colors.ink[400]}>
                        {t.quantitySold} units sold
                      </AppText>
                    </View>
                    <AppText size={14.5} weight="bold" tabular color={colors.ink.DEFAULT}>
                      {formatMoney(t.valueMinor, CURRENCY_SYMBOL)}
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </Card>
          </View>

          <Card style={styles.cardPad}>
            <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.breakdownHeading}>
              BREAKDOWN
            </AppText>
            <View>
              <KeyValue label="Gross sales" value={formatMoney(view.grossSalesMinor, CURRENCY_SYMBOL)} />
              <KeyValue label="Discounts" value={`− ${formatMoney(view.discountsMinor, CURRENCY_SYMBOL)}`} />
              <KeyValue label="Tax collected" value={formatMoney(view.taxMinor, CURRENCY_SYMBOL)} />
              <Divider />
              <KeyValue label="Net sales" value={formatMoney(view.netSalesMinor, CURRENCY_SYMBOL)} strong />
              <Divider />
              <KeyValue label="Transactions" value={`${view.transactionCount}`} />
              <KeyValue label="Average sale" value={formatMoney(view.averageSaleMinor, CURRENCY_SYMBOL)} />
              <KeyValue label="Estimated profit" value={formatMoney(view.estimatedProfitMinor, CURRENCY_SYMBOL)} />
            </View>
          </Card>
        </View>
      )}
    </Screen>
  );
}

function BarChart({ series }: { series: { label: string; valueMinor: number }[] }) {
  const peak = Math.max(...series.map((d) => d.valueMinor), 1);
  return (
    <View style={styles.chart}>
      {series.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.chartColumn}>
          <View style={[styles.chartBar, { height: Math.max((d.valueMinor / peak) * 104, 3) }]} />
          <AppText size={10} weight="semibold" color={colors.ink[400]} numberOfLines={1}>
            {d.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  filtersRow: { marginBottom: spacing[4], flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] },
  filterSelect: { minWidth: 150 },
  heroCard: { padding: spacing[5] },
  heroAmount: { marginTop: spacing[1], lineHeight: 34, letterSpacing: -0.85 },
  heroCaption: { marginTop: spacing[1.5] },
  chart: { marginTop: spacing[5], flexDirection: 'row', alignItems: 'flex-end', gap: spacing[1.5], height: 128 },
  chartColumn: { flex: 1, alignItems: 'center', gap: spacing[1.5] },
  chartBar: { width: '100%', borderRadius: 6, backgroundColor: colors.brand[500] },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  topRank: { width: spacing[5] },
  rowPressed: { backgroundColor: colors.ink[50] },
  cardPad: { padding: spacing[4] },
  breakdownHeading: { marginBottom: spacing[1], letterSpacing: 0.325 },
});
