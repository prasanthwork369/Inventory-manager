/**
 * Direct port of the web reference's src/pages/reports/ReportsHome.tsx.
 * `lg:grid-cols-2` on the reports grid is a desktop-only breakpoint the
 * web itself never applies at mobile width, so this stays single-column,
 * not a redesign.
 */
import React from 'react';
import { router } from 'expo-router';
import {
  Boxes,
  ChevronRight,
  Download,
  History,
  PackageX,
  ReceiptIndianRupee,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, Skeleton } from '@/components/ui/States';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactMoney } from '../utils/money';
import { useReportsHome } from '../hooks/useReportsHome';
import type { ReportsHomeSummary } from '../types';

export function ReportsHomeScreen() {
  const { status, summary, refetch } = useReportsHome();

  return (
    <Screen title="Reports" subtitle="Understand how the business is doing" back={false} wide>
      {status === 'loading' && <ReportsHomeSkeleton />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load reports" message="Something went wrong loading your reports. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && summary && <ReportsHomeContent summary={summary} />}
    </Screen>
  );
}

function ReportsHomeContent({ summary }: { summary: ReportsHomeSummary }) {
  const reports: { to: Parameters<typeof router.push>[0]; Icon: LucideIcon; title: string; caption: string }[] = [
    { to: '/reports/sales', Icon: ReceiptIndianRupee, title: 'Sales report', caption: `${summary.monthSalesCount} sales in 30 days · ${formatMoney(summary.monthSalesTotalMinor, CURRENCY_SYMBOL)}` },
    { to: '/reports/profit', Icon: TrendingUp, title: 'Profit report', caption: `${formatMoney(summary.monthProfitMinor, CURRENCY_SYMBOL)} estimated gross profit (30d)` },
    { to: '/reports/inventory', Icon: Boxes, title: 'Inventory report', caption: `${summary.productCount} products · ${formatCompactMoney(summary.stockValueMinor, CURRENCY_SYMBOL)} value` },
    { to: '/reports/purchases', Icon: ShoppingCart, title: 'Purchase report', caption: `${summary.purchaseCount} purchases · ${summary.supplierCount} suppliers` },
    { to: '/reports/low-stock', Icon: TriangleAlert, title: 'Low stock', caption: `${summary.lowStockCount} products below minimum` },
    { to: '/reports/out-of-stock', Icon: PackageX, title: 'Out of stock', caption: `${summary.outOfStockCount} products unavailable` },
    { to: '/reports/movements', Icon: History, title: 'Stock movement report', caption: `${summary.movementCount} movements recorded` },
    { to: '/more/customers', Icon: Users, title: 'Customers', caption: `${summary.customerCount} saved customers` },
  ];

  return (
    <View style={styles.stack}>
      <Card style={styles.todayCard}>
        <AppText size={13} weight="semibold" color={colors.ink[500]}>
          Today
        </AppText>
        <View style={styles.todayRow}>
          <Head label="Sales" value={formatMoney(summary.todaySalesMinor, CURRENCY_SYMBOL)} />
          <Head label="Est. profit" value={formatMoney(summary.todayProfitMinor, CURRENCY_SYMBOL)} />
          <Head label="Stock value" value={formatCompactMoney(summary.stockValueMinor, CURRENCY_SYMBOL)} />
        </View>
      </Card>

      <View>
        <SectionHeader title="All reports" />
        <View style={styles.reportsGrid}>
          {reports.map((r) => (
            <Pressable key={r.title} onPress={() => router.push(r.to)} style={({ pressed }) => [styles.reportTile, pressed && styles.reportTilePressed]}>
              <View style={styles.reportIcon}>
                <r.Icon size={20} color={colors.brand[600]} />
              </View>
              <View style={styles.flex1}>
                <AppText size={15} weight="semibold" color={colors.ink.DEFAULT}>
                  {r.title}
                </AppText>
                <AppText size={12.5} color={colors.ink[500]} numberOfLines={1}>
                  {r.caption}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.ink.DEFAULT} />
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={() => router.push('/more/export')} style={({ pressed }) => [styles.exportRow, pressed && styles.exportRowPressed]}>
        <Download size={20} color={colors.ink[500]} />
        <View style={styles.flex1}>
          <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
            Export data
          </AppText>
          <AppText size={12.5} color={colors.ink[500]}>
            Download any report as CSV or PDF
          </AppText>
        </View>
        <ChevronRight size={18} color={colors.ink.DEFAULT} />
      </Pressable>
    </View>
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

function ReportsHomeSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading reports" accessibilityState={{ busy: true }}>
      <Skeleton style={styles.skeletonToday} />
      <Skeleton style={styles.skeletonGrid} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  todayCard: { padding: spacing[5] },
  todayRow: { marginTop: spacing[2], flexDirection: 'row', gap: spacing[3] },
  headValue: { marginTop: 2 },
  reportsGrid: { gap: spacing[2.5] },
  reportTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[4],
  },
  reportTilePressed: { backgroundColor: withOpacity(colors.brand[50], 40), borderColor: colors.brand[200] },
  reportIcon: { height: spacing[10], width: spacing[10], borderRadius: radius.xl, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  exportRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink[200],
    padding: spacing[4],
  },
  exportRowPressed: { backgroundColor: colors.white },
  skeletonToday: { height: 112, borderRadius: radius['2xl'] },
  skeletonGrid: { height: 480, borderRadius: radius['2xl'] },
});
