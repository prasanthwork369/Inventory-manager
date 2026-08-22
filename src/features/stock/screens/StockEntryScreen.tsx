/**
 * Direct port of the web reference's src/pages/stock/StockEntry.tsx. One
 * screen drives all three Stock In/Out/Adjust routes (mode prop), exactly
 * like the web's single component. Flow preserved: product selection ->
 * quantity/details -> review sheet -> processing sheet -> success sheet.
 */
import React from 'react';
import { router } from 'expo-router';
import { CheckCircle2, ScanLine } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { ROUTES } from '@/constants/routes';
import { colors, fontFamily, fontSize, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { AppSheet } from '@/components/ui/AppSheet';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, ListSkeleton, ProcessingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { ProductPicker } from '@/components/common/ProductPicker';
import { ProductThumb } from '@/components/common/ProductThumb';
import { formatMoney, fromMinorUnits, toMinorUnits } from '@/features/products/utils/money';
import { CURRENCY_SYMBOL, STOCK_ADJUST_REASONS, STOCK_OUT_REASONS } from '../constants';
import { useStockEntry } from '../hooks/useStockEntry';
import type { StockEntryMode } from '../types';
import { formatSignedQuantity } from '../utils/quantity';

const CONFIG: Record<StockEntryMode, { title: string; subtitle: string; cta: string }> = {
  in: { title: 'Stock In', subtitle: 'Receive inventory into your shop', cta: 'Confirm Stock In' },
  out: { title: 'Stock Out', subtitle: 'Remove stock that was not sold', cta: 'Confirm Stock Out' },
  adjust: { title: 'Adjust Stock', subtitle: 'Match the system to your physical count', cta: 'Adjust Stock' },
};

interface StockEntryScreenProps {
  mode: StockEntryMode;
}

export function StockEntryScreen({ mode }: StockEntryScreenProps) {
  const toast = useToast();
  const meta = CONFIG[mode];
  const {
    status,
    refetch,
    products,
    suppliers,
    picker,
    setPicker,
    setProduct,
    live,
    qty,
    setQty,
    physical,
    setPhysical,
    cost,
    setCost,
    supplierId,
    setSupplierId,
    reference,
    setReference,
    reason,
    setReason,
    notes,
    setNotes,
    error,
    numQty,
    delta,
    nextStock,
    review,
    setReview,
    processing,
    done,
    requestReview,
    commit,
    resetForAnother,
  } = useStockEntry(mode);

  const handleConfirm = async () => {
    const result = await commit();
    if (result) toast('Stock updated successfully.');
  };

  if (status === 'loading') {
    return (
      <Screen title={meta.title} subtitle={meta.subtitle}>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title={meta.title} subtitle={meta.subtitle}>
        <ErrorNotice
          title="Couldn't load products"
          message="Something went wrong loading your catalogue. Try again."
          action="Retry"
          onAction={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={meta.title}
      subtitle={meta.subtitle}
      footer={
        <Button size="lg" block onPress={requestReview}>
          Review & confirm
        </Button>
      }
    >
      <View style={styles.stack}>
        {error ? <ErrorNotice title="Cannot continue" message={error} /> : null}

        {mode === 'in' && (
          <Card style={styles.card}>
            <Field label="Supplier" hint="Who are you receiving this stock from?">
              <Select
                value={supplierId}
                onChange={setSupplierId}
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                sheetTitle="Supplier"
              />
            </Field>
          </Card>
        )}

        <Card style={styles.card}>
          <AppText size={13} weight="semibold" color={colors.ink[700]} style={styles.productLabel}>
            Product
          </AppText>
          {live ? (
            <Pressable
              onPress={() => setPicker(true)}
              style={({ pressed }) => [styles.productRow, pressed && styles.productRowPressed]}
            >
              <ProductThumb product={live} />
              <View style={styles.flex1}>
                <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                  {live.name}
                </AppText>
                <AppText size={12.5} color={colors.ink[400]}>
                  SKU {live.sku} · in stock {live.currentStock}
                </AppText>
              </View>
              <AppText size={13} weight="semibold" color={colors.brand[600]}>
                Change
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.productPickRow}>
              <View style={styles.flex1}>
                <Button variant="secondary" block onPress={() => setPicker(true)}>
                  Search product
                </Button>
              </View>
              <Button variant="secondary" onPress={() => router.push(ROUTES.scan)} accessibilityLabel="Scan barcode">
                <ScanLine size={18} color={colors.ink.DEFAULT} />
              </Button>
            </View>
          )}
        </Card>

        {live && (
          <Card style={[styles.card, styles.fieldsCard]}>
            {mode === 'adjust' ? (
              <>
                <View style={styles.metricsRow}>
                  <Metric label="System stock" value={`${live.currentStock}`} />
                  <Metric label="Physical" value={physical === '' ? '—' : `${Number(physical)}`} />
                  <Metric
                    label="Difference"
                    value={physical === '' ? '—' : formatSignedQuantity(delta)}
                    tone={delta > 0 ? 'good' : delta < 0 ? 'bad' : undefined}
                  />
                </View>
                <Field label="Physical stock counted" required>
                  <Input keyboardType="numeric" value={physical} onChangeText={setPhysical} placeholder={`${live.currentStock}`} />
                </Field>
                <Field label="Reason" required>
                  <Select
                    value={reason}
                    onChange={setReason}
                    options={STOCK_ADJUST_REASONS.map((r) => ({ value: r, label: r }))}
                    sheetTitle="Reason"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Quantity" required>
                  <View style={styles.qtyRow}>
                    <Button
                      variant="secondary"
                      onPress={() => setQty(String(Math.max(numQty - 1, 0)))}
                      accessibilityLabel="Decrease quantity"
                      style={styles.qtyStepper}
                    >
                      <AppText size={18} weight="bold" color={colors.ink.DEFAULT}>
                        −
                      </AppText>
                    </Button>
                    <Input keyboardType="numeric" value={qty} onChangeText={setQty} placeholder="0" style={styles.qtyInput} />
                    <Button
                      variant="secondary"
                      onPress={() => setQty(String(numQty + 1))}
                      accessibilityLabel="Increase quantity"
                      style={styles.qtyStepper}
                    >
                      <AppText size={18} weight="bold" color={colors.ink.DEFAULT}>
                        +
                      </AppText>
                    </Button>
                  </View>
                </Field>
                {mode === 'in' ? (
                  <>
                    <Field label="Cost price per unit" hint={`Current cost ${formatMoney(live.purchasePriceMinor, CURRENCY_SYMBOL)}`}>
                      <Input
                        prefix={CURRENCY_SYMBOL}
                        keyboardType="numeric"
                        value={cost}
                        onChangeText={setCost}
                        placeholder={`${fromMinorUnits(live.purchasePriceMinor)}`}
                      />
                    </Field>
                    <Field label="Reference" hint="Invoice or delivery note number">
                      <Input value={reference} onChangeText={setReference} placeholder="INV-2043" />
                    </Field>
                  </>
                ) : (
                  <Field label="Reason" required>
                    <Select
                      value={reason}
                      onChange={setReason}
                      options={STOCK_OUT_REASONS.map((r) => ({ value: r, label: r }))}
                      sheetTitle="Reason"
                    />
                  </Field>
                )}
              </>
            )}
            <Field label="Notes" hint="Optional">
              <Textarea value={notes} onChangeText={setNotes} placeholder="Anything to remember about this entry" />
            </Field>
          </Card>
        )}
      </View>

      <ProductPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={setProduct}
        products={products}
        currencySymbol={CURRENCY_SYMBOL}
        excludeOutOfStock={mode === 'out'}
      />

      <AppSheet
        open={review}
        onClose={() => setReview(false)}
        title={`Confirm ${meta.title.toLowerCase()}`}
        description="Check the numbers before this is recorded."
        footer={
          <View style={styles.reviewFooter}>
            <View style={styles.flex1}>
              <Button variant="secondary" block onPress={() => setReview(false)}>
                Back
              </Button>
            </View>
            <View style={styles.flex1}>
              <Button block onPress={handleConfirm}>
                {meta.cta}
              </Button>
            </View>
          </View>
        }
      >
        {live && (
          <View>
            <KeyValue label="Product" value={live.name} />
            <Divider />
            {mode === 'in' && (
              <>
                <KeyValue label="Supplier" value={suppliers.find((s) => s.id === supplierId)?.name ?? '—'} />
                <Divider />
              </>
            )}
            <KeyValue
              label={mode === 'adjust' ? 'Adjustment' : 'Quantity'}
              value={mode === 'adjust' ? `${formatSignedQuantity(delta)} units` : `${numQty} units`}
            />
            <Divider />
            <KeyValue label="Previous stock" value={`${live.currentStock} units`} />
            <Divider />
            <KeyValue label="New stock" value={`${nextStock} units`} strong />
            {mode === 'in' && (
              <>
                <Divider />
                <KeyValue
                  label="Total cost"
                  value={formatMoney(numQty * (cost.trim() ? toMinorUnits(cost) : live.purchasePriceMinor), CURRENCY_SYMBOL)}
                />
              </>
            )}
            {mode !== 'in' && (
              <>
                <Divider />
                <KeyValue label="Reason" value={reason} />
              </>
            )}
          </View>
        )}
      </AppSheet>

      <AppSheet open={processing} onClose={() => undefined} title="Updating stock">
        <ProcessingState title="Recording movement" message="Saving this change to your device." />
      </AppSheet>

      <AppSheet open={!!done} onClose={() => router.back()} title="Stock updated successfully">
        {done && live && (
          <>
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <CheckCircle2 size={28} color={colors.good[600]} />
              </View>
              <AppText size={17} weight="bold" color={colors.ink.DEFAULT} style={styles.successName}>
                {live.name}
              </AppText>
              <AppText size={15} weight="semibold" color={colors.ink[500]} tabular style={styles.successDelta}>
                {done.before} →{' '}
                <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} tabular>
                  {done.after} units
                </AppText>
              </AppText>
            </View>
            <View style={styles.successActions}>
              <Button block size="lg" onPress={resetForAnother}>
                Record another
              </Button>
              <Button block size="lg" variant="secondary" onPress={() => router.push(`/products/${live.id}`)}>
                View product
              </Button>
              <Button block size="lg" variant="ghost" onPress={() => router.push('/more/stock')}>
                Back to stock
              </Button>
            </View>
          </>
        )}
      </AppSheet>
    </Screen>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? colors.good[600] : tone === 'bad' ? colors.bad[600] : colors.ink.DEFAULT;
  return (
    <View style={styles.metric}>
      <AppText size={11.5} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={20} weight="extrabold" tabular color={color} style={styles.metricValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1 },
  card: { padding: spacing[4] },
  fieldsCard: { gap: spacing[4] },
  productLabel: { marginBottom: spacing[2] },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink[200],
    padding: spacing[3],
  },
  productRowPressed: { backgroundColor: colors.ink[50] },
  productPickRow: { flexDirection: 'row', gap: spacing[2] },
  metricsRow: { flexDirection: 'row', gap: spacing[3] },
  metric: { flex: 1, borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3] },
  metricValue: { marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  qtyStepper: { height: 48, width: 48, paddingHorizontal: 0 },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: fontSize[18], fontFamily: fontFamily.bold },
  reviewFooter: { flexDirection: 'row', gap: spacing[3] },
  successWrap: { alignItems: 'center', paddingVertical: spacing[3] },
  successIcon: { height: spacing[14], width: spacing[14], borderRadius: radius['2xl'], backgroundColor: colors.good[50], alignItems: 'center', justifyContent: 'center' },
  successName: { marginTop: spacing[3], textAlign: 'center' },
  successDelta: { marginTop: spacing[1] },
  successActions: { marginTop: spacing[2], gap: spacing[2.5] },
});
