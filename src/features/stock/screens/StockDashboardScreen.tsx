/**
 * Direct port of the web reference's src/pages/stock/StockDashboard.tsx.
 * Section order preserved exactly: total stock value card -> Stock In/
 * Out/Adjust actions -> recent movements -> (web: `lg:grid-cols-3`
 * second column, desktop-only) needs-attention column. That breakpoint
 * never applies at mobile width, so this renders as the same single
 * vertical stack the web itself shows on a phone — main column first,
 * then the needs-attention column, matching DOM order.
 */
import React from 'react';
import { router } from 'expo-router';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  History,
  PackageX,
  Scale,
  TriangleAlert,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Product } from '@/features/products/types';
import { colors, radius, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, Skeleton } from '@/components/ui/States';
import { CURRENCY_SYMBOL } from '../constants';
import { movementLabel, movementTone } from '../components/MovementSheet';
import { useStockDashboard } from '../hooks/useStockDashboard';
import type { StockMovement, StockSummary } from '../types';
import { formatMoney } from '@/features/products/utils/money';
import { formatCompactMoney } from '../utils/money';
import { formatSignedQuantity } from '../utils/quantity';
import { relativeTime } from '../utils/format';

export function StockDashboardScreen() {
  const { status, summary, recentMovements, refetch } = useStockDashboard();

  return (
    <Screen title="Stock" subtitle="Everything you hold, at a glance" back={false} wide>
      {status === 'loading' && <StockDashboardSkeleton />}

      {status === 'error' && (
        <ErrorNotice
          title="Couldn't load stock"
          message="Something went wrong loading your stock overview. Try again."
          action="Retry"
          onAction={refetch}
        />
      )}

      {status === 'ready' && summary && <StockDashboardContent summary={summary} recentMovements={recentMovements} />}
    </Screen>
  );
}

function StockDashboardContent({ summary, recentMovements }: { summary: StockSummary; recentMovements: StockMovement[] }) {
  return (
    <View style={styles.stack}>
      <Card style={styles.valueCard}>
        <AppText size={13} weight="semibold" color={colors.ink[500]}>
          Total stock value
        </AppText>
        <AppText size={34} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.valueAmount}>
          {formatCompactMoney(summary.totalStockValueMinor, CURRENCY_SYMBOL)}
        </AppText>
        <AppText size={13} color={colors.ink[400]} style={styles.valueCaption}>
          Valued at {summary.valuation === 'cost' ? 'cost price' : 'selling price'}
        </AppText>
        <View style={styles.tileRow}>
          <Tile label="Products" value={`${summary.totalProducts}`} />
          <Tile label="Total units" value={summary.totalUnits.toLocaleString('en-IN')} />
          <Tile label="Selling value" value={formatCompactMoney(summary.sellingStockValueMinor, CURRENCY_SYMBOL)} />
        </View>
      </Card>

      <View style={styles.actionsRow}>
        <Action icon={<ArrowDownToLine size={20} color={colors.white} />} label="Stock In" onPress={() => router.push('/more/stock/in')} primary />
        <Action icon={<ArrowUpFromLine size={20} color={colors.brand[600]} />} label="Stock Out" onPress={() => router.push('/more/stock/out')} />
        <Action icon={<Scale size={20} color={colors.brand[600]} />} label="Adjust" onPress={() => router.push('/more/stock/adjust')} />
      </View>

      <View>
        <SectionHeader title="Recent movements" action="View all" onAction={() => router.push('/more/stock/movements')} />
        <Card style={styles.overflowHidden}>
          {recentMovements.map((m, i) => (
            <View key={m.id}>
              {i > 0 && <Divider />}
              <Pressable
                onPress={() => router.push('/more/stock/movements')}
                style={({ pressed }) => [styles.movementRow, pressed && styles.movementRowPressed]}
              >
                <View style={styles.badgeSlot}>
                  <Badge tone={movementTone[m.type]}>{movementLabel[m.type]}</Badge>
                </View>
                <View style={styles.movementBody}>
                  <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                    {m.productName}
                  </AppText>
                  <AppText size={12} color={colors.ink[400]} numberOfLines={1}>
                    {m.reference} · {relativeTime(m.createdAt)}
                  </AppText>
                </View>
                <AppText
                  size={14}
                  weight="bold"
                  tabular
                  color={m.quantityDelta > 0 ? colors.good[600] : m.quantityDelta < 0 ? colors.bad[600] : colors.ink[400]}
                >
                  {formatSignedQuantity(m.quantityDelta)}
                </AppText>
              </Pressable>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.attentionColumn}>
        <SectionHeader title="Needs attention" />
        <AttentionCard
          tone="warn"
          icon={<TriangleAlert size={20} color={colors.warn[600]} />}
          title="Low stock"
          products={summary.lowStock}
          onPress={() => router.push('/reports/low-stock')}
        />
        <AttentionCard
          tone="bad"
          icon={<PackageX size={20} color={colors.bad[600]} />}
          title="Out of stock"
          products={summary.outOfStock}
          onPress={() => router.push('/reports/out-of-stock')}
        />
        <Pressable
          onPress={() => router.push('/more/stock/movements')}
          style={({ pressed }) => [styles.historyRow, pressed && styles.historyRowPressed]}
        >
          <View style={styles.historyIcon}>
            <History size={20} color={colors.ink[700]} />
          </View>
          <View style={styles.flex1}>
            <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
              Movement history
            </AppText>
            <AppText size={12.5} color={colors.ink[500]}>
              {summary.totalMovements} recorded movements
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.ink.DEFAULT} />
        </Pressable>
      </View>
    </View>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={18} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.tileValue}>
        {value}
      </AppText>
    </View>
  );
}

