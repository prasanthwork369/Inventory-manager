/**
 * Direct port of the web reference's InventorySettings (SettingsPages.tsx).
 * Configures defaults only — Stock's own lowStock()/outOfStock() rules
 * (already used by Products/Stock/Reports/Alerts) are untouched; wiring
 * this screen's values into them is a future integration, not this
 * phase's job (see the final report).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select, Toggle } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { SettingRow } from '../components/SettingRow';
import { useInventorySettings } from '../hooks/useInventorySettings';

const VALUATION_OPTIONS = [
  { value: 'cost', label: 'Cost price (recommended)' },
  { value: 'selling', label: 'Selling price' },
] as const;

export function InventorySettingsScreen() {
  const toast = useToast();
  const { status, form, updateField, saving, save } = useInventorySettings();

  const handleSave = async () => {
    await save();
    toast('Inventory settings saved.');
  };

  if (status === 'loading' || !form) {
    return (
      <Screen title="Inventory settings" subtitle="How stock behaves across the app">
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Inventory settings"
      subtitle="How stock behaves across the app"
      footer={
        <Button size="lg" block loading={saving} onPress={handleSave}>
          Save changes
        </Button>
      }
    >
      <View style={styles.stack}>
        <Card>
          <SettingRow title="Allow negative stock" caption="Let sales go through even when stock has run out. Off is safer for most shops.">
            <Toggle checked={form.allowNegativeStock} onChange={(v) => updateField('allowNegativeStock', v)} label="Allow negative stock" />
          </SettingRow>
        </Card>

        <Card style={styles.card}>
          <Field label="Default low-stock threshold" hint="Used for new products. You can set a different minimum per product.">
            <Input keyboardType="number-pad" value={String(form.lowStockThreshold)} onChangeText={(v) => updateField('lowStockThreshold', Number(v) || 0)} />
          </Field>
          <Field label="Stock valuation" hint="How stock value is calculated in reports.">
            <Select value={form.valuation} onChange={(v) => updateField('valuation', v)} options={[...VALUATION_OPTIONS]} sheetTitle="Stock valuation" />
          </Field>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  card: { padding: spacing[4], gap: spacing[4] },
});
