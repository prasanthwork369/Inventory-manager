/**
 * Direct port of the web reference's src/pages/purchases/PurchaseDetail.tsx.
 * `lg:grid-cols-3` is desktop-only; the web renders a single column at
 * mobile width (main column, then Summary card), so this is that same
 * DOM order. "Stock impact" reads Stock's movements directly (see
 * usePurchase.ts) — its empty state ("Stock movements for this purchase
 * are not in your current history.") is the web's own, not invented; a
 * freshly created purchase will always hit it since this app's temporary
 * providers don't mutate each other's mock arrays (see
 * purchasesProvider.ts).
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ShoppingCart, Truck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL } from '../constants';
import { usePurchase } from '../hooks/usePurchase';
import type { PurchasePaymentStatus } from '../types';
import { dateTimeLabel } from '../utils/format';

const STATUS_TONE: Record<PurchasePaymentStatus, 'good' | 'warn' | 'bad'> = {
  Paid: 'good',
  Partial: 'warn',
  Unpaid: 'bad',
};

export function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, purchase, stockImpact, refetch } = usePurchase(id);

  if (status === 'loading') {
    return (
      <Screen title="Purchases" wide>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title="Purchases" wide>
        <ErrorNotice title="Couldn't load purchase" message="Something went wrong loading this purchase. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!purchase) {
    return (
      <Screen title="Purchase not found">
        <EmptyState
          icon={<ShoppingCart size={28} color={colors.brand[600]} />}
          title="This purchase is not in your history"
          message="It may have been removed when data was restored from a backup."
          actionLabel="Back to purchases"
          onAction={() => router.push('/more/purchases')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={purchase.reference}
      subtitle={dateTimeLabel(purchase.createdAt)}
      wide
      footer={
        <View style={styles.footerRow}>
          <View style={styles.flex1}>
            <Button
              variant="secondary"
              block
              icon={<Truck size={16} color={colors.ink.DEFAULT} />}
              onPress={() => router.push(`/more/suppliers/${purchase.supplierId}`)}
            >
              Supplier
            </Button>
          </View>
          <View style={styles.flex1}>
            <Button block onPress={() => router.push('/purchases/new')}>
              New purchase
            </Button>
          </View>
        </View>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.flex1}>
              <AppText size={13} weight="semibold" color={colors.ink[500]}>
                Purchase total
              </AppText>
              <AppText size={32} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.heroAmount}>
                {formatMoney(purchase.totalMinor, CURRENCY_SYMBOL)}
              </AppText>
              <AppText size={13} color={colors.ink[400]} style={styles.heroCaption}>
                {purchase.supplierName}
              </AppText>
            </View>
            <Badge tone={STATUS_TONE[purchase.paymentStatus]}>{purchase.paymentStatus}</Badge>
          </View>
        </Card>

        <View>
          <SectionHeader title={`Products (${purchase.items.length})`} />
          <Card style={styles.overflowHidden}>
            {purchase.items.map((it, i) => (
              <View key={it.productId}>
                {i > 0 && <Divider />}
                <Pressable
                  onPress={() => router.push(`/products/${it.productId}`)}
                  style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
                >
                  <View style={styles.flex1}>
                    <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                      {it.productName}
                    </AppText>
                    <AppText size={12.5} color={colors.ink[400]} tabular>
                      {it.quantity} × {formatMoney(it.unitCostMinor, CURRENCY_SYMBOL)}
                    </AppText>
                  </View>
                  <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
                    {formatMoney(it.quantity * it.unitCostMinor, CURRENCY_SYMBOL)}
                  </AppText>
                </Pressable>
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionHeader title="Stock impact" />
          <Card style={styles.overflowHidden}>
            {stockImpact.length === 0 ? (
              <AppText size={13.5} color={colors.ink[500]} style={styles.emptyImpactText}>
                Stock movements for this purchase are not in your current history.
              </AppText>
            ) : (
              stockImpact.map((m, i) => (
                <View key={m.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.impactRow}>
                    <AppText size={14} weight="medium" color={colors.ink[700]} numberOfLines={1} style={styles.flex1}>
                      {m.productName}
                    </AppText>
                    <AppText size={13} weight="semibold" tabular color={colors.ink[500]}>
                      {m.quantityBefore} → <AppText size={13} weight="semibold" tabular color={colors.good[600]}>{m.quantityAfter}</AppText>
                    </AppText>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.summaryHeading}>
            SUMMARY
          </AppText>
          <View>
            <KeyValue label="Subtotal" value={formatMoney(purchase.subtotalMinor, CURRENCY_SYMBOL)} />
            <KeyValue label="Discount" value={`− ${formatMoney(purchase.discountMinor, CURRENCY_SYMBOL)}`} />
            <KeyValue label="Tax" value={formatMoney(purchase.taxMinor, CURRENCY_SYMBOL)} />
            <Divider />
            <KeyValue label="Total" value={formatMoney(purchase.totalMinor, CURRENCY_SYMBOL)} strong />
            <Divider />
            <KeyValue label="Payment status" value={purchase.paymentStatus} />
            <KeyValue label="Reference" value={purchase.reference} />
            <KeyValue label="Date" value={dateTimeLabel(purchase.createdAt)} />
          </View>
          {purchase.notes ? (
            <View style={styles.notesBox}>
              <AppText size={13} color={colors.ink.DEFAULT} style={styles.notesText}>
                {purchase.notes}
              </AppText>
            </View>
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  heroCard: { padding: spacing[5] },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[4] },
  heroAmount: { marginTop: spacing[1], lineHeight: 32, letterSpacing: -0.8 },
  heroCaption: { marginTop: spacing[1.5] },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  rowPressed: { backgroundColor: colors.ink[50] },
  emptyImpactText: { textAlign: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[5] },
  impactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  summaryCard: { padding: spacing[4] },
  summaryHeading: { marginBottom: spacing[1], letterSpacing: 0.325 },
  notesBox: { marginTop: spacing[3], borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3] },
  notesText: { lineHeight: 21.13 },
  footerRow: { flexDirection: 'row', gap: spacing[2.5] },
});
