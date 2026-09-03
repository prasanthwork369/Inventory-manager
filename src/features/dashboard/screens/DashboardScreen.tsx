/**
 * Direct port of the web reference's src/pages/Dashboard.tsx. Section
 * order, content and structure mirror that file exactly: header (outside
 * the loading check, same as web) -> loading skeleton OR hero card ->
 * secondary KPI row -> Quick actions -> Recent activity -> Inventory
 * alerts -> Today at a glance. Web's `lg:grid-cols-3` two-column split is
 * a desktop-only breakpoint the mobile-default styles never apply, so
 * this is a single vertical stack in the same DOM order web uses on
 * mobile width — not a redesign, the web source itself renders single-
 * column at this viewport.
 */
import React from 'react';
import { router } from 'expo-router';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  LayoutGrid,
  PackagePlus,
  PackageX,
  ReceiptIndianRupee,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '@/constants/routes';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/States';
import { AlertCard } from '../components/AlertCard';
import { GlanceRow } from '../components/GlanceRow';
import { HeroStatCard } from '../components/HeroStatCard';
import { KpiCard } from '../components/KpiCard';
import { QuickActionItem } from '../components/QuickActionItem';
import { RecentActivityRow } from '../components/RecentActivityRow';
import { useDashboard } from '../hooks/useDashboard';
import { formatCompactMoney, formatMoney, getGreeting } from '../utils/format';
import type { DashboardSummary } from '../types';

export function DashboardScreen() {
  const { status, summary, refetch } = useDashboard();
  const insets = useSafeAreaInsets();
  // The Tabs navigator lays out its screen area and the tab bar as
  // ordinary flex-column siblings, not an absolute/floating overlay — this
  // screen's ScrollView is already sized to end above the tab bar, so no
  // extra bottom padding is needed to "clear" it (see Screen.tsx's header
  // for the fuller explanation; Dashboard predates that shared component).
  const alertCount = summary ? summary.lowStock.count + summary.outOfStock.count : 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[4], paddingBottom: spacing[4] }]}
      >
        <DashboardHeader businessName={summary?.businessName ?? ''} alertCount={alertCount} />

        {status === 'loading' && <DashboardSkeleton />}

        {status === 'error' && (
          <ErrorNotice
            title="Couldn't load dashboard"
            message="Something went wrong loading your summary. Try again."
            action="Retry"
            onAction={refetch}
          />
        )}

        {status === 'empty' && (
          <EmptyState
            icon={<LayoutGrid size={28} color={colors.brand[600]} />}
            title="No data yet"
            message="Your dashboard will fill up as you add products and record sales."
          />
        )}

        {status === 'ready' && summary && <DashboardContent summary={summary} />}
      </ScrollView>
    </View>
  );
}

