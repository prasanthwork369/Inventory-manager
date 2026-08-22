/**
 * Direct port of the web reference's src/pages/parties/PartyDetail.tsx
 * (kind="supplier"). `lg:grid-cols-3` is desktop-only; the web renders a
 * single column at mobile width (main column, then the contact card), so
 * this is that same DOM order, not a redesign.
 *
 * Two sections are intentionally not ported:
 *  - "Products supplied": Product has no supplierId in this project's
 *    schema (a deliberate decision from the Products phase — suppliers
 *    are meant to link through Purchases, not a direct product FK — see
 *    products/types.ts). There is nothing to list.
 *  - Purchase history/metrics: Purchases isn't built yet, so `history`
 *    is a fixed empty array — this always renders the web's own
 *    "Nothing recorded yet" empty state, a real state the source already
 *    defines, not a fake substitute. The structure is kept exactly as
 *    the web has it so wiring in a real Purchases provider later needs
 *    no screen rewrite.
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, MapPin, Phone, Trash2, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { IconButton, Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue, SectionHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/AppSheet';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { useSupplier } from '../hooks/useSupplier';
import type { SupplierDetailSummary } from '../types';

const CURRENCY_SYMBOL = '₹';
const PURCHASE_HISTORY: [] = [];
const ZERO_SUMMARY: SupplierDetailSummary = { purchaseCount: 0, purchaseValueMinor: 0, outstandingMinor: 0 };

export function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { status, supplier, summary, refetch, confirmOpen, setConfirmOpen, confirmArchive } = useSupplier(id);
  const s = summary ?? ZERO_SUMMARY;

  if (status === 'loading') {
    return (
      <Screen title="Suppliers" wide>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title="Suppliers" wide>
        <ErrorNotice title="Couldn't load supplier" message="Something went wrong loading this supplier. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!supplier) {
    return (
      <Screen title="Not found">
        <EmptyState
          icon={<Users size={28} color={colors.brand[600]} />}
          title="Contact not found"
          message="This contact is no longer saved on this device."
          actionLabel="Go back"
          onAction={() => router.push('/more/suppliers')}
        />
      </Screen>
    );
  }

  const handleConfirmArchive = () => {
    confirmArchive().then(() => {
      toast('Contact deleted.', 'info');
      router.push('/more/suppliers');
    });
  };

  return (
    <Screen
      title={supplier.name}
      subtitle="Supplier"
      wide
      actions={
        <IconButton accessibilityLabel="Delete contact" onPress={() => setConfirmOpen(true)}>
          <Trash2 size={18} color={colors.bad[500]} />
        </IconButton>
      }
      footer={
        <Button size="lg" block onPress={() => router.push('/purchases/new')}>
          New purchase
        </Button>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatar}>
              <AppText size={18} weight="bold" color={colors.brand[700]}>
                {supplier.name.slice(0, 2).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.flex1}>
              <AppText size={19} weight="extrabold" color={colors.ink.DEFAULT} numberOfLines={1} style={styles.heroName}>
                {supplier.name}
              </AppText>
              <AppText size={13} color={colors.ink[500]}>
                {supplier.phone || 'No phone saved'}
              </AppText>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <Metric label="Purchases" value={`${s.purchaseCount}`} />
            <Metric label="Purchase value" value={formatMoney(s.purchaseValueMinor, CURRENCY_SYMBOL)} />
            <Metric label="Outstanding" value={formatMoney(s.outstandingMinor, CURRENCY_SYMBOL)} tone={s.outstandingMinor > 0 ? 'bad' : undefined} />
          </View>
        </Card>

        <View>
          <SectionHeader title="Purchase history" />
          <Card style={styles.overflowHidden}>
            {PURCHASE_HISTORY.length === 0 && (
              <EmptyState
                icon={<Users size={28} color={colors.brand[600]} />}
                title="Nothing recorded yet"
                message="Purchases from this supplier will appear here."
                style={styles.emptyHistory}
              />
            )}
          </Card>
        </View>

        <Card style={styles.contactCard}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.contactHeading}>
            CONTACT
          </AppText>
          <View style={styles.contactLines}>
            <ContactLine icon={<Phone size={16} color={colors.ink[400]} />} value={supplier.phone || '—'} />
            <ContactLine icon={<Mail size={16} color={colors.ink[400]} />} value={supplier.email || '—'} />
            <ContactLine icon={<MapPin size={16} color={colors.ink[400]} />} value={supplier.address || '—'} />
          </View>
          <Divider style={styles.contactDivider} />
          <KeyValue label="Outstanding balance" value={formatMoney(s.outstandingMinor, CURRENCY_SYMBOL)} strong />
          {supplier.notes ? (
            <View style={styles.notesBox}>
              <AppText size={13} color={colors.ink.DEFAULT} style={styles.notesText}>
                {supplier.notes}
              </AppText>
            </View>
          ) : null}
        </Card>
      </View>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Delete ${supplier.name}?`}
        message="Past transactions stay in your history, but this contact will be removed."
        confirmLabel="Delete contact"
        onConfirm={handleConfirmArchive}
      />
    </Screen>
  );
}

function ContactLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.contactLine}>
      <View style={styles.contactIcon}>{icon}</View>
      <AppText size={13.5} color={colors.ink[700]} style={styles.flex1}>
        {value}
      </AppText>
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <View style={styles.flex1}>
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={17} weight="extrabold" tabular color={tone === 'bad' ? colors.bad[600] : colors.ink.DEFAULT} style={styles.metricValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1, minWidth: 0 },
  overflowHidden: { overflow: 'hidden' },
  heroCard: { padding: spacing[5] },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  heroAvatar: { height: spacing[14], width: spacing[14], borderRadius: radius['2xl'], backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  heroName: { letterSpacing: -0.475 },
  metricsRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingTop: spacing[4],
  },
  metricValue: { marginTop: 2 },
  emptyHistory: { paddingVertical: spacing[10] },
  contactCard: { padding: spacing[4] },
  contactHeading: { marginBottom: spacing[1], letterSpacing: 0.325 },
  contactLines: { paddingVertical: spacing[1], gap: spacing[2.5] },
  contactLine: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5] },
  contactIcon: { marginTop: 2 },
  contactDivider: { marginVertical: spacing[3] },
  notesBox: { marginTop: spacing[3], borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3] },
  notesText: { lineHeight: 21.13 },
});
