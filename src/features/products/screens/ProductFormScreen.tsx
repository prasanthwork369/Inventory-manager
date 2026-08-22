/**
 * Direct port of the web reference's src/pages/products/ProductForm.tsx.
 * Card grouping/order preserved exactly: Photo+Name -> Identification ->
 * Pricing -> Stock -> Sourcing (Supplier field dropped — see types.ts for
 * why Product has no supplierId). `sm:grid-cols-2` field pairs are a
 * desktop-only breakpoint the web source itself never applies at mobile
 * width, so these are single-column stacks here too, not a redesign.
 *
 * Does not persist yet — submit() resolves through the temporary
 * provider's simulated delay only (see data/productsProvider.ts).
 */
import React from 'react';
import { router } from 'expo-router';
import { CheckCircle2, ImagePlus, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { AppSheet } from '@/components/ui/AppSheet';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useProductForm } from '../hooks/useProductForm';
import { formatMoney } from '../utils/money';

const CURRENCY_SYMBOL = '₹';

interface ProductFormScreenProps {
  productId?: string;
}

export function ProductFormScreen({ productId }: ProductFormScreenProps) {
  const toast = useToast();
  const isEdit = Boolean(productId);
  const {
    loading,
    notFound,
    draft,
    errors,
    updateField,
    categories,
    currentStock,
    marginPreview,
    saving,
    success,
    savedProduct,
    submit,
    resetForCreateAnother,
  } = useProductForm(productId);

  const handleSubmit = async () => {
    const result = await submit();
    if (result.success && isEdit && result.product) {
      toast('Product updated successfully.');
      router.replace(`/products/${result.product.id}`);
    }
  };

  if (notFound) {
    return (
      <Screen title="Product not found">
        <ErrorNotice title="This product no longer exists" message="It may have been deleted from your catalogue." />
      </Screen>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Screen
      title={isEdit ? 'Edit product' : 'Add product'}
      subtitle={isEdit ? draft.name : 'New item in your catalogue'}
      footer={
        <Button size="lg" block loading={saving || loading} onPress={handleSubmit}>
          {isEdit ? 'Save changes' : 'Add product'}
        </Button>
      }
    >
      <View style={styles.stack}>
        {hasErrors && <ErrorNotice title="Some details need fixing" message="Check the highlighted fields below, then save again." />}

        <Card style={styles.cardPad}>
          <View style={styles.photoRow}>
            <Pressable
              onPress={() => toast("Photo upload isn't available yet.", 'info')}
              style={styles.photoButton}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <ImagePlus size={20} color={colors.ink[400]} />
              <AppText size={11} weight="semibold" color={colors.ink[400]}>
                Photo
              </AppText>
            </Pressable>
            <View style={styles.flex1}>
              <Field label="Product name" required error={errors.name}>
                <Input
                  value={draft.name}
                  onChangeText={(v) => updateField('name', v)}
                  placeholder="e.g. Wireless Mouse"
                  invalid={!!errors.name}
                />
              </Field>
            </View>
          </View>
        </Card>

        <Card style={[styles.cardPad, styles.cardStack]}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.sectionLabel}>
            Identification
          </AppText>
          <View style={styles.fieldStack}>
            <Field label="SKU" required error={errors.sku} hint="Must be unique">
              <Input value={draft.sku} onChangeText={(v) => updateField('sku', v)} placeholder="WM-104" invalid={!!errors.sku} />
            </Field>
            <Field label="Barcode" error={errors.barcode}>
              <Input
                value={draft.barcode}
                onChangeText={(v) => updateField('barcode', v)}
                placeholder="8901234500011"
                keyboardType="numeric"
                invalid={!!errors.barcode}
              />
            </Field>
            <Field label="Category">
              <Select
                value={draft.categoryId}
                onChange={(v) => updateField('categoryId', v)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                sheetTitle="Category"
              />
            </Field>
            <Field label="Brand">
              <Input value={draft.brand} onChangeText={(v) => updateField('brand', v)} placeholder="Logiteck" />
            </Field>
          </View>
        </Card>

        <Card style={[styles.cardPad, styles.cardStack]}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.sectionLabel}>
            Pricing
          </AppText>
          <View style={styles.fieldStack}>
            <Field label="Cost price" error={errors.purchasePrice}>
              <Input
                prefix={CURRENCY_SYMBOL}
                keyboardType="decimal-pad"
                value={draft.purchasePriceInput}
                onChangeText={(v) => updateField('purchasePriceInput', v)}
                placeholder="0"
                invalid={!!errors.purchasePrice}
              />
            </Field>
            <Field label="Selling price" required error={errors.sellingPrice}>
              <Input
                prefix={CURRENCY_SYMBOL}
                keyboardType="decimal-pad"
                value={draft.sellingPriceInput}
                onChangeText={(v) => updateField('sellingPriceInput', v)}
                placeholder="0"
                invalid={!!errors.sellingPrice}
              />
            </Field>
          </View>
          {marginPreview && (
            <View style={styles.marginBanner}>
              <AppText size={13} weight="semibold" color={colors.good[700]}>
                Margin {formatMoney(marginPreview.marginMinor, CURRENCY_SYMBOL)} per unit ({marginPreview.percent}%)
              </AppText>
            </View>
          )}
        </Card>

        <Card style={[styles.cardPad, styles.cardStack]}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.sectionLabel}>
            Stock
          </AppText>
          {isEdit ? (
            <View style={styles.infoBox}>
              <Info size={18} color={colors.ink[500]} style={styles.infoIcon} />
              <AppText size={13} color={colors.ink.DEFAULT} style={styles.infoText}>
                Stock is <AppText size={13} weight="bold" color={colors.ink.DEFAULT}>{currentStock ?? 0} units</AppText>. To change it,
                use Stock In, Stock Out or Adjust Stock so the movement is recorded in history.
              </AppText>
            </View>
          ) : (
            <View style={styles.fieldStack}>
              <Field label="Opening stock" error={errors.openingStock}>
                <Input
                  keyboardType="number-pad"
                  value={draft.openingStockInput}
                  onChangeText={(v) => updateField('openingStockInput', v)}
                  placeholder="0"
                  invalid={!!errors.openingStock}
                />
              </Field>
              <Field label="Minimum stock" hint="Alerts you when stock drops here" error={errors.minimumStock}>
                <Input
                  keyboardType="number-pad"
                  value={draft.minimumStockInput}
                  onChangeText={(v) => updateField('minimumStockInput', v)}
                  placeholder="5"
                  invalid={!!errors.minimumStock}
                />
              </Field>
            </View>
          )}
          {isEdit && (
            <Field label="Minimum stock" hint="Alerts you when stock drops here" error={errors.minimumStock}>
              <Input
                keyboardType="number-pad"
                value={draft.minimumStockInput}
                onChangeText={(v) => updateField('minimumStockInput', v)}
                invalid={!!errors.minimumStock}
              />
            </Field>
          )}
        </Card>

        <Card style={[styles.cardPad, styles.cardStack]}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.sectionLabel}>
            Sourcing
          </AppText>
          <Field label="Storage location">
            <Input value={draft.location} onChangeText={(v) => updateField('location', v)} placeholder="Rack A2" />
          </Field>
          <Field label="Notes">
            <Textarea
              value={draft.description}
              onChangeText={(v) => updateField('description', v)}
              placeholder="Anything worth remembering about this product"
            />
          </Field>
        </Card>
      </View>

      <AppSheet open={success} onClose={() => router.push('/products')} title="Product added successfully">
        <View style={styles.successBody}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={28} color={colors.good[600]} />
          </View>
          <AppText size={17} weight="bold" color={colors.ink.DEFAULT} style={styles.successTitle}>
            {savedProduct?.name}
          </AppText>
          <AppText size={13.5} color={colors.ink[500]}>
            SKU {savedProduct?.sku} · {savedProduct?.currentStock} units opening stock
          </AppText>
        </View>
        <View style={styles.successActions}>
          <Button block size="lg" onPress={() => savedProduct && router.push(`/products/${savedProduct.id}`)}>
            View product
          </Button>
          <Button block size="lg" variant="secondary" onPress={resetForCreateAnother}>
            Add another
          </Button>
          <Button block size="lg" variant="ghost" onPress={() => router.push('/products')}>
            Go to products
          </Button>
        </View>
      </AppSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  cardPad: { padding: spacing[4] },
  cardStack: { gap: spacing[4] },
  flex1: { flex: 1 },
  // web: text-[13px] uppercase tracking-wide -> +0.025em
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.325 },
  fieldStack: { gap: spacing[4] },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  photoButton: {
    height: 80,
    width: 80,
    flexShrink: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: radius['2xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.ink[200],
  },
  marginBanner: {
    borderRadius: radius.xl,
    backgroundColor: colors.good[50],
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2.5],
  },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5], borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3.5] },
  infoIcon: { marginTop: 2 },
  // web: text-[13px] leading-relaxed -> 13*1.625
  infoText: { flex: 1, lineHeight: 21.13 },
  successBody: { alignItems: 'center', paddingVertical: spacing[4] },
  successIcon: { height: 56, width: 56, borderRadius: radius['2xl'], backgroundColor: colors.good[50], alignItems: 'center', justifyContent: 'center' },
  successTitle: { marginTop: spacing[3] },
  successActions: { marginTop: spacing[2], gap: spacing[2.5] },
});