function DashboardHeader({ businessName, alertCount }: { businessName: string; alertCount: number }) {
  return (
    <View style={styles.header}>
      <View>
        <AppText size={14} weight="medium" color={colors.ink[500]}>
          {getGreeting()} 👋
        </AppText>
        <AppText size={22} weight="extrabold" color={colors.ink.DEFAULT} style={styles.businessName}>
          {businessName}
        </AppText>
      </View>
      <Pressable
        onPress={() => router.push('/more/alerts')}
        style={({ pressed }) => [styles.bellButton, pressed && styles.bellButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Alerts, ${alertCount} needing attention`}
      >
        <Bell size={20} color={colors.ink[700]} />
        {alertCount > 0 && (
          <View style={styles.bellBadge}>
            <AppText size={11} weight="bold" color={colors.white}>
              {alertCount}
            </AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const { today, currencySymbol } = summary;

  return (
    <View style={styles.sectionStack}>
      <HeroStatCard
        amountLabel={formatMoney(today.salesTotal, currencySymbol)}
        transactionCount={today.salesCount}
        profitLabel={formatMoney(today.estimatedProfit, currencySymbol)}
        sparkline={summary.sparkline}
        onPress={() => router.push('/reports/sales')}
      />

      <View style={styles.kpiRow}>
        <KpiCard
          label="Stock Value"
          value={formatCompactMoney(summary.stockValue, currencySymbol)}
          caption={`${summary.productCount} products`}
          onPress={() => router.push('/reports/inventory')}
        />
        <KpiCard
          label="Today's Purchases"
          value={formatMoney(today.purchasesTotal, currencySymbol)}
          caption={`${today.purchasesCount} received`}
          onPress={() => router.push('/reports/purchases')}
        />
        <KpiCard
          label="Estimated Profit"
          value={formatMoney(today.estimatedProfit, currencySymbol)}
          caption="Today, after cost"
          onPress={() => router.push('/reports/profit')}
        />
      </View>

      <View>
        <SectionHeader title="Quick actions" />
        <View style={styles.quickActionsGrid}>
          <QuickActionItem label="New Sale" Icon={ReceiptIndianRupee} primary onPress={() => router.push(ROUTES.newSale)} />
          <QuickActionItem label="Stock In" Icon={ArrowDownToLine} onPress={() => router.push(ROUTES.stockIn)} />
          <QuickActionItem label="Stock Out" Icon={ArrowUpFromLine} onPress={() => router.push(ROUTES.stockOut)} />
          <QuickActionItem label="Add Product" Icon={PackagePlus} onPress={() => router.push(ROUTES.addProduct)} />
        </View>
      </View>

      <View>
        <SectionHeader title="Recent activity" action="View all" onAction={() => router.push('/more/stock/movements')} />
        <Card style={styles.overflowHidden}>
          {summary.recentActivity.slice(0, 6).map((item, i) => (
            <View key={item.id}>
              {i > 0 && <Divider />}
              <RecentActivityRow item={item} onPress={() => router.push(`/products/${item.productId}`)} />
            </View>
          ))}
        </Card>
      </View>

      <View>
        <SectionHeader title="Inventory alerts" action="All alerts" onAction={() => router.push('/more/alerts')} />
        <View style={styles.alertStack}>
          <AlertCard
            tone="warn"
            icon={<TriangleAlert size={20} color={colors.warn[600]} />}
            title="Low Stock"
            value={`${summary.lowStock.count} products`}
            caption={summary.lowStock.names.slice(0, 2).join(', ') || 'Everything is above minimum'}
            onPress={() => router.push('/reports/low-stock')}
          />
          <AlertCard
            tone="bad"
            icon={<PackageX size={20} color={colors.bad[600]} />}
            title="Out of Stock"
            value={`${summary.outOfStock.count} products`}
            caption={summary.outOfStock.names.slice(0, 2).join(', ') || 'Nothing has run out'}
            onPress={() => router.push('/reports/out-of-stock')}
          />
        </View>
      </View>

      <View>
        <SectionHeader title="Today at a glance" />
        <Card>
          <GlanceRow
            icon={<ReceiptIndianRupee size={18} color={colors.brand[600]} />}
            label="Sales"
            value={`${today.salesCount} · ${formatMoney(today.salesTotal, currencySymbol)}`}
            onPress={() => router.push('/sales')}
          />
          <Divider />
          <GlanceRow
            icon={<ShoppingCart size={18} color={colors.brand[600]} />}
            label="Purchases"
            value={`${today.purchasesCount} · ${formatMoney(today.purchasesTotal, currencySymbol)}`}
            onPress={() => router.push('/more/purchases')}
          />
          <Divider />
          <GlanceRow
            icon={<TrendingUp size={18} color={colors.brand[600]} />}
            label="Estimated profit"
            value={formatMoney(today.estimatedProfit, currencySymbol)}
            onPress={() => router.push('/reports/profit')}
          />
        </Card>
      </View>
    </View>
  );
}

function DashboardSkeleton() {
  return (
    <View style={styles.sectionStack} accessibilityLabel="Loading dashboard" accessibilityState={{ busy: true }}>
      <Skeleton style={styles.skeletonHero} />
      <View style={styles.kpiRow}>
        <Skeleton style={[styles.flex1, styles.skeletonKpi]} />
        <Skeleton style={[styles.flex1, styles.skeletonKpi]} />
        <Skeleton style={[styles.flex1, styles.skeletonKpi]} />
      </View>
      <Skeleton style={styles.skeletonQuickActions} />
      <Skeleton style={styles.skeletonActivity} />
      <Skeleton style={styles.skeletonKpi} />
      <Skeleton style={styles.skeletonKpi} />
      <Skeleton style={styles.skeletonGlance} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink[50] },
  scrollContent: { paddingHorizontal: spacing[4] },
  header: {
    marginBottom: spacing[5],
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  businessName: { letterSpacing: -0.55 },
  bellButton: {
    height: spacing[11],
    width: spacing[11],
    borderRadius: radius['2xl'],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButtonPressed: { backgroundColor: colors.ink[50] },
  bellBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    height: spacing[5],
    minWidth: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors.warn[500],
    paddingHorizontal: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionStack: { gap: spacing[4] },
  kpiRow: { flexDirection: 'row', gap: spacing[3] },
  flex1: { flex: 1 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  overflowHidden: { overflow: 'hidden' },
  alertStack: { gap: spacing[3] },
  skeletonHero: { height: 176, borderRadius: radius['3xl'] },
  skeletonKpi: { height: 96, borderRadius: radius['2xl'] },
  skeletonQuickActions: { height: 112, borderRadius: radius['2xl'] },
  skeletonActivity: { height: 256, borderRadius: radius['2xl'] },
  skeletonGlance: { height: 160, borderRadius: radius['2xl'] },
});
