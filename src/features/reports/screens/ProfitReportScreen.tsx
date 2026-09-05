/**
 * Direct port of the web reference's src/pages/reports/ProfitReport.tsx.
 * Profit = revenue (excl. tax) minus cost of goods sold, NOT
 * sales-minus-purchases — see reportsProvider.ts's getProfitReport for
 * the exact formula this only displays. Progress bars are plain Views,
 * matching the web's own CSS-only bars.
 */
import React from 'react';
import { Download, TrendingUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, PROFIT_RANGE_OPTIONS } from '../constants';
import { useProfitReport } from '../hooks/useProfitReport';
import type { ReportRangeDays } from '../types';

export function ProfitReportScreen() {
  const toast = useToast();
  const { status, view, rangeDays, setRangeDays, refetch } = useProfitReport();

  return (
    <Screen
      title="Profit report"
      subtitle="Revenue minus the cost of what you sold"
      wide
      actions={
        <Button size="sm" variant="secondary" icon={<Download size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Profit report exported as PDF.', 'info')}>
          Export
        </Button>
      }
    >
      <View style={styles.filtersRow}>
        <Segmented value={String(rangeDays) as '1' | '7' | '30' | '90'} onChange={(v) => setRangeDays(Number(v) as ReportRangeDays)} options={PROFIT_RANGE_OPTIONS} />
      </View>

      {status === 'loading' && <ListSkeleton rows={4} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load report" message="Something went wrong loading the profit report. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && view && view.transactionCount === 0 && (
        <EmptyState
          icon={<TrendingUp size={28} color={colors.brand[600]} />}
          title="No sales in this period"
          message="Profit is calculated from completed sales. Choose a longer period to see numbers."
        />
      )}

      {status === 'ready' && view && view.transactionCount > 0 && (
        <View style={styles.stack}>
          <Card style={styles.heroCard}>
            <AppText size={13} weight="semibold" color={colors.ink[500]}>
              Estimated gross profit
            </AppText>
            <AppText size={36} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.heroAmount}>
              {formatMoney(view.grossProfitMinor, CURRENCY_SYMBOL)}
            </AppText>
            <AppText size={13} color={colors.ink[400]} style={styles.heroCaption}>
              {view.marginPercent}% margin on {formatMoney(view.revenueMinor, CURRENCY_SYMBOL)} revenue
            </AppText>

            <View style={styles.barsStack}>
              <ProfitBar label="Revenue" valueMinor={view.revenueMinor} maxMinor={view.revenueMinor || 1} color={colors.brand[500]} />
              <ProfitBar label="Cost of goods sold" valueMinor={view.cogsMinor} maxMinor={view.revenueMinor || 1} color={colors.warn[500]} />
              <ProfitBar label="Gross profit" valueMinor={view.grossProfitMinor} maxMinor={view.revenueMinor || 1} color={colors.good[500]} />
            </View>
          </Card>

          <SectionHeader title="How this is calculated" />
          <Card style={styles.cardPad}>
            <AppText size={13.5} color={colors.ink[500]} style={styles.explainerText}>
              Gross profit is your net sales (excluding tax) minus the cost price of every unit sold. It does not include
              rent, salaries or other running costs. Add expenses in a future update to see net profit.
            </AppText>
          </Card>

          <Card style={styles.cardPad}>
            <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.breakdownHeading}>
              BREAKDOWN
            </AppText>
            <View>
              <KeyValue label="Revenue (excl. tax)" value={formatMoney(view.revenueMinor, CURRENCY_SYMBOL)} />
              <KeyValue label="Discounts given" value={`− ${formatMoney(view.discountsMinor, CURRENCY_SYMBOL)}`} />
              <KeyValue label="Cost of goods sold" value={`− ${formatMoney(view.cogsMinor, CURRENCY_SYMBOL)}`} />
              <Divider />
              <KeyValue label="Estimated gross profit" value={formatMoney(view.grossProfitMinor, CURRENCY_SYMBOL)} strong />
              <Divider />
              <KeyValue label="Purchases in period" value={formatMoney(view.purchaseSpendMinor, CURRENCY_SYMBOL)} />
              <KeyValue label="Transactions" value={`${view.transactionCount}`} />
              <KeyValue label="Average margin" value={`${view.marginPercent}%`} />
            </View>
          </Card>
        </View>
      )}
    </Screen>
  );
}

function ProfitBar({ label, valueMinor, maxMinor, color }: { label: string; valueMinor: number; maxMinor: number; color: string }) {
  const pct = Math.max((valueMinor / maxMinor) * 100, 2);
  return (
    <View>
      <View style={styles.barLabelRow}>
        <AppText size={13} weight="semibold" color={colors.ink[700]}>
          {label}
        </AppText>
        <AppText size={13} weight="bold" tabular color={colors.ink.DEFAULT}>
          {formatMoney(valueMinor, CURRENCY_SYMBOL)}
        </AppText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  filtersRow: { marginBottom: spacing[4], flexDirection: 'row' },
  heroCard: { padding: spacing[5] },
  heroAmount: { marginTop: spacing[1], lineHeight: 36, letterSpacing: -0.9 },
  heroCaption: { marginTop: spacing[1.5] },
  barsStack: { marginTop: spacing[5], gap: spacing[3] },
  barLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  barTrack: { marginTop: spacing[1.5], height: 10, borderRadius: radius.full, backgroundColor: colors.ink[100] },
  barFill: { height: '100%', borderRadius: radius.full },
  cardPad: { padding: spacing[4] },
  explainerText: { lineHeight: 21.94 },
  breakdownHeading: { marginBottom: spacing[1], letterSpacing: 0.325 },
});
