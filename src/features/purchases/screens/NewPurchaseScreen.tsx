/**
 * Direct port of the web reference's src/pages/purchases/NewPurchase.tsx.
 * Not wrapped in the shared `Screen` component — the web source doesn't
 * use its own reusable Screen here either (custom sticky header with a
 * Close/X button + live item-count/total subtitle, custom sticky footer
 * with the running total in the button label), same exception already
 * made for Onboarding. This route is presented as a root-level
 * fullScreenModal (see _layout.tsx), so the header's Close button uses
 * router.back() to dismiss it — the web has no concept of modal
 * presentation, so `navigate('/purchases')` there is the closest literal
 * equivalent, but back() is the correct dismiss for an actual modal.
 */
import React from 'react';
import { router } from 'expo-router';
import { CheckCircle2, Plus, Trash2, X } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { AppSheet } from '@/components/ui/AppSheet';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, Divider, KeyValue } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { EmptyState, ErrorNotice, ListSkeleton, ProcessingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { ProductPicker } from '@/components/common/ProductPicker';
import { ProductThumb } from '@/components/common/ProductThumb';
import { formatMoney } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, PAYMENT_STATUS_OPTIONS, TAX_RATE_PERCENT } from '../constants';
import { useNewPurchase } from '../hooks/useNewPurchase';

