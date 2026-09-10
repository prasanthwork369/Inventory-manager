/**
 * Direct port of the web reference's src/pages/sales/ReceiptPage.tsx.
 * `business.*`/`receipt.*` now come from the real, persisted Settings
 * (Database Stage 5) instead of the old RECEIPT_BUSINESS/RECEIPT_FOOTER
 * placeholder constants — fetched locally in this screen (not via
 * useSale, which SaleDetailScreen also uses and doesn't need Settings
 * for) so the change stays contained to Receipt. `receipt.showLogo`/
 * `showTax` gate the logo and tax line exactly like the web. Share/
 * Download/Print are the web's own mocked actions (toast only) —
 * preserved as-is.
 */
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Download, Printer, ReceiptText, Share2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { getSettings } from '@/features/settings/data/settingsProvider';
import type { AppSettings } from '@/features/settings/types';
import { useSale } from '../hooks/useSale';
import { dateTimeLabel } from '../utils/format';
import { formatMoneyPrecise } from '../utils/money';

export function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { status, sale, refetch } = useSale(id);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading' || !settings) {
    return (
      <Screen title="Receipt">
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title="Receipt">
        <ErrorNotice title="Couldn't load receipt" message="Something went wrong loading this receipt. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!sale) {
    return (
      <Screen title="Receipt">
        <EmptyState
          icon={<ReceiptText size={28} color={colors.brand[600]} />}
          title="Receipt unavailable"
          message="We could not find the sale for this receipt."
          actionLabel="Back to sales"
          onAction={() => router.push('/sales')}
        />
      </Screen>
    );
  }

  const changeMinor = Math.max(sale.amountReceivedMinor - sale.totalMinor, 0);
  const { business, receipt, tax } = settings;
  const currencySymbol = business.currencySymbol;

  return (
    <Screen
      title="Receipt"
      subtitle={sale.receiptNo}
      footer={
        <View style={styles.footerRow}>
          <View style={styles.flex1}>
            <Button variant="secondary" block icon={<Share2 size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Receipt shared.', 'info')}>
              Share
            </Button>
          </View>
          <View style={styles.flex1}>
            <Button variant="secondary" block icon={<Download size={16} color={colors.ink.DEFAULT} />} onPress={() => toast('Receipt saved as PDF on this device.', 'info')}>
              Download
            </Button>
          </View>
          <View style={styles.flex1}>
            <Button block icon={<Printer size={16} color={colors.white} />} onPress={() => toast('Sent to printer.', 'info')}>
              Print
            </Button>
          </View>
        </View>
      }
    >
      <View style={styles.wrap}>
        <View style={styles.receipt}>
          <View style={styles.centered}>
            {receipt.showLogo && (
              <View style={styles.logo}>
                <AppText size={17} weight="extrabold" color={colors.white}>
                  {business.name.slice(0, 1)}
                </AppText>
              </View>
            )}
            <AppText size={17} weight="extrabold" color={colors.ink.DEFAULT} style={styles.businessName}>
              {business.name}
            </AppText>
            <AppText size={12} color={colors.ink[500]} style={styles.businessLine}>
              {business.address}
            </AppText>
            <AppText size={12} color={colors.ink[500]}>
              {business.phone}
            </AppText>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.metaStack}>
            <ReceiptLine label="Receipt" value={sale.receiptNo} bold />
            <ReceiptLine label="Date" value={dateTimeLabel(sale.createdAt)} bold />
            <ReceiptLine label="Customer" value={sale.customerName} bold />
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.tableHeader}>
            <AppText size={12.5} weight="semibold" color={colors.ink[400]} style={styles.colItem}>
              Item
            </AppText>
            <AppText size={12.5} weight="semibold" color={colors.ink[400]} style={styles.colQty}>
              Qty
            </AppText>
            <AppText size={12.5} weight="semibold" color={colors.ink[400]} style={styles.colAmount}>
              Amount
            </AppText>
          </View>
          {sale.items.map((it) => (
            <View key={it.productId} style={styles.tableRow}>
              <View style={styles.colItem}>
                <AppText size={12.5} weight="medium" color={colors.ink.DEFAULT}>
                  {it.productName}
                </AppText>
                <AppText size={11.5} color={colors.ink[400]} tabular>
                  {formatMoneyPrecise(it.unitPriceMinor, currencySymbol)} each
                </AppText>
              </View>
              <AppText size={12.5} weight="semibold" tabular color={colors.ink[700]} style={styles.colQty}>
                {it.quantity}
              </AppText>
              <AppText size={12.5} weight="semibold" tabular color={colors.ink.DEFAULT} style={styles.colAmount}>
                {formatMoneyPrecise(it.quantity * it.unitPriceMinor - it.discountMinor, currencySymbol)}
              </AppText>
            </View>
          ))}

          <View style={styles.dashedDivider} />

          <View style={styles.totalsStack}>
            <ReceiptLine label="Subtotal" value={formatMoneyPrecise(sale.subtotalMinor, currencySymbol)} />
            {sale.discountMinor > 0 && <ReceiptLine label="Discount" value={`− ${formatMoneyPrecise(sale.discountMinor, currencySymbol)}`} />}
            {tax.enabled && receipt.showTax && <ReceiptLine label={`Tax (${tax.ratePercent}%)`} value={formatMoneyPrecise(sale.taxMinor, currencySymbol)} />}
            <View style={styles.totalRow}>
              <AppText size={14} weight="bold" color={colors.ink.DEFAULT}>
                Total
              </AppText>
              <AppText size={17} weight="extrabold" tabular color={colors.ink.DEFAULT}>
                {formatMoney(sale.totalMinor, currencySymbol)}
              </AppText>
            </View>
            <ReceiptLine label={`Paid (${sale.paymentMethod})`} value={formatMoneyPrecise(sale.amountReceivedMinor, currencySymbol)} />
            <ReceiptLine label="Change" value={formatMoneyPrecise(changeMinor, currencySymbol)} />
          </View>

          <View style={styles.dashedDivider} />

          <AppText size={11.5} color={colors.ink[500]} style={styles.footerText}>
            {receipt.footer}
          </AppText>
          <AppText size={10.5} weight="semibold" color={colors.ink.DEFAULT} style={styles.poweredBy}>
            Powered by Code Neptune
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

function ReceiptLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.lineRow}>
      <AppText size={12.5} color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={12.5} weight="semibold" tabular color={bold ? colors.ink.DEFAULT : colors.ink[700]}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  receipt: {
    width: '100%',
    maxWidth: 384,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[6],
    ...shadows.card,
  },
  centered: { alignItems: 'center' },
  logo: {
    height: spacing[11],
    width: spacing[11],
    borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  businessName: { letterSpacing: -0.425 },
  businessLine: { marginTop: spacing[1], lineHeight: 19.5, textAlign: 'center' },
  dashedDivider: { marginVertical: spacing[4], borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.ink[200] },
  metaStack: { gap: spacing[1] },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tableHeader: { flexDirection: 'row', paddingBottom: spacing[2] },
  tableRow: { flexDirection: 'row', paddingVertical: spacing[1.5] },
  colItem: { flex: 1, paddingRight: spacing[2] },
  colQty: { width: 32, textAlign: 'center' },
  colAmount: { width: 76, textAlign: 'right' },
  totalsStack: { gap: spacing[1.5] },
  totalRow: { marginTop: spacing[2], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.ink[200], paddingTop: spacing[2] },
  footerText: { textAlign: 'center', lineHeight: 18.7 },
  // web: text-ink-300 resolves to ink.DEFAULT, not a muted gray — see
  // theme/colors.ts's header comment. No opacity dimming.
  poweredBy: { marginTop: spacing[3], textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.325 },
  footerRow: { flexDirection: 'row', gap: spacing[2.5] },
  flex1: { flex: 1 },
});
