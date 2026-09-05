/**
 * Direct port of the web reference's ReceiptSettings (SettingsPages.tsx).
 * Presentation-only, as the phase brief requires — this doesn't touch
 * Sales' own Sale/SaleItem records or ReceiptScreen; wiring
 * ReceiptScreen to read these values is a documented future step (see
 * the final report), not part of this phase.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider } from '@/components/ui/Card';
import { Field, Input, Textarea, Toggle } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { SettingRow } from '../components/SettingRow';
import { useReceiptSettings } from '../hooks/useReceiptSettings';

export function ReceiptSettingsScreen() {
  const toast = useToast();
  const { status, form, updateField, businessName, saving, save } = useReceiptSettings();

  const handleSave = async () => {
    await save();
    toast('Receipt settings saved.');
  };

  if (status === 'loading' || !form) {
    return (
      <Screen title="Receipt settings" subtitle="What customers see on their receipt">
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Receipt settings"
      subtitle="What customers see on their receipt"
      footer={
        <Button size="lg" block loading={saving} onPress={handleSave}>
          Save changes
        </Button>
      }
    >
      <View style={styles.stack}>
        <Card style={styles.overflowHidden}>
          <SettingRow title="Show business logo" caption="Print your logo at the top of every receipt.">
            <Toggle checked={form.showLogo} onChange={(v) => updateField('showLogo', v)} label="Show logo" />
          </SettingRow>
          <Divider />
          <SettingRow title="Show tax breakdown" caption="List the tax amount separately on the receipt.">
            <Toggle checked={form.showTax} onChange={(v) => updateField('showTax', v)} label="Show tax" />
          </SettingRow>
        </Card>

        <Card style={styles.card}>
          <View style={styles.fieldPair}>
            <View style={styles.flex1}>
              <Field label="Receipt prefix">
                <Input value={form.prefix} onChangeText={(v) => updateField('prefix', v.toUpperCase())} autoCapitalize="characters" />
              </Field>
            </View>
            <View style={styles.flex1}>
              <Field label="Next receipt number">
                <Input keyboardType="number-pad" value={String(form.nextNumber)} onChangeText={(v) => updateField('nextNumber', Number(v) || 0)} />
              </Field>
            </View>
          </View>
          <Field label="Footer message" hint="Printed at the bottom of every receipt.">
            <Textarea value={form.footer} onChangeText={(v) => updateField('footer', v)} />
          </Field>
        </Card>

        <Card style={styles.card}>
          <AppText size={13} weight="bold" color={colors.ink[400]} style={styles.heading}>
            PREVIEW
          </AppText>
          <View style={styles.previewBox}>
            <AppText size={14} weight="bold" color={colors.ink.DEFAULT} style={styles.previewCenter}>
              {businessName}
            </AppText>
            <AppText size={12} color={colors.ink[500]} style={styles.previewCenter}>
              {form.prefix}-{String(form.nextNumber).padStart(6, '0')}
            </AppText>
            <AppText size={11.5} color={colors.ink[500]} style={[styles.previewCenter, styles.previewFooter]}>
              {form.footer}
            </AppText>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  overflowHidden: { overflow: 'hidden' },
  card: { padding: spacing[4], gap: spacing[4] },
  fieldPair: { flexDirection: 'row', gap: spacing[4] },
  flex1: { flex: 1 },
  heading: { marginBottom: spacing[2], letterSpacing: 0.325 },
  previewBox: { borderRadius: radius.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.ink[200], padding: spacing[4] },
  previewCenter: { textAlign: 'center' },
  previewFooter: { marginTop: spacing[3], lineHeight: 17.25 },
});
