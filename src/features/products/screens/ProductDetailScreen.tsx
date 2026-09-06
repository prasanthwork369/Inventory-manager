/**
 * Direct port of the web reference's src/pages/products/ProductDetail.tsx.
 * Section order preserved: hero card (thumb/badges/name/price) -> stat
 * row -> low/out ErrorNotice -> action grid -> Product activity ->
 * Details card -> (Supplier card dropped, see types.ts). `lg:grid-cols-3`
 * is desktop-only; the web source itself renders this single-column at
 * mobile width, so this is that same order, not a redesign.
 *
 * "Product activity" always shows the empty state — Stock's provider
 * already depends on Products' (for productName/currentStock lookups), so
 * wiring Products back to Stock's getMovements() for this section would
 * create a circular feature dependency. Same one-directional-dependency
 * reasoning already applied to Suppliers/Customers not reading Purchases/
 * Sales data (see suppliers/types.ts's SupplierDetailSummary comment) —
 * Products stays upstream of Stock, not the reverse.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PackageX,
  Pencil,
  Scale,
  Trash2,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { ROUTES } from '@/constants/routes';
import { colors, radius, shadows, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/AppSheet';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { ProductThumb } from '@/components/common/ProductThumb';
import { StockBadge } from '../components/StockBadge';
import { useProduct } from '../hooks/useProduct';
import { formatMoney } from '../utils/money';
import { getStockStatus } from '../utils/stockStatus';

const CURRENCY_SYMBOL = '₹';

interface ProductDetailScreenProps {
  productId?: string;
}

export function ProductDetailScreen({ productId }: ProductDetailScreenProps) {
  const { status, product, categoryName, archive } = useProduct(productId);
  const toast = useToast();
  // Internal name only — the confirm dialog's own title/message/button
  // copy stays "Delete" (unchanged, matches the web source); what actually
  // runs on confirm is an archive operation, not a physical delete.
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (status === 'loading') {
    return (
      <Screen title="Product" wide>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'not-found' || !product) {
    return (
      <Screen title="Product not found">
        <EmptyState
          icon={<PackageX size={28} color={colors.brand[600]} />}
          title="This product no longer exists"
          message="It may have been deleted from your catalogue."
          actionLabel="Back to products"
          onAction={() => router.push('/products')}
        />
      </Screen>
    );
  }

  const stockStatus = getStockStatus(product);
  const marginMinor = product.sellingPriceMinor - product.purchasePriceMinor;
  const stockValueMinor = product.currentStock * product.purchasePriceMinor;

  return (
    <Screen
      title={product.name}
      subtitle={`SKU ${product.sku}`}
      wide
      actions={
        <>
          <IconButton accessibilityLabel="Edit product" onPress={() => router.push(`/products/${product.id}/edit`)}>
            <Pencil size={18} color={colors.ink[700]} />
          </IconButton>
          <IconButton accessibilityLabel="Delete product" onPress={() => setConfirmArchive(true)}>
            <Trash2 size={18} color={colors.bad[500]} />
          </IconButton>
        </>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <ProductThumb product={product} size="xl" />
            <View style={styles.flex1}>
              <View style={styles.badgeRow}>
                <StockBadge product={product} />
                {categoryName && <Badge tone="neutral">{categoryName}</Badge>}
              </View>
              <AppText size={19} weight="extrabold" color={colors.ink.DEFAULT} style={styles.heroName}>
                {product.name}
              </AppText>
              <AppText size={13} color={colors.ink[500]} style={styles.heroMeta}>
                {product.brand ?? '—'} · Barcode {product.barcode || '—'}
              </AppText>
              <View style={styles.priceRow}>
                <AppText size={26} weight="extrabold" color={colors.ink.DEFAULT} tabular>
                  {formatMoney(product.sellingPriceMinor, CURRENCY_SYMBOL)}
                </AppText>
                <AppText size={13} weight="medium" color={colors.ink[400]}>
                  cost {formatMoney(product.purchasePriceMinor, CURRENCY_SYMBOL)} · margin {formatMoney(marginMinor, CURRENCY_SYMBOL)}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.statRow}>
            <Stat label="Current stock" value={`${product.currentStock}`} caption="units" tone={stockStatus} />
            <Stat label="Minimum stock" value={`${product.minimumStock}`} caption="units" />
            <Stat label="Stock value" value={formatMoney(stockValueMinor, CURRENCY_SYMBOL)} caption="at cost" />
          </View>
        </Card>

        {stockStatus !== 'in' && (
          <ErrorNotice
            tone={stockStatus === 'out' ? 'bad' : 'warn'}
            title={stockStatus === 'out' ? 'This product is out of stock' : 'Stock is below minimum'}
            message={
              stockStatus === 'out'
                ? 'You cannot sell this product until you receive more. Record a Stock In or raise a purchase with the supplier.'
                : `Only ${product.currentStock} units left against a minimum of ${product.minimumStock}. Reorder soon to avoid losing sales.`
            }
            action="Record Stock In"
            onAction={() => router.push(ROUTES.stockIn)}
          />
        )}

        <View style={styles.actionGrid}>
          <ActionTile icon={<ArrowDownToLine size={20} color={colors.white} />} label="Stock In" primary onPress={() => router.push(ROUTES.stockIn)} />
          <ActionTile icon={<ArrowUpFromLine size={20} color={colors.brand[600]} />} label="Stock Out" onPress={() => router.push(ROUTES.stockOut)} />
          <ActionTile icon={<Scale size={20} color={colors.brand[600]} />} label="Adjust" onPress={() => router.push('/more/stock/adjust')} />
          <ActionTile icon={<Pencil size={20} color={colors.brand[600]} />} label="Edit" onPress={() => router.push(`/products/${product.id}/edit`)} />
        </View>

        <View>
          <SectionHeader title="Product activity" action="All movements" onAction={() => router.push('/more/stock/movements')} />
          <Card style={styles.overflowHidden}>
            <EmptyState
              icon={<Scale size={28} color={colors.brand[600]} />}
              title="No movements yet"
              message="Sales, purchases and adjustments for this product will appear here."
            />
          </Card>
        </View>

        <Card style={styles.cardPad}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.detailsLabel}>
            Details
          </AppText>
          <View>
            <KeyValue label="SKU" value={product.sku} />
            <Divider />
            <KeyValue label="Barcode" value={product.barcode || '—'} />
            <Divider />
            <KeyValue label="Category" value={categoryName} />
            <Divider />
            <KeyValue label="Brand" value={product.brand || '—'} />
            <Divider />
            <KeyValue label="Location" value={product.location || '—'} />
            <Divider />
            <KeyValue label="Added on" value={new Date(product.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
          </View>
          {product.description && (
            <View style={styles.notesBox}>
              <AppText size={13} color={colors.ink.DEFAULT} style={styles.notesText}>
                {product.description}
              </AppText>
            </View>
          )}
        </Card>
      </View>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={`Delete ${product.name}?`}
        message="This removes the product from your catalogue. Past sales and movements stay in your history."
        confirmLabel="Delete product"
        detail={`SKU ${product.sku} · ${product.currentStock} units currently in stock`}
        onConfirm={() => {
          // UI wording stays "Delete" (matches the web source); the actual
          // operation is archiveProduct (isActive = false), never a
          // physical delete — see productsProvider.ts.
          archive().then(() => {
            toast('Product deleted.', 'info');
            router.push('/products');
          });
        }}
      />
    </Screen>
  );
}

function Stat({ label, value, caption, tone }: { label: string; value: string; caption: string; tone?: 'in' | 'low' | 'out' }) {
  const color = tone === 'out' ? colors.bad[600] : tone === 'low' ? colors.warn[600] : colors.ink.DEFAULT;
  return (
    <View>
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={20} weight="extrabold" color={color} tabular style={styles.statValue}>
        {value}
      </AppText>
      <AppText size={11.5} color={colors.ink[400]}>
        {caption}
      </AppText>
    </View>
  );
}

function ActionTile({ icon, label, onPress, primary }: { icon: React.ReactNode; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionTile, primary ? styles.actionTilePrimary : styles.actionTileDefault, pressed && (primary ? styles.actionTilePrimaryPressed : styles.actionTileDefaultPressed)]}
      accessibilityRole="button"
    >
      {icon}
      <AppText size={14} weight="semibold" color={primary ? colors.white : colors.ink.DEFAULT}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  heroCard: { padding: spacing[4] },
  heroRow: { flexDirection: 'row', gap: spacing[4] },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] },
  // web: text-[19px] leading-tight tracking-tight -> 19*1.25, -0.025em
  heroName: { marginTop: spacing[2], lineHeight: 23.75, letterSpacing: -0.475 },
  heroMeta: { marginTop: 2 },
  priceRow: { marginTop: spacing[3], flexDirection: 'row', alignItems: 'baseline', gap: spacing[3], flexWrap: 'wrap' },
  statRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingTop: spacing[4],
  },
  statValue: { marginTop: 2 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  actionTile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'flex-start',
    gap: spacing[2.5],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing[3.5],
  },
  actionTilePrimary: { borderColor: colors.brand[600], backgroundColor: colors.brand[600] },
  actionTilePrimaryPressed: { backgroundColor: colors.brand[700] },
  actionTileDefault: { borderColor: colors.ink[200], backgroundColor: colors.white, ...shadows.card },
  actionTileDefaultPressed: { backgroundColor: colors.ink[50] },
  overflowHidden: { overflow: 'hidden' },
  cardPad: { padding: spacing[4] },
  // web: text-[13px] uppercase tracking-wide -> +0.025em
  detailsLabel: { marginBottom: spacing[1], textTransform: 'uppercase', letterSpacing: 0.325 },
  notesBox: { marginTop: spacing[3], borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3] },
  // web: text-[13px] leading-relaxed -> 13*1.625
  notesText: { lineHeight: 21.13 },
});
