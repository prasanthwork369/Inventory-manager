/**
 * Direct port of the web reference's src/pages/parties/PartyList.tsx
 * (kind="customer"). See suppliers/screens/SuppliersListScreen.tsx's
 * header — the same `lg:grid-cols-2` mobile-single-column note and
 * always-zero row stats reasoning apply here (Sales isn't built yet).
 */
import React from 'react';
import { router } from 'expo-router';
import { Plus, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { AppSheet } from '@/components/ui/AppSheet';
import { Field, Input, SearchInput, Textarea } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { EmptyState, ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { useCustomers } from '../hooks/useCustomers';
import type { Customer } from '../types';

const CURRENCY_SYMBOL = '₹';

export function CustomersListScreen() {
  const toast = useToast();
  const {
    status,
    customers,
    refetch,
    query,
    setQuery,
    filteredCustomers,
    editingDraft,
    formError,
    saving,
    openCreate,
    closeEditor,
    updateDraftField,
    save,
  } = useCustomers();

  const handleSave = async () => {
    const succeeded = await save();
    if (succeeded) toast('Customer saved.');
  };

  return (
    <Screen
      title="Customers"
      subtitle={status === 'ready' ? `${customers.length} saved` : undefined}
      wide
      actions={
        <Button size="sm" icon={<Plus size={16} color={colors.white} />} onPress={openCreate}>
          Add
        </Button>
      }
    >
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search customers..." style={styles.search} />

      {status === 'loading' && <ListSkeleton rows={5} />}

      {status === 'error' && (
        <ErrorNotice title="Couldn't load customers" message="Something went wrong loading your customers. Try again." action="Retry" onAction={refetch} />
      )}

      {status === 'ready' && filteredCustomers.length === 0 && (
        <EmptyState
          icon={<Users size={28} color={colors.brand[600]} />}
          title={query ? 'No matches' : 'No customers yet'}
          message={
            query
              ? `Nothing found for "${query}".`
              : 'Add regular customers to track what they buy and what they owe.'
          }
          actionLabel="Add customer"
          onAction={openCreate}
        />
      )}

      {status === 'ready' && filteredCustomers.length > 0 && (
        <View style={styles.list}>
          {filteredCustomers.map((c) => (
            <CustomerRow key={c.id} customer={c} onPress={() => router.push(`/more/customers/${c.id}`)} />
          ))}
        </View>
      )}

      <AppSheet
        open={!!editingDraft}
        onClose={closeEditor}
        title="Add customer"
        footer={
          <Button block size="lg" loading={saving} onPress={handleSave}>
            Save Customer
          </Button>
        }
      >
        {editingDraft && (
          <View style={styles.formStack}>
            <Field label="Name" required error={formError}>
              <Input
                value={editingDraft.name}
                onChangeText={(v) => updateDraftField('name', v)}
                placeholder="Full name or business name"
                invalid={!!formError}
              />
            </Field>
            <Field label="Phone">
              <Input value={editingDraft.phone} onChangeText={(v) => updateDraftField('phone', v)} placeholder="+91 98765 43210" keyboardType="phone-pad" />
            </Field>
            <Field label="Email">
              <Input value={editingDraft.email} onChangeText={(v) => updateDraftField('email', v)} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label="Address">
              <Textarea value={editingDraft.address} onChangeText={(v) => updateDraftField('address', v)} placeholder="Street, city" />
            </Field>
            <Field label="Notes" hint="Optional">
              <Textarea value={editingDraft.notes} onChangeText={(v) => updateDraftField('notes', v)} placeholder="Delivery days, credit terms, preferences" />
            </Field>
          </View>
        )}
      </AppSheet>
    </Screen>
  );
}

interface CustomerRowProps {
  customer: Customer;
  onPress: () => void;
}

function CustomerRow({ customer, onPress }: CustomerRowProps) {
  // Sales isn't built yet — see file header. outstandingMinor mirrors
  // CustomerDetailSummary's shape (a derived aggregate, not a Customer
  // field) — always 0 until a credit-ledger feature exists to compute it.
  const stats = { primary: '0 purchases', value: formatMoney(0, CURRENCY_SYMBOL), caption: 'total spent', outstandingMinor: 0 };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.avatar}>
        <AppText size={14} weight="bold" color={colors.brand[700]}>
          {customer.name.slice(0, 2).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.flex1}>
        <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} numberOfLines={1}>
          {customer.name}
        </AppText>
        <AppText size={12.5} color={colors.ink[400]} numberOfLines={1}>
          {customer.phone || 'No phone'} · {stats.primary}
        </AppText>
        {stats.outstandingMinor > 0 && (
          <AppText size={12.5} weight="bold" tabular color={colors.bad[600]} style={styles.outstanding}>
            {formatMoney(stats.outstandingMinor, CURRENCY_SYMBOL)} outstanding
          </AppText>
        )}
      </View>
      <View style={styles.trailing}>
        <AppText size={15} weight="bold" tabular color={colors.ink.DEFAULT}>
          {stats.value}
        </AppText>
        <AppText size={11.5} color={colors.ink[400]}>
          {stats.caption}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing[4] },
  list: { gap: spacing[2.5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[3.5],
    ...shadows.card,
  },
  rowPressed: { backgroundColor: withOpacity(colors.brand[50], 40), borderColor: colors.brand[200] },
  avatar: { height: spacing[11], width: spacing[11], borderRadius: radius.xl, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  flex1: { flex: 1, minWidth: 0 },
  outstanding: { marginTop: spacing[1] },
  trailing: { alignItems: 'flex-end', flexShrink: 0 },
  formStack: { gap: spacing[4] },
});
