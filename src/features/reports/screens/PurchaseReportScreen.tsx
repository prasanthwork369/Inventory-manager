/**
 * Direct port of the web reference's src/pages/reports/PurchaseReport.tsx.
 * No payment-ledger values invented — "Unpaid" is just the sum of
 * paymentStatus !== 'Paid' purchases, exactly matching the web (there is
 * no numeric outstanding-balance tracking anywhere in this app).
 */
import React from 'react';
import { router } from 'expo-router';
import { Download, ShoppingCart } from 'lucide-react-native';
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
import { CURRENCY_SYMBOL, PURCHASE_RANGE_OPTIONS } from '../constants';
import { usePurchaseReport } from '../hooks/usePurchaseReport';
import { dateLabel } from '@/features/purchases/utils/format';

export function PurchaseReportScreen() {
  const toast = useToast();
  const { status, view, suppliers, filters, updateFilters, refetch } = usePurchaseReport();

  return (
    <Screen
      title="Purchase report"
      subtitle={view ? `${view.purchases.length} purchases` : undefined}
      wide
      actions={
        <Button size="sm" variant="secondary" icon={<Download size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Purchase report exported as CSV.', 'info')}>
          Export
        </Button>
      }
    >
      <View style={styles.filtersRow}>
        <Segmented value={String(filters.rangeDays) as '7' | '30' | '90' | 'all'} onChange={(v) => updateFilters({ rangeDays: v === 'all' ? 'all' : (Number(v) as 7 | 30 | 90) })} options={PURCHASE_RANGE_OPTIONS} />
        <View style={styles.filterSelect}>
          <Select
            value={filters.supplierId}
            onChange={(supplierId) => updateFilters({ supplierId })}
            options={[{ value: 'all', label: 'All suppliers' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
            sheetTitle="Supplier"
          />
        </View>
      </View>

      {status === 'loading' && <ListSkeleton rows={4} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load report" message="Something went wrong loading the purchase report. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && view && view.purchases.length === 0 && (
        <EmptyState
          icon={<ShoppingCart size={28} color={colors.brand[600]} />}
          title="No purchases in this period"
          message="Record a purchase when stock arrives and it will show up here."
          actionLabel="New purchase"
          onAction={() => router.push('/purchases/new')}
        />
      )}

      {status === 'ready' && view && view.purchases.length > 0 && (
        <View style={styles.stack}>
          <Card style={styles.heroCard}>
            <AppText size={13} weight="semibold" color={colors.ink[500]}>
              Purchase value
            </AppText>
            <AppText size={34} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.heroAmount}>
              {formatMoney(view.totalMinor, CURRENCY_SYMBOL)}
            </AppText>
            <AppText size={13} color={colors.ink[400]} style={styles.heroCaption}>
              {view.purchases.length} purchases · {formatMoney(view.unpaidMinor, CURRENCY_SYMBOL)} still unpaid
            </AppText>
          </Card>

          <View>
            <SectionHeader title="By supplier" />
            <Card style={styles.overflowHidden}>
              {view.bySupplier.map((s, i) => (
                <View key={s.supplierId}>
                  {i > 0 && <Divider />}
                  <Pressable onPress={() => router.push(`/more/suppliers/${s.supplierId}`)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                    <View style={styles.flex1}>
                      <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                        {s.supplierName}
                      </AppText>
                      <AppText size={12.5} color={colors.ink[400]}>
                        {s.purchaseCount} purchases · {s.unitsReceived} units
                      </AppText>
                    </View>
                    <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
                      {formatMoney(s.totalMinor, CURRENCY_SYMBOL)}
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </Card>
          </View>

          <View>
            <SectionHeader title="All purchases" />
            <Card style={styles.overflowHidden}>
              {view.purchases.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider />}
                  <Pressable onPress={() => router.push(`/more/purchases/${p.id}`)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                    <View style={styles.flex1}>
                      <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                        {p.reference}
                      </AppText>
                      <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
                        {p.supplierName} · {p.items.reduce((s, i2) => s + i2.quantity, 0)} units · {dateLabel(p.createdAt)}
                      </AppText>
                    </View>
                    <AppText size={14.5} weight="bold" tabular color={colors.ink.DEFAULT}>
                      {formatMoney(p.totalMinor, CURRENCY_SYMBOL)}
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </Card>
          </View>

          <Card style={styles.cardPad}>
            <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.summaryHeading}>
              SUMMARY
            </AppText>
            <View>
              <KeyValue label="Purchases" value={`${view.purchases.length}`} />
              <KeyValue label="Suppliers" value={`${view.supplierCount}`} />
              <KeyValue label="Units received" value={`${view.unitsReceived}`} />
              <Divider />
              <KeyValue label="Total value" value={formatMoney(view.totalMinor, CURRENCY_SYMBOL)} strong />
              <KeyValue label="Unpaid" value={formatMoney(view.unpaidMinor, CURRENCY_SYMBOL)} />
            </View>
          </Card>
        </View>
      )}
    </Screen>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  rowPressed: { backgroundColor: colors.ink[50] },
  cardPad: { padding: spacing[4] },
  summaryHeading: { marginBottom: spacing[1], letterSpacing: 0.325 },
});
