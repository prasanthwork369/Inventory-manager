/**
 * Direct port of the web reference's src/pages/parties/PartyDetail.tsx
 * (kind="customer"). `lg:grid-cols-3` is desktop-only; the web renders a
 * single column at mobile width, so this is that same DOM order.
 *
 * Sales history/spend isn't ported with real data — Sales isn't built
 * yet, so `history` is a fixed empty array — this always renders the
 * web's own "Nothing recorded yet" empty state, a real state the source
 * already defines, not a fake substitute. The structure is kept exactly
 * as the web has it so wiring in a real Sales provider later needs no
 * screen rewrite. Unlike Suppliers, the web never shows a "products"
 * section for customers, so there's nothing extra omitted here.
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
import { useCustomer } from '../hooks/useCustomer';
import type { CustomerDetailSummary } from '../types';

const CURRENCY_SYMBOL = '₹';
const SALES_HISTORY: [] = [];
const ZERO_SUMMARY: CustomerDetailSummary = { salesCount: 0, totalSpentMinor: 0, outstandingMinor: 0 };

export function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { status, customer, summary, refetch, confirmOpen, setConfirmOpen, confirmArchive } = useCustomer(id);
  const s = summary ?? ZERO_SUMMARY;

  if (status === 'loading') {
    return (
      <Screen title="Customers" wide>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen title="Customers" wide>
        <ErrorNotice title="Couldn't load customer" message="Something went wrong loading this customer. Try again." action="Retry" onAction={refetch} />
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen title="Not found">
        <EmptyState
          icon={<Users size={28} color={colors.brand[600]} />}
          title="Contact not found"
          message="This contact is no longer saved on this device."
          actionLabel="Go back"
          onAction={() => router.push('/more/customers')}
        />
      </Screen>
    );
  }

  const handleConfirmArchive = () => {
    confirmArchive().then(() => {
      toast('Contact deleted.', 'info');
      router.push('/more/customers');
    });
  };

  return (
    <Screen
      title={customer.name}
      subtitle="Customer"
      wide
      actions={
        <IconButton accessibilityLabel="Delete contact" onPress={() => setConfirmOpen(true)}>
          <Trash2 size={18} color={colors.bad[500]} />
        </IconButton>
      }
      footer={
        <Button size="lg" block onPress={() => router.push('/sales/new')}>
          New sale
        </Button>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatar}>
              <AppText size={18} weight="bold" color={colors.brand[700]}>
                {customer.name.slice(0, 2).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.flex1}>
              <AppText size={19} weight="extrabold" color={colors.ink.DEFAULT} numberOfLines={1} style={styles.heroName}>
                {customer.name}
              </AppText>
              <AppText size={13} color={colors.ink[500]}>
                {customer.phone || 'No phone saved'}
              </AppText>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <Metric label="Purchases" value={`${s.salesCount}`} />
            <Metric label="Total spent" value={formatMoney(s.totalSpentMinor, CURRENCY_SYMBOL)} />
            <Metric label="Outstanding" value={formatMoney(s.outstandingMinor, CURRENCY_SYMBOL)} tone={s.outstandingMinor > 0 ? 'bad' : undefined} />
          </View>
        </Card>

        <View>
          <SectionHeader title="Purchase history" />
          <Card style={styles.overflowHidden}>
            {SALES_HISTORY.length === 0 && (
              <EmptyState
                icon={<Users size={28} color={colors.brand[600]} />}
                title="Nothing recorded yet"
                message="Sales to this customer will appear here."
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
            <ContactLine icon={<Phone size={16} color={colors.ink[400]} />} value={customer.phone || '—'} />
            <ContactLine icon={<Mail size={16} color={colors.ink[400]} />} value={customer.email || '—'} />
            <ContactLine icon={<MapPin size={16} color={colors.ink[400]} />} value={customer.address || '—'} />
          </View>
          <Divider style={styles.contactDivider} />
          <KeyValue label="Outstanding balance" value={formatMoney(s.outstandingMinor, CURRENCY_SYMBOL)} strong />
          {customer.notes ? (
            <View style={styles.notesBox}>
              <AppText size={13} color={colors.ink.DEFAULT} style={styles.notesText}>
                {customer.notes}
              </AppText>
            </View>
          ) : null}
        </Card>
      </View>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Delete ${customer.name}?`}
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
