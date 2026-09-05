/**
 * Direct port of the web reference's BusinessSettings (SettingsPages.tsx).
 * Country stays a free-text Input, not a Select from a fixed list — that
 * matches the web exactly, even though Onboarding's own business step
 * uses a picker for the same concept; the two screens genuinely differ
 * in the source, so this isn't a redesign.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { BUSINESS_TYPES, CURRENCIES } from '../constants';
import { useBusinessSettings } from '../hooks/useBusinessSettings';

export function BusinessSettingsScreen() {
  const toast = useToast();
  const { status, form, updateField, updateCurrency, error, saving, save } = useBusinessSettings();

  const handleSave = async () => {
    const succeeded = await save();
    if (succeeded) toast('Business profile saved.');
  };

  if (status === 'loading' || !form) {
    return (
      <Screen title="Business profile" subtitle="Shown on receipts and reports">
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Business profile"
      subtitle="Shown on receipts and reports"
      footer={
        <Button size="lg" block loading={saving} onPress={handleSave}>
          Save changes
        </Button>
      }
    >
      <View style={styles.stack}>
        {error ? <ErrorNotice title="Check your details" message={error} /> : null}
        <Card style={styles.card}>
          <Field label="Business name" required error={error || undefined}>
            <Input value={form.name} onChangeText={(v) => updateField('name', v)} invalid={!!error} />
          </Field>
          <Field label="Business type">
            <Select value={form.type} onChange={(v) => updateField('type', v)} options={BUSINESS_TYPES.map((t) => ({ value: t, label: t }))} sheetTitle="Business type" />
          </Field>
          <View style={styles.fieldPair}>
            <View style={styles.flex1}>
              <Field label="Phone">
                <Input value={form.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />
              </Field>
            </View>
            <View style={styles.flex1}>
              <Field label="Email">
                <Input value={form.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
              </Field>
            </View>
          </View>
          <Field label="Address">
            <Textarea value={form.address} onChangeText={(v) => updateField('address', v)} />
          </Field>
          <View style={styles.fieldPair}>
            <View style={styles.flex1}>
              <Field label="Currency" hint={`Prices show as ${form.currencySymbol}1,000`}>
                <Select value={form.currency} onChange={updateCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} sheetTitle="Currency" />
              </Field>
            </View>
            <View style={styles.flex1}>
              <Field label="Country">
                <Input value={form.country} onChangeText={(v) => updateField('country', v)} />
              </Field>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1 },
  card: { padding: spacing[4], gap: spacing[4] },
  fieldPair: { flexDirection: 'row', gap: spacing[4] },
});