export function NewPurchaseScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    status,
    refetch,
    products,
    suppliers,
    supplierId,
    setSupplierId,
    lines,
    addProduct,
    updateLine,
    removeLine,
    discountInput,
    setDiscountInput,
    discountMinor,
    paymentStatus,
    setPaymentStatus,
    notes,
    setNotes,
    picker,
    setPicker,
    error,
    totals,
    review,
    setReview,
    processing,
    done,
    requestReview,
    commit,
  } = useNewPurchase();

  if (status === 'loading') {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <IconButton accessibilityLabel="Close" onPress={() => router.back()}>
              <X size={20} color={colors.ink[700]} />
            </IconButton>
            <AppText size={17} weight="bold" color={colors.ink.DEFAULT}>
              New purchase
            </AppText>
          </View>
        </View>
        <View style={styles.scrollContent}>
          <ListSkeleton rows={3} />
        </View>
      </View>
    );
  }

  const handleConfirm = async () => {
    const purchase = await commit();
    if (purchase) toast('Purchase recorded. Stock increased.');
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <IconButton accessibilityLabel="Close" onPress={() => router.back()}>
            <X size={20} color={colors.ink[700]} />
          </IconButton>
          <View style={styles.flex1}>
            <AppText size={17} weight="bold" color={colors.ink.DEFAULT}>
              New purchase
            </AppText>
            <AppText size={12.5} color={colors.ink[500]}>
              {lines.length} products · {formatMoney(totals.totalMinor, CURRENCY_SYMBOL)}
            </AppText>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {status === 'error' && (
            <ErrorNotice title="Couldn't load products" message="Something went wrong loading your catalogue. Try again." action="Retry" onAction={refetch} />
          )}
          {error ? <ErrorNotice title="Cannot record purchase" message={error} /> : null}

          <Card style={styles.cardPad}>
            <Field label="Supplier" required>
              <Select
                value={supplierId}
                onChange={setSupplierId}
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                sheetTitle="Supplier"
              />
            </Field>
          </Card>

          <Card style={styles.overflowHidden}>
            <View style={styles.itemsHeader}>
              <AppText size={14} weight="bold" color={colors.ink.DEFAULT}>
                Products received
              </AppText>
              <Button size="sm" variant="secondary" icon={<Plus size={16} color={colors.ink.DEFAULT} />} onPress={() => setPicker(true)}>
                Add
              </Button>
            </View>
            {lines.length === 0 ? (
              <EmptyState
                icon={<Plus size={28} color={colors.brand[600]} />}
                title="No products added"
                message="Add the products that arrived in this delivery with their quantity and cost."
                actionLabel="Add product"
                onAction={() => setPicker(true)}
                style={styles.emptyItems}
              />
            ) : (
              <View>
                {lines.map((l, i) => {
                  const product = products.find((p) => p.id === l.productId);
                  return (
                    <View key={l.productId}>
                      {i > 0 && <Divider />}
                      <View style={styles.lineRow}>
                        <View style={styles.lineTop}>
                          {product && <ProductThumb product={product} size="sm" />}
                          <View style={styles.flex1}>
                            <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                              {l.productName}
                            </AppText>
                            <AppText size={12} color={colors.ink[400]}>
                              In stock {product?.currentStock ?? 0} → {(product?.currentStock ?? 0) + l.quantity}
                            </AppText>
                          </View>
                          <IconButton accessibilityLabel={`Remove ${l.productName}`} onPress={() => removeLine(l.productId)}>
                            <Trash2 size={16} color={colors.bad[500]} />
                          </IconButton>
                        </View>
                        <View style={styles.lineFields}>
                          <Field label="Qty">
                            <Input
                              keyboardType="numeric"
                              value={l.quantityInput}
                              onChangeText={(v) => updateLine(l.productId, { quantityInput: v })}
                              style={styles.lineInput}
                            />
                          </Field>
                          <Field label="Cost / unit">
                            <Input
                              prefix={CURRENCY_SYMBOL}
                              keyboardType="decimal-pad"
                              value={l.unitCostInput}
                              onChangeText={(v) => updateLine(l.productId, { unitCostInput: v })}
                              style={styles.lineInput}
                            />
                          </Field>
                          <Field label="Line total">
                            <View style={styles.lineTotal}>
                              <AppText size={14.5} weight="bold" tabular color={colors.ink.DEFAULT}>
                                {formatMoney(l.quantity * l.unitCostMinor, CURRENCY_SYMBOL)}
                              </AppText>
                            </View>
                          </Field>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          {lines.length > 0 && (
            <Card style={[styles.cardPad, styles.cardStack]}>
              <View style={styles.fieldPair}>
                <View style={styles.flex1}>
                  <Field label="Discount">
                    <Input prefix={CURRENCY_SYMBOL} keyboardType="decimal-pad" value={discountInput} onChangeText={setDiscountInput} placeholder="0" />
                  </Field>
                </View>
                <View style={styles.flex1}>
                  <Field label="Payment status">
                    <Select
                      value={paymentStatus}
                      onChange={setPaymentStatus}
                      options={PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                      sheetTitle="Payment status"
                    />
                  </Field>
                </View>
              </View>
              <Field label="Notes" hint="Optional">
                <Textarea value={notes} onChangeText={setNotes} placeholder="Delivery note, driver, remarks" />
              </Field>
              <View style={styles.totalsBox}>
                <KeyValue label="Subtotal" value={formatMoney(totals.subtotalMinor, CURRENCY_SYMBOL)} />
                <KeyValue label="Discount" value={`− ${formatMoney(discountMinor, CURRENCY_SYMBOL)}`} />
                {totals.taxMinor > 0 && <KeyValue label={`Tax (${TAX_RATE_PERCENT}%)`} value={formatMoney(totals.taxMinor, CURRENCY_SYMBOL)} />}
                <Divider />
                <KeyValue label="Total" value={formatMoney(totals.totalMinor, CURRENCY_SYMBOL)} strong />
              </View>
            </Card>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[3] }]}>
          <Button size="lg" block onPress={requestReview}>
            Review purchase · {formatMoney(totals.totalMinor, CURRENCY_SYMBOL)}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <ProductPicker open={picker} onClose={() => setPicker(false)} onSelect={addProduct} products={products} currencySymbol={CURRENCY_SYMBOL} title="Add product to purchase" />

      <AppSheet
        open={review}
        onClose={() => setReview(false)}
        title="Confirm purchase"
        description="Stock will increase as soon as you confirm."
        footer={
          <View style={styles.reviewFooter}>
            <View style={styles.flex1}>
              <Button variant="secondary" block onPress={() => setReview(false)}>
                Back
              </Button>
            </View>
            <View style={styles.flex1}>
              <Button block onPress={handleConfirm}>
                Confirm purchase
              </Button>
            </View>
          </View>
        }
      >
        <View>
          <KeyValue label="Supplier" value={suppliers.find((s) => s.id === supplierId)?.name ?? '—'} />
          <Divider />
          {lines.map((l) => (
            <KeyValue key={l.productId} label={`${l.productName} × ${l.quantity}`} value={formatMoney(l.quantity * l.unitCostMinor, CURRENCY_SYMBOL)} />
          ))}
          <Divider />
          <KeyValue label="Total" value={formatMoney(totals.totalMinor, CURRENCY_SYMBOL)} strong />
          <Divider />
          <KeyValue label="Payment status" value={paymentStatus} />
        </View>
      </AppSheet>

      <AppSheet open={processing} onClose={() => undefined} title="Recording purchase">
        <ProcessingState title="Updating inventory" message="Adding the received units to your stock." />
      </AppSheet>

      <AppSheet open={!!done} onClose={() => router.replace('/more/purchases')} title="Purchase completed">
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
                {formatMoney(done.totalMinor, CURRENCY_SYMBOL)}
              </AppText>
              <AppText size={13} color={colors.ink[400]}>
                {done.supplierName} · {done.items.length} products · {done.paymentStatus}
              </AppText>
              <View style={styles.successBadge}>
                <AppText size={12.5} weight="bold" color={colors.good[700]}>
                  Stock updated automatically
                </AppText>
              </View>
            </View>
            <View style={styles.successActions}>
              <Button block size="lg" onPress={() => router.push(`/more/purchases/${done.id}`)}>
                View purchase
              </Button>
              <Button block size="lg" variant="secondary" onPress={() => router.replace('/more/purchases')}>
                Done
              </Button>
            </View>
          </>
        )}
      </AppSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink[50] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  header: { borderBottomWidth: 1, borderBottomColor: colors.ink[100], backgroundColor: colors.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  scrollContent: { padding: spacing[4], gap: spacing[4] },
  cardPad: { padding: spacing[4] },
  cardStack: { gap: spacing[4] },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  emptyItems: { paddingVertical: spacing[10] },
  lineRow: { padding: spacing[4] },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  lineFields: { marginTop: spacing[2.5], flexDirection: 'row', gap: spacing[2] },
  lineInput: { height: spacing[10] },
  lineTotal: {
    height: spacing[10],
    borderRadius: radius.xl,
    backgroundColor: colors.ink[50],
    paddingHorizontal: spacing[3],
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  fieldPair: { flexDirection: 'row', gap: spacing[4] },
  totalsBox: { borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3.5] },
  footer: { borderTopWidth: 1, borderTopColor: colors.ink[100], backgroundColor: colors.white, paddingHorizontal: spacing[4], paddingTop: spacing[3] },
  reviewFooter: { flexDirection: 'row', gap: spacing[3] },
  successBody: { alignItems: 'center', paddingVertical: spacing[3] },
  successIcon: { height: spacing[14], width: spacing[14], borderRadius: radius['2xl'], backgroundColor: colors.good[50], alignItems: 'center', justifyContent: 'center' },
  successRef: { marginTop: spacing[3] },
  successBadge: { marginTop: spacing[2], borderRadius: radius.full, backgroundColor: colors.good[50], paddingHorizontal: spacing[3], paddingVertical: spacing[1.5] },
  successActions: { marginTop: spacing[2], gap: spacing[2.5] },
});