function Action({ icon, label, onPress, primary }: { icon: React.ReactNode; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionTile,
        primary ? styles.actionTilePrimary : styles.actionTileDefault,
        pressed && (primary ? styles.actionTilePrimaryPressed : styles.actionTileDefaultPressed),
      ]}
      accessibilityRole="button"
    >
      {icon}
      <AppText size={14.5} weight="semibold" color={primary ? colors.white : colors.ink.DEFAULT}>
        {label}
      </AppText>
    </Pressable>
  );
}

function AttentionCard({
  tone,
  icon,
  title,
  products,
  onPress,
}: {
  tone: 'warn' | 'bad';
  icon: React.ReactNode;
  title: string;
  products: Product[];
  onPress: () => void;
}) {
  const palette = tone === 'warn' ? colors.warn : colors.bad;
  const preview = products.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.attentionCard,
        { borderColor: palette[100], backgroundColor: pressed ? withOpacity(palette[100], 60) : palette[50] },
      ]}
    >
      <View style={styles.attentionHeader}>
        <View style={styles.attentionIcon}>{icon}</View>
        <View style={styles.flex1}>
          <AppText size={13} weight="semibold" color={tone === 'warn' ? colors.warn[700] : colors.bad[700]}>
            {title}
          </AppText>
          <AppText size={19} weight="extrabold" color={colors.ink.DEFAULT}>
            {products.length} products
          </AppText>
        </View>
        <ChevronRight size={18} color={tone === 'warn' ? colors.warn[600] : colors.bad[600]} />
      </View>
      {preview.length > 0 && (
        <View style={styles.attentionPreview}>
          {preview.map((p) => (
            <View key={p.id} style={styles.attentionPreviewRow}>
              <AppText size={12.5} weight="medium" color={colors.ink[700]} numberOfLines={1} style={styles.flex1}>
                {p.name}
              </AppText>
              <AppText size={12.5} weight="semibold" color={colors.ink[500]} tabular>
                {p.currentStock} left · {formatMoney(p.purchasePriceMinor, CURRENCY_SYMBOL)}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function StockDashboardSkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading stock" accessibilityState={{ busy: true }}>
      <Skeleton style={styles.skeletonValue} />
      <Skeleton style={styles.skeletonActions} />
      <Skeleton style={styles.skeletonMovements} />
      <Skeleton style={styles.skeletonAttention} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1 },
  overflowHidden: { overflow: 'hidden' },
  valueCard: { padding: spacing[5] },
  valueAmount: { marginTop: spacing[1], lineHeight: 34, letterSpacing: -0.85 },
  valueCaption: { marginTop: spacing[1.5] },
  tileRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingTop: spacing[4],
  },
  tile: { flex: 1 },
  tileValue: { marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing[3] },
  actionTile: { flex: 1, alignItems: 'flex-start', gap: spacing[2.5], borderRadius: radius['2xl'], borderWidth: 1, padding: spacing[4] },
  actionTilePrimary: { borderColor: colors.brand[600], backgroundColor: colors.brand[600] },
  actionTilePrimaryPressed: { backgroundColor: colors.brand[700] },
  actionTileDefault: { borderColor: withOpacity(colors.ink[200], 70), backgroundColor: colors.white },
  actionTileDefaultPressed: { backgroundColor: withOpacity(colors.brand[50], 40), borderColor: colors.brand[200] },
  movementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  movementRowPressed: { backgroundColor: colors.ink[50] },
  badgeSlot: { width: 74 },
  movementBody: { flex: 1, minWidth: 0 },
  attentionColumn: { gap: spacing[3] },
  attentionCard: { borderRadius: radius['2xl'], borderWidth: 1, padding: spacing[4] },
  attentionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  attentionIcon: { height: spacing[10], width: spacing[10], borderRadius: radius.xl, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  attentionPreview: {
    marginTop: spacing[3],
    gap: spacing[1.5],
    borderTopWidth: 1,
    borderTopColor: withOpacity(colors.white, 70),
    paddingTop: spacing[3],
  },
  attentionPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[4],
  },
  historyRowPressed: { backgroundColor: colors.ink[50] },
  historyIcon: { height: spacing[10], width: spacing[10], borderRadius: radius.xl, backgroundColor: colors.ink[100], alignItems: 'center', justifyContent: 'center' },
  skeletonValue: { height: 176, borderRadius: radius['3xl'] },
  skeletonActions: { height: 96, borderRadius: radius['2xl'] },
  skeletonMovements: { height: 256, borderRadius: radius['2xl'] },
  skeletonAttention: { height: 220, borderRadius: radius['2xl'] },
});
