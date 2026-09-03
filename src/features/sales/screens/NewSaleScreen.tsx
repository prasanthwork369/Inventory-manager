/**
 * Direct port of the web reference's src/pages/sales/NewSale.tsx. Not
 * wrapped in the shared `Screen` component — the web source doesn't use
 * its own reusable Screen here either (custom sticky header with a
 * Close/X + Scan button, custom sticky footer per step), same exception
 * already made for Onboarding/NewPurchase. This route is a root-level
 * fullScreenModal (see _layout.tsx); the header's Close button opens the
 * same clear-cart confirm the web does when the cart isn't empty, or
 * dismisses via router.back() when it is (web navigates to /sales
 * directly; back() is the correct dismiss for an actual modal — same
 * adaptation as NewPurchaseScreen).
 *
 * No review sheet: the cart -> summary -> payment steps themselves are
 * the review, and "Complete Sale" commits directly, matching the web
 * exactly (unlike Purchases/Stock, which do have a review sheet).
 */
import React from 'react';
import { router } from 'expo-router';
import {
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  ScanLine,
  Share2,
  ShoppingCart,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { AppSheet, ConfirmDialog } from '@/components/ui/AppSheet';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, Divider, KeyValue } from '@/components/ui/Card';
import { Field, Input, SearchInput, Select } from '@/components/ui/Fields';
import { EmptyState, ErrorNotice, ListSkeleton, ProcessingState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { ProductThumb } from '@/components/common/ProductThumb';
import type { Product } from '@/features/products/types';
import { formatMoney } from '@/features/products/utils/money';
import { getStockStatus } from '@/features/products/utils/stockStatus';
import { CURRENCY_SYMBOL, PAYMENT_METHODS } from '../constants';
import { useNewSale } from '../hooks/useNewSale';
import type { SaleLineDraft } from '../hooks/useNewSale';

export function NewSaleScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    status,
    refetch,
    products,
    customers,
    step,
    setStep,
    items,
    query,
    setQuery,
    orderDiscountInput,
    setOrderDiscountInput,
    customerId,
    setCustomerId,
    customerName,
    customerSheetOpen,
    setCustomerSheetOpen,
    method,
    setMethod,
    receivedInput,
    setReceivedInput,
    processing,
    completed,
    clearOpen,
    setClearOpen,
    error,
    totals,
    changeMinor,
    addToCart,
    changeQuantity,
    addAndSelectCustomer,
    clearCart,
    complete,
    resetForNewSale,
  } = useNewSale();

  const [newCustomerName, setNewCustomerName] = React.useState('');
  const [newCustomerPhone, setNewCustomerPhone] = React.useState('');

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const stepTitle = step === 'cart' ? 'New Sale' : step === 'summary' ? 'Review sale' : 'Payment';

  const handleClose = () => {
    if (items.length > 0) setClearOpen(true);
    else router.back();
  };

  const handleComplete = async () => {
    const sale = await complete();
    if (sale) toast('Sale completed. Stock updated.');
  };

  const handleAddCustomer = async () => {
    await addAndSelectCustomer(newCustomerName, newCustomerPhone);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  if (status === 'loading') {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <IconButton accessibilityLabel="Close sale" onPress={() => router.back()}>
              <X size={20} color={colors.ink[700]} />
            </IconButton>
            <AppText size={17} weight="bold" color={colors.ink.DEFAULT}>
              New Sale
            </AppText>
          </View>
        </View>
        <View style={styles.scrollContent}>
          <ListSkeleton rows={3} />
        </View>
      </View>
    );
  }

  const searchResults = query.trim()
    ? products.filter((p) => `${p.name} ${p.sku} ${p.barcode ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 24)
    : products.slice(0, 12);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <IconButton accessibilityLabel="Close sale" onPress={handleClose}>
            <X size={20} color={colors.ink[700]} />
          </IconButton>
          <View style={styles.flex1}>
            <AppText size={17} weight="bold" color={colors.ink.DEFAULT}>
              {stepTitle}
            </AppText>
            <AppText size={12.5} color={colors.ink[500]}>
              {itemCount} items · {formatMoney(totals.totalMinor, CURRENCY_SYMBOL)}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/scan')} style={styles.scanButton} accessibilityRole="button">
            <ScanLine size={16} color={colors.ink[700]} />
            <AppText size={13} weight="semibold" color={colors.ink[700]}>
              Scan
            </AppText>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {status === 'error' && (
            <ErrorNotice title="Couldn't load products" message="Something went wrong loading your catalogue. Try again." action="Retry" onAction={refetch} />
          )}
          {error ? <ErrorNotice title="Insufficient stock" message={error} /> : null}

          {step === 'cart' && (
            <View style={styles.cartStep}>
              <SearchInput value={query} onChangeText={setQuery} placeholder="Search product or scan barcode" style={styles.searchInput} />
              <View style={styles.grid}>
                {searchResults.map((p) => (
                  <ProductGridItem key={p.id} product={p} inCart={items.find((i) => i.productId === p.id)?.quantity ?? 0} onPress={() => addToCart(p.id)} />
                ))}
              </View>

              <Card style={styles.overflowHidden}>
                <View style={styles.cartHeader}>
                  <AppText size={14} weight="bold" color={colors.ink.DEFAULT}>
                    Cart
                  </AppText>
                  {items.length > 0 && (
                    <Pressable onPress={() => setClearOpen(true)} style={styles.clearLink} accessibilityRole="button">
                      <Trash2 size={14} color={colors.bad[600]} />
                      <AppText size={12.5} weight="semibold" color={colors.bad[600]}>
                        Clear
                      </AppText>
                    </Pressable>
                  )}
                </View>
                {items.length === 0 ? (
                  <EmptyState icon={<ShoppingCart size={28} color={colors.brand[600]} />} title="Cart is empty" message="Search or scan a product to start this sale." style={styles.emptyCart} />
                ) : (
                  <View>
                    {items.map((it, i) => (
                      <View key={it.productId}>
                        {i > 0 && <Divider />}
                        <CartLineRow line={it} product={products.find((p) => p.id === it.productId)} onDecrease={() => changeQuantity(it.productId, -1)} onIncrease={() => addToCart(it.productId)} />
                      </View>
                    ))}
                  </View>
                )}
              </Card>

              {items.length > 0 && (
                <Card style={styles.cardPad}>
                  <Pressable onPress={() => setCustomerSheetOpen(true)} style={({ pressed }) => [styles.customerRow, pressed && styles.customerRowPressed]}>
                    <View style={styles.customerIcon}>
                      <UserRound size={18} color={colors.ink[700]} />
                    </View>
                    <View style={styles.flex1}>
                      <AppText size={14} weight="semibold" color={colors.ink.DEFAULT}>
                        {customerName}
                      </AppText>
                      <AppText size={12} color={colors.ink[400]}>
                        Tap to change customer
                      </AppText>
                    </View>
                  </Pressable>
                  <View style={styles.cartTotals}>
                    <KeyValue label="Subtotal" value={formatMoney(totals.subtotalMinor, CURRENCY_SYMBOL)} />
                    <KeyValue label={`Tax (5%)`} value={formatMoney(totals.taxMinor, CURRENCY_SYMBOL)} />
                    <Divider />
                    <KeyValue label="Total" value={formatMoney(totals.totalMinor, CURRENCY_SYMBOL)} strong />
                  </View>
                  <Button size="lg" block style={styles.continueButton} onPress={() => setStep('summary')}>
                    Continue
                  </Button>
                </Card>
              )}
            </View>
          )}

          {step === 'summary' && (
            <View style={styles.centeredStep}>
              <Card style={styles.overflowHidden}>
                {items.map((it, i) => (
                  <View key={it.productId}>
                    {i > 0 && <Divider />}
                    <View style={styles.summaryItemRow}>
                      <View style={styles.flex1}>
                        <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                          {it.productName}
                        </AppText>
                        <AppText size={12.5} color={colors.ink[400]} tabular>
                          {it.quantity} × {formatMoney(it.unitPriceMinor, CURRENCY_SYMBOL)}
                        </AppText>
                      </View>
                      <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
                        {formatMoney(it.quantity * it.unitPriceMinor - it.discountMinor, CURRENCY_SYMBOL)}
                      </AppText>
                    </View>
                  </View>
                ))}
              </Card>

              <Card style={[styles.cardPad, styles.cardStack]}>
                <Field label="Order discount" hint="Applied before tax">
                  <Input prefix={CURRENCY_SYMBOL} keyboardType="decimal-pad" value={orderDiscountInput} onChangeText={setOrderDiscountInput} placeholder="0" />
                </Field>
                <Field label="Customer">
                  <Select
                    value={customerId ?? ''}
                    onChange={(v) => setCustomerId(v || null)}
                    options={[{ value: '', label: 'Walk-in Customer' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
                    sheetTitle="Customer"
                  />
                </Field>
              </Card>

              <Card style={styles.cardPad}>
                <KeyValue label="Subtotal" value={formatMoney(totals.subtotalMinor, CURRENCY_SYMBOL)} />
                <KeyValue label="Discount" value={`− ${formatMoney(totals.subtotalMinor - totals.taxableMinor, CURRENCY_SYMBOL)}`} />
                <KeyValue label={`Tax (5%)`} value={formatMoney(totals.taxMinor, CURRENCY_SYMBOL)} />
                <Divider />
                <KeyValue label="Total payable" value={formatMoney(totals.totalMinor, CURRENCY_SYMBOL)} strong />
              </Card>

              <View style={styles.stepButtonsRow}>
                <View style={styles.flex1}>
                  <Button variant="secondary" size="lg" block onPress={() => setStep('cart')}>
                    Back
                  </Button>
                </View>
                <View style={styles.flex1}>
                  <Button size="lg" block onPress={() => setStep('payment')}>
                    Continue to Payment
                  </Button>
                </View>
              </View>
            </View>
          )}

          {step === 'payment' && (
            <View style={styles.centeredStep}>
              <Card style={styles.dueCard}>
                <AppText size={13} weight="semibold" color={colors.ink[500]}>
                  Amount due
                </AppText>
                <AppText size={38} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.dueAmount}>
                  {formatMoney(totals.totalMinor, CURRENCY_SYMBOL)}
                </AppText>
                <AppText size={13} color={colors.ink[400]} style={styles.dueCaption}>
                  {customerName}
                </AppText>
              </Card>

              <Card style={[styles.cardPad, styles.cardStack]}>
                <View>
                  <AppText size={13} weight="semibold" color={colors.ink[700]} style={styles.methodLabel}>
                    Payment method
                  </AppText>
                  <View style={styles.methodGrid}>
                    {PAYMENT_METHODS.map((m) => {
                      const selected = method === m;
                      return (
                        <Pressable key={m} onPress={() => setMethod(m)} style={[styles.methodButton, selected ? styles.methodButtonSelected : styles.methodButtonDefault]}>
                          <AppText size={13.5} weight="semibold" color={selected ? colors.brand[700] : colors.ink[500]}>
                            {m}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <Field label="Amount received">
                  <Input prefix={CURRENCY_SYMBOL} keyboardType="decimal-pad" value={receivedInput} onChangeText={setReceivedInput} placeholder={`${totals.totalMinor / 100}`} />
                </Field>
                <View style={styles.quickAmounts}>
                  {[totals.totalMinor, Math.ceil(totals.totalMinor / 10000) * 10000, Math.ceil(totals.totalMinor / 50000) * 50000].map((amt, i) => (
                    <Pressable key={`${amt}-${i}`} onPress={() => setReceivedInput(String(amt / 100))} style={styles.quickAmountChip}>
                      <AppText size={13} weight="semibold" color={colors.ink[700]}>
                        {formatMoney(amt, CURRENCY_SYMBOL)}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.changeBox}>
                  <KeyValue label="Change to return" value={formatMoney(changeMinor, CURRENCY_SYMBOL)} strong />
                </View>
              </Card>

              <View style={styles.stepButtonsRow}>
                <View style={styles.flex1}>
                  <Button variant="secondary" size="lg" block onPress={() => setStep('summary')}>
                    Back
                  </Button>
                </View>
                <View style={styles.flex1}>
                  <Button variant="success" size="lg" block onPress={handleComplete}>
                    Complete Sale
                  </Button>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <AppSheet open={customerSheetOpen} onClose={() => setCustomerSheetOpen(false)} title="Choose customer" description="Customer is optional on every sale.">
        <View style={styles.customerSheetStack}>
          <Pressable
            onPress={() => {
              setCustomerId(null);
              setCustomerSheetOpen(false);
            }}
            style={styles.customerOptionRow}
          >
            <UserRound size={18} color={colors.ink[500]} />
            <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} style={styles.flex1}>
              Walk-in Customer
            </AppText>
            {!customerId && <Badge tone="brand">Selected</Badge>}
          </Pressable>
          {customers.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setCustomerId(c.id);
                setCustomerSheetOpen(false);
              }}
              style={styles.customerOptionRow}
            >
              <View style={styles.customerAvatar}>
                <AppText size={13} weight="bold" color={colors.brand[700]}>
                  {c.name.slice(0, 2).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.flex1}>
                <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
                  {c.name}
                </AppText>
                <AppText size={12} color={colors.ink[400]}>
                  {c.phone}
                </AppText>
              </View>
              {customerId === c.id && <Badge tone="brand">Selected</Badge>}
            </Pressable>
          ))}
        </View>
        <View style={styles.newCustomerBox}>
          <View style={styles.newCustomerHeading}>
            <UserPlus size={16} color={colors.brand[600]} />
            <AppText size={13.5} weight="bold" color={colors.ink.DEFAULT}>
              New customer
            </AppText>
          </View>
          <View style={styles.newCustomerFields}>
            <Input placeholder="Name" value={newCustomerName} onChangeText={setNewCustomerName} />
            <Input placeholder="Phone" value={newCustomerPhone} onChangeText={setNewCustomerPhone} keyboardType="phone-pad" />
            <Button block disabled={!newCustomerName.trim()} onPress={handleAddCustomer}>
              Add & select
            </Button>
          </View>
        </View>
      </AppSheet>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear this cart?"
        message="All items in this sale will be removed. Nothing has been recorded yet."
        confirmLabel="Clear cart"
        detail={`${items.length} products · ${formatMoney(totals.totalMinor, CURRENCY_SYMBOL)}`}
        onConfirm={() => {
          clearCart();
          router.back();
        }}
      />

      <AppSheet open={processing} onClose={() => undefined} title="Processing payment">
        <ProcessingState title="Completing sale" message="Recording the sale and updating stock on this device." />
      </AppSheet>

      <AppSheet open={!!completed} onClose={() => router.replace('/sales')} title="Sale completed">
        {completed && (
          <>
            <View style={styles.completedBody}>
              <View style={styles.completedIcon}>
                <CheckCircle2 size={32} color={colors.good[600]} />
              </View>
              <AppText size={30} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.completedAmount}>
                {formatMoney(completed.totalMinor, CURRENCY_SYMBOL)}
              </AppText>
              <AppText size={13.5} color={colors.ink[500]}>
                {completed.receiptNo} · {completed.paymentMethod} · {completed.customerName}
              </AppText>
              {changeMinor > 0 && (
                <View style={styles.changeBadge}>
                  <AppText size={13} weight="bold" color={colors.warn[700]}>
                    Return change {formatMoney(changeMinor, CURRENCY_SYMBOL)}
                  </AppText>
                </View>
              )}
              <AppText size={12.5} color={colors.ink[400]} style={styles.completedNote}>
                Stock has been updated automatically.
              </AppText>
            </View>
            <View style={styles.completedActions}>
              <Button block size="lg" onPress={() => router.push(`/sales/receipt/${completed.id}`)}>
                View Receipt
              </Button>
              <View style={styles.completedShareRow}>
                <View style={styles.flex1}>
                  <Button block variant="secondary" icon={<Share2 size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Receipt shared.', 'info')}>
                    Share
                  </Button>
                </View>
                <View style={styles.flex1}>
                  <Button block variant="secondary" icon={<Printer size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Sent to printer.', 'info')}>
                    Print
                  </Button>
                </View>
              </View>
              <Button block size="lg" variant="ghost" onPress={resetForNewSale}>
                New Sale
              </Button>
            </View>
          </>
        )}
      </AppSheet>
    </View>
  );
}

function ProductGridItem({ product, inCart, onPress }: { product: Product; inCart: number; onPress: () => void }) {
  const status = getStockStatus(product);
  const statusColor = status === 'out' ? colors.bad[600] : status === 'low' ? colors.warn[600] : colors.ink[400];
  return (
    <Pressable
      onPress={onPress}
      disabled={status === 'out'}
      style={({ pressed }) => [styles.gridItem, status === 'out' ? styles.gridItemOut : pressed && styles.gridItemPressed]}
    >
      <ProductThumb product={product} size="sm" />
      <AppText size={13.5} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={2} style={styles.gridItemName}>
        {product.name}
      </AppText>
      <AppText size={15} weight="extrabold" tabular color={colors.ink.DEFAULT} style={styles.gridItemPrice}>
        {formatMoney(product.sellingPriceMinor, CURRENCY_SYMBOL)}
      </AppText>
      <AppText size={11.5} weight="semibold" color={statusColor}>
        {status === 'out' ? 'Out of stock' : `${product.currentStock} in stock`}
      </AppText>
      {inCart > 0 && (
        <View style={styles.gridItemBadge}>
          <AppText size={12} weight="bold" color={colors.white}>
            {inCart}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

function CartLineRow({ line, product, onDecrease, onIncrease }: { line: SaleLineDraft; product: Product | undefined; onDecrease: () => void; onIncrease: () => void }) {
  return (
    <View style={styles.cartLineRow}>
      {product && <ProductThumb product={product} size="sm" />}
      <View style={styles.flex1}>
        <AppText size={14} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
          {line.productName}
        </AppText>
        <AppText size={12.5} color={colors.ink[400]} tabular>
          {formatMoney(line.unitPriceMinor, CURRENCY_SYMBOL)} each
        </AppText>
      </View>
      <View style={styles.lineStepper}>
        <Pressable onPress={onDecrease} accessibilityLabel="Decrease" style={styles.lineStepperButton}>
          <Minus size={14} color={colors.ink.DEFAULT} />
        </Pressable>
        <AppText size={14} weight="bold" tabular color={colors.ink.DEFAULT} style={styles.lineStepperValue}>
          {line.quantity}
        </AppText>
        <Pressable onPress={onIncrease} accessibilityLabel="Increase" style={styles.lineStepperButton}>
          <Plus size={14} color={colors.ink.DEFAULT} />
        </Pressable>
      </View>
      <AppText size={14} weight="bold" tabular color={colors.ink.DEFAULT} style={styles.lineTotal}>
        {formatMoney(line.quantity * line.unitPriceMinor - line.discountMinor, CURRENCY_SYMBOL)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink[50] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  header: { borderBottomWidth: 1, borderBottomColor: colors.ink[100], backgroundColor: colors.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  scanButton: {
    height: spacing[10],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink[200],
    paddingHorizontal: spacing[3],
  },
  scrollContent: { padding: spacing[4], gap: spacing[4] },
  cartStep: { gap: spacing[3] },
  searchInput: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5] },
  gridItem: {
    width: '47%',
    alignItems: 'flex-start',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[3],
    ...shadows.card,
  },
  gridItemOut: { opacity: 0.55 },
  gridItemPressed: { borderColor: colors.brand[300], backgroundColor: withOpacity(colors.brand[50], 50) },
  gridItemName: { marginTop: spacing[2], lineHeight: 17 },
  gridItemPrice: { marginTop: spacing[1] },
  gridItemBadge: {
    position: 'absolute',
    right: spacing[2],
    top: spacing[2],
    height: 24,
    minWidth: 24,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1.5],
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  clearLink: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  emptyCart: { paddingVertical: spacing[10] },
  cartLineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  lineStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  lineStepperButton: { height: spacing[8], width: spacing[8], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.ink[200], alignItems: 'center', justifyContent: 'center' },
  lineStepperValue: { width: spacing[6], textAlign: 'center' },
  lineTotal: { width: spacing[16], textAlign: 'right' },
  cardPad: { padding: spacing[4] },
  cardStack: { gap: spacing[4] },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderRadius: radius.xl, borderWidth: 1, borderColor: colors.ink[200], padding: spacing[3] },
  customerRowPressed: { backgroundColor: colors.ink[50] },
  customerIcon: { height: spacing[9], width: spacing[9], borderRadius: radius.xl, backgroundColor: colors.ink[100], alignItems: 'center', justifyContent: 'center' },
  cartTotals: { marginTop: spacing[3] },
  continueButton: { marginTop: spacing[3] },
  centeredStep: { gap: spacing[4], width: '100%', maxWidth: 512, alignSelf: 'center' },
  summaryItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  stepButtonsRow: { flexDirection: 'row', gap: spacing[3] },
  dueCard: { padding: spacing[5], alignItems: 'center' },
  dueAmount: { marginTop: spacing[1], lineHeight: 38, letterSpacing: -0.95 },
  dueCaption: { marginTop: spacing[1.5] },
  methodLabel: { marginBottom: spacing[2] },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  methodButton: { flexBasis: '22%', flexGrow: 1, borderRadius: radius.xl, borderWidth: 1, paddingVertical: spacing[3], alignItems: 'center' },
  methodButtonSelected: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  methodButtonDefault: { borderColor: colors.ink[200] },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  quickAmountChip: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.ink[200], paddingHorizontal: spacing[3.5], paddingVertical: spacing[1.5] },
  changeBox: { borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3.5] },
  customerSheetStack: { gap: spacing[2] },
  customerOptionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderRadius: radius.xl, borderWidth: 1, borderColor: colors.ink[200], padding: spacing[3] },
  customerAvatar: { height: spacing[9], width: spacing[9], borderRadius: radius.xl, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  newCustomerBox: { marginTop: spacing[4], borderRadius: radius['2xl'], borderWidth: 1, borderStyle: 'dashed', borderColor: colors.ink[200], padding: spacing[4] },
  newCustomerHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  newCustomerFields: { gap: spacing[3] },
  completedBody: { alignItems: 'center', paddingVertical: spacing[3] },
  completedIcon: { height: spacing[16], width: spacing[16], borderRadius: radius['2xl'], backgroundColor: colors.good[50], alignItems: 'center', justifyContent: 'center' },
  completedAmount: { marginTop: spacing[3], letterSpacing: -0.75 },
  changeBadge: { marginTop: spacing[2], borderRadius: radius.full, backgroundColor: colors.warn[50], paddingHorizontal: spacing[3], paddingVertical: spacing[1.5] },
  completedNote: { marginTop: spacing[3] },
  completedActions: { marginTop: spacing[2], gap: spacing[2.5] },
  completedShareRow: { flexDirection: 'row', gap: spacing[2.5] },
});
