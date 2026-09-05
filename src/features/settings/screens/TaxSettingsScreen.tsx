/**
 * Direct port of the web reference's TaxSettings (SettingsPages.tsx).
 * Only configures tax defaults — Sales' own calculation logic
 * (calculateSaleTotals) is untouched by this phase.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider, KeyValue } from '@/components/ui/Card';
import { Field, Input, Toggle } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/features/products/utils/money';
import { SettingRow } from '../components/SettingRow';
import { useTaxSettings } from '../hooks/useTaxSettings';

export function TaxSettingsScreen() {
  const toast = useToast();
  const { status, form, updateField, currencySymbol, preview, saving, save } = useTaxSettings();

  const handleSave = async () => {
    await save();
    toast('Tax settings saved.');
  };

  if (status === 'loading' || !form || !preview) {
    return (
      <Screen title="Tax settings" subtitle="How tax is applied to your sales">
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Tax settings"
      subtitle="How tax is applied to your sales"
      footer={
        <Button size="lg" block loading={saving} onPress={handleSave}>
          Save changes
        </Button>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.overflowHidden}>
          <SettingRow title="Charge tax" caption="Turn off if your business does not collect tax.">
            <Toggle checked={form.enabled} onChange={(v) => updateField('enabled', v)} label="Charge tax" />
          </SettingRow>
          <Divider />
          <SettingRow title="Tax-inclusive pricing" caption="Product prices already include tax.">
            <Toggle checked={form.inclusive} onChange={(v) => updateField('inclusive', v)} label="Tax inclusive pricing" />
          </SettingRow>
          <Divider />
          <SettingRow title="Apply to purchases" caption="Add tax when recording purchases from suppliers.">
            <Toggle checked={form.applyToPurchases} onChange={(v) => updateField('applyToPurchases', v)} label="Apply tax to purchases" />
          </SettingRow>
        </Card>

        <Card style={styles.card}>
          <Field label="Tax percentage" hint="Common rates: 5%, 12%, 18%">
            <Input
              keyboardType="numeric"
              value={String(form.ratePercent)}
              onChangeText={(v) => updateField('ratePercent', Number(v) || 0)}
              editable={form.enabled}
            />
          </Field>
        </Card>

        <Card style={styles.card}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.heading}>
            PREVIEW
          </AppText>
          <View>
            <KeyValue label="Item price" value={formatMoney(100000, currencySymbol)} />
            <KeyValue label={`Tax (${form.ratePercent}%)`} value={form.enabled ? formatMoney(preview.taxMinor, currencySymbol) : 'No tax'} />
            <Divider />
            <KeyValue label="Customer pays" value={formatMoney(preview.customerPaysMinor, currencySymbol)} strong />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  overflowHidden: { overflow: 'hidden' },
  card: { padding: spacing[4] },
  heading: { marginBottom: spacing[1], letterSpacing: 0.325 },
});
