/**
 * Direct port of the web reference's src/pages/sales/SaleDetail.tsx.
 * `lg:grid-cols-3` is desktop-only; the web renders a single column at
 * mobile width, so this is that same DOM order. Print/Share are the
 * web's own mocked actions (toast only, no real printing/sharing there
 * either) — preserved as-is, no native package introduced.
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Printer, ReceiptText, RotateCcw, Share2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL } from '../constants';
import { useSale } from '../hooks/useSale';
import type { SaleStatus } from '../types';
import { dateTimeLabel } from '../utils/format';

const STATUS_LABEL: Record<Exclude<SaleStatus, 'completed'>, string> = {
  returned: 'Fully returned',
  'part-returned': 'Partly returned',
};

export function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { status, sale, returns, stockImpact, refetch } = useSale(id);

  if (status === 'loading') {
    return (
      <Screen title="Sales" wide>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title="Sales" wide>
        <ErrorNotice title="Couldn't load sale" message="Something went wrong loading this sale. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!sale) {
    return (
      <Screen title="Sale not found">
        <EmptyState
          icon={<ReceiptText size={28} color={colors.brand[600]} />}
          title="This sale is not in your history"
          message="It may have been removed when data was restored from a backup."
          actionLabel="Back to sales"
          onAction={() => router.push('/sales')}
        />
      </Screen>
    );
  }

  const changeReturnedMinor = Math.max(sale.amountReceivedMinor - sale.totalMinor, 0);
  const estimatedProfitMinor = sale.totalMinor - sale.taxMinor - sale.costMinor;

  return (
    <Screen
      title={sale.receiptNo}
      subtitle={dateTimeLabel(sale.createdAt)}
      wide
      footer={
        <View style={styles.footerRow}>
          <View style={styles.flex1}>
            <Button variant="secondary" block icon={<ReceiptText size={16} color={colors.ink.DEFAULT} />} onPress={() => router.push(`/sales/receipt/${sale.id}`)}>
              Receipt
            </Button>
          </View>
          <View style={styles.flex1}>
            <Button variant="secondary" block icon={<Printer size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Sent to printer.', 'info')}>
              Print
            </Button>
          </View>
          {sale.status !== 'returned' && (
            <View style={styles.flex1}>
              <Button block icon={<RotateCcw size={16} color={colors.white} />} onPress={() => router.push(`/sales/${sale.id}/return`)}>
                Return
              </Button>
            </View>
          )}
        </View>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.flex1}>
              <AppText size={13} weight="semibold" color={colors.ink[500]}>
                Total paid
              </AppText>
              <AppText size={32} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.heroAmount}>
                {formatMoney(sale.totalMinor, CURRENCY_SYMBOL)}
              </AppText>
              <AppText size={13} color={colors.ink[400]} style={styles.heroCaption}>
                {sale.paymentMethod} · {sale.customerName}
              </AppText>
            </View>
            {sale.status !== 'completed' && <Badge tone="warn">{STATUS_LABEL[sale.status]}</Badge>}
          </View>
        </Card>

        <View>
          <SectionHeader title={`Items (${sale.items.length})`} />
          <Card style={styles.overflowHidden}>
            {sale.items.map((it, i) => (
              <View key={it.productId}>
                {i > 0 && <Divider />}
                <Pressable onPress={() => router.push(`/products/${it.productId}`)} style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}>
                  <View style={styles.flex1}>
                    <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                      {it.productName}
                    </AppText>
                    <AppText size={12.5} color={colors.ink[400]} tabular>
                      {it.quantity} × {formatMoney(it.unitPriceMinor, CURRENCY_SYMBOL)}
                      {it.discountMinor > 0 ? ` · discount ${formatMoney(it.discountMinor, CURRENCY_SYMBOL)}` : ''}
                    </AppText>
                  </View>
                  <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
                    {formatMoney(it.quantity * it.unitPriceMinor - it.discountMinor, CURRENCY_SYMBOL)}
                  </AppText>
                </Pressable>
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionHeader title="Stock impact" action="All movements" onAction={() => router.push('/more/stock/movements')} />
          <Card style={styles.overflowHidden}>
            {stockImpact.length === 0 ? (
              <AppText size={13.5} color={colors.ink[500]} style={styles.emptyImpactText}>
                No stock movements recorded.
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
                      {m.quantityBefore} → <AppText size={13} weight="semibold" tabular color={colors.ink.DEFAULT}>{m.quantityAfter}</AppText>
                    </AppText>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        {returns.length > 0 && (
          <View>
            <SectionHeader title="Returns against this sale" />
            <Card style={styles.overflowHidden}>
              {returns.map((r, i) => (
                <View key={r.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.returnRow}>
                    <View>
                      <AppText size={14} weight="semibold" color={colors.ink.DEFAULT}>
                        {r.reference}
                      </AppText>
                      <AppText size={12.5} color={colors.ink[400]}>
                        {r.reason} · {dateTimeLabel(r.createdAt)}
                      </AppText>
                    </View>
                    <AppText size={14.5} weight="bold" tabular color={colors.bad[600]}>
                      − {formatMoney(r.refundMinor, CURRENCY_SYMBOL)}
                    </AppText>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        <Card style={styles.summaryCard}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.summaryHeading}>
            SUMMARY
          </AppText>
          <View>
            <KeyValue label="Subtotal" value={formatMoney(sale.subtotalMinor, CURRENCY_SYMBOL)} />
            <KeyValue label="Discount" value={`− ${formatMoney(sale.discountMinor, CURRENCY_SYMBOL)}`} />
            <KeyValue label="Tax" value={formatMoney(sale.taxMinor, CURRENCY_SYMBOL)} />
            <Divider />
            <KeyValue label="Total" value={formatMoney(sale.totalMinor, CURRENCY_SYMBOL)} strong />
            <Divider />
            <KeyValue label="Payment method" value={sale.paymentMethod} />
            <KeyValue label="Amount received" value={formatMoney(sale.amountReceivedMinor, CURRENCY_SYMBOL)} />
            <KeyValue label="Change returned" value={formatMoney(changeReturnedMinor, CURRENCY_SYMBOL)} />
            <Divider />
            <KeyValue label="Estimated profit" value={formatMoney(estimatedProfitMinor, CURRENCY_SYMBOL)} />
          </View>
          <Button variant="secondary" block style={styles.shareButton} icon={<Share2 size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Receipt shared.', 'info')}>
            Share receipt
          </Button>
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
  returnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  summaryCard: { padding: spacing[4] },
  summaryHeading: { marginBottom: spacing[1], letterSpacing: 0.325 },
  shareButton: { marginTop: spacing[3] },
  footerRow: { flexDirection: 'row', gap: spacing[2.5] },
});
