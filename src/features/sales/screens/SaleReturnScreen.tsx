/**
 * Direct port of the web reference's src/pages/sales/ReturnSale.tsx.
 * Per-item return quantity is capped at (sold - already returned across
 * prior returns for this sale), not the raw sold quantity the web caps
 * at — see sales/utils/returns.ts for why.
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Minus, Plus, RotateCcw } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { AppSheet } from '@/components/ui/AppSheet';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue } from '@/components/ui/Card';
import { Field, Select, Textarea, Toggle } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton, ProcessingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, RETURN_REASONS } from '../constants';
import { useSaleReturn } from '../hooks/useSaleReturn';
import { formatSignedQuantity } from '@/features/stock/utils/quantity';
import { calculateReturnItemAmount } from '../utils/calculations';
import { dateTimeLabel } from '../utils/format';

export function SaleReturnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const {
    status,
    refetch,
    sale,
    quantities,
    maxReturnable,
    setQuantity,
    reason,
    setReason,
    restock,
    setRestock,
    notes,
    setNotes,
    error,
    selectedLines,
    refundMinor,
    review,
    setReview,
    processing,
    done,
    requestReview,
    commit,
  } = useSaleReturn(id);

  if (status === 'loading') {
    return (
      <Screen title="Return sale">
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title="Return sale">
        <ErrorNotice title="Couldn't load sale" message="Something went wrong loading this sale. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!sale) {
    return (
      <Screen title="Return sale">
        <EmptyState
          icon={<RotateCcw size={28} color={colors.brand[600]} />}
          title="Sale not found"
          message="Search your sales history and open the receipt you want to return."
          actionLabel="Go to sales history"
          onAction={() => router.push('/sales')}
        />
      </Screen>
    );
  }

  const handleConfirm = async () => {
    const record = await commit();
    if (record) toast('Return processed.');
  };

  return (
    <Screen
      title="Return sale"
      subtitle={`${sale.receiptNo} · ${dateTimeLabel(sale.createdAt)}`}
      footer={
        <Button size="lg" block onPress={requestReview}>
          Continue · Refund {formatMoney(refundMinor, CURRENCY_SYMBOL)}
        </Button>
      }
    >
      <View style={styles.stack}>
        {error ? <ErrorNotice title="Nothing selected" message={error} /> : null}

        <Card style={styles.cardPad}>
          <AppText size={13} weight="semibold" color={colors.ink[500]}>
            Original sale
          </AppText>
          <AppText size={22} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.originalTotal}>
            {formatMoney(sale.totalMinor, CURRENCY_SYMBOL)}
          </AppText>
          <AppText size={13} color={colors.ink[400]}>
            {sale.customerName} · {sale.paymentMethod}
          </AppText>
        </Card>

        <View>
          <AppText size={14} weight="bold" color={colors.ink.DEFAULT} style={styles.sectionLabel}>
            Select items to return
          </AppText>
          <Card style={styles.overflowHidden}>
            {sale.items.map((it, i) => {
              const qty = quantities[it.productId] ?? 0;
              const max = maxReturnable(it.productId, it.quantity);
              return (
                <View key={it.productId}>
                  {i > 0 && <Divider />}
                  <View style={styles.itemRow}>
                    <View style={styles.flex1}>
                      <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                        {it.productName}
                      </AppText>
                      <AppText size={12.5} color={colors.ink[400]} tabular>
                        Sold {it.quantity} × {formatMoney(it.unitPriceMinor, CURRENCY_SYMBOL)}
                      </AppText>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable
                        onPress={() => setQuantity(it.productId, qty - 1, max)}
                        accessibilityLabel={`Reduce return quantity for ${it.productName}`}
                        style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
                      >
                        <Minus size={14} color={colors.ink[700]} />
                      </Pressable>
                      <AppText size={14} weight="bold" tabular color={colors.ink.DEFAULT} style={styles.stepperValue}>
                        {qty}
                      </AppText>
                      <Pressable
                        onPress={() => setQuantity(it.productId, qty + 1, max)}
                        accessibilityLabel={`Increase return quantity for ${it.productName}`}
                        style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
                      >
                        <Plus size={14} color={colors.ink[700]} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        <Card style={[styles.cardPad, styles.cardStack]}>
          <Field label="Reason for return" required>
            <Select value={reason} onChange={setReason} options={RETURN_REASONS.map((r) => ({ value: r, label: r }))} sheetTitle="Reason" />
          </Field>
          <View style={styles.restockRow}>
            <View style={styles.flex1}>
              <AppText size={14} weight="semibold" color={colors.ink.DEFAULT}>
                Return items to stock
              </AppText>
              <AppText size={12.5} color={colors.ink[500]} style={styles.restockHint}>
                Turn this off for damaged goods that cannot be sold again.
              </AppText>
            </View>
            <Toggle checked={restock} onChange={setRestock} label="Return items to stock" />
          </View>
          <Field label="Notes" hint="Optional">
            <Textarea value={notes} onChangeText={setNotes} placeholder="Anything the customer told you" />
          </Field>
        </Card>
      </View>

      <AppSheet
        open={review}
        onClose={() => setReview(false)}
        title="Confirm return"
        description="Check the refund and stock impact."
        footer={
          <View style={styles.reviewFooter}>
            <View style={styles.flex1}>
              <Button variant="secondary" block onPress={() => setReview(false)}>
                Back
              </Button>
            </View>
            <View style={styles.flex1}>
              <Button block onPress={handleConfirm}>
                Confirm Return
              </Button>
            </View>
          </View>
        }
      >
        <View>
          <KeyValue label="Original sale" value={sale.receiptNo} />
          <Divider />
          {selectedLines.map((it) => (
            <KeyValue
              key={it.productId}
              label={`${it.productName} × ${it.returnQuantity}`}
              value={formatMoney(calculateReturnItemAmount(it.unitPriceMinor, it.discountMinor, it.quantity, it.returnQuantity), CURRENCY_SYMBOL)}
            />
          ))}
          <Divider />
          <KeyValue label="Refund amount" value={formatMoney(refundMinor, CURRENCY_SYMBOL)} strong />
          <Divider />
          <KeyValue
            label="Stock impact"
            value={restock ? `${formatSignedQuantity(selectedLines.reduce((s, i) => s + i.returnQuantity, 0))} units back` : 'No stock change'}
          />
          <Divider />
          <KeyValue label="Reason" value={reason} />
        </View>
      </AppSheet>

      <AppSheet open={processing} onClose={() => undefined} title="Processing return" dismissable={false}>
        <ProcessingState title="Recording return" message="Updating the sale, refund and stock." />
      </AppSheet>

      <AppSheet open={!!done} onClose={() => router.push(`/sales/${sale.id}`)} title="Return completed">
        {done && (
          <>
            <View style={styles.successBody}>
              <View style={styles.successIcon}>
                <CheckCircle2 size={28} color={colors.good[600]} />
              </View>
              <AppText size={15} weight="semibold" color={colors.ink[500]} style={styles.successRef}>
                {done.reference}
              </AppText>
              <AppText size={28} weight="extrabold" tabular color={colors.ink.DEFAULT}>
                {formatMoney(done.refundMinor, CURRENCY_SYMBOL)}
              </AppText>
              <AppText size={13} color={colors.ink[400]}>
                {restock ? 'Items returned to stock' : 'Items were not returned to stock'}
              </AppText>
            </View>
            <View style={styles.successActions}>
              <Button block size="lg" onPress={() => router.push(`/sales/${sale.id}`)}>
                View sale
              </Button>
              <Button block size="lg" variant="secondary" onPress={() => router.push('/sales')}>
                Done
              </Button>
            </View>
          </>
        )}
      </AppSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  cardPad: { padding: spacing[4] },
  cardStack: { gap: spacing[4] },
  originalTotal: { marginTop: 2 },
  sectionLabel: { paddingHorizontal: spacing[1], paddingBottom: spacing[2] },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  stepperButton: { height: spacing[8], width: spacing[8], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.ink[200], alignItems: 'center', justifyContent: 'center' },
  stepperButtonPressed: { backgroundColor: colors.ink[50] },
  stepperValue: { width: spacing[6], textAlign: 'center' },
  restockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[4], borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3.5] },
  restockHint: { marginTop: 2 },
  reviewFooter: { flexDirection: 'row', gap: spacing[3] },
  successBody: { alignItems: 'center', paddingVertical: spacing[3] },
  successIcon: { height: spacing[14], width: spacing[14], borderRadius: radius['2xl'], backgroundColor: colors.good[50], alignItems: 'center', justifyContent: 'center' },
  successRef: { marginTop: spacing[3] },
  successActions: { marginTop: spacing[2], gap: spacing[2.5] },
});
