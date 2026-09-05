/**
 * Direct port of the web reference's SecuritySettings (SettingsPages.tsx).
 * Configuration only — no lock screen exists anywhere in this app yet,
 * so nothing here enforces the PIN/biometric choice; see
 * hooks/useSecuritySettings.ts for why the PIN itself is never persisted.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select, Toggle } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ErrorNotice, ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { LOCK_TIMEOUT_OPTIONS } from '../constants';
import { SettingRow } from '../components/SettingRow';
import { useSecuritySettings } from '../hooks/useSecuritySettings';

const LOCK_MODE_OPTIONS = [
  { value: 'none', label: 'No lock' },
  { value: 'pin', label: '4-digit PIN' },
  { value: 'biometric', label: 'Biometric (fingerprint / face)' },
] as const;

export function SecuritySettingsScreen() {
  const toast = useToast();
  const { status, form, setMode, setAutoLock, setTimeoutMinutes, pinInput, updatePinInput, error, saving, save } = useSecuritySettings();

  const handleSave = async () => {
    const succeeded = await save();
    if (succeeded) toast('Security settings saved.');
  };

  if (status === 'loading' || !form) {
    return (
      <Screen title="Security" subtitle="Protect your business data on this device">
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Security"
      subtitle="Protect your business data on this device"
      footer={
        <Button size="lg" block loading={saving} onPress={handleSave}>
          Save changes
        </Button>
      }
    >
      <View style={styles.stack}>
        {error ? <ErrorNotice title="PIN required" message={error} /> : null}
        <Card style={styles.card}>
          <Field label="App lock">
            <Select value={form.mode} onChange={setMode} options={[...LOCK_MODE_OPTIONS]} sheetTitle="App lock" />
          </Field>
          {form.mode === 'pin' && (
            <Field label="PIN" hint="4 digits" error={error || undefined}>
              <Input value={pinInput} onChangeText={updatePinInput} keyboardType="numeric" placeholder="••••" invalid={!!error} style={styles.pinInput} />
            </Field>
          )}
        </Card>

        <Card>
          <SettingRow title="Auto-lock" caption="Lock the app when it stays unused.">
            <Toggle checked={form.autoLock} onChange={setAutoLock} label="Auto lock" />
          </SettingRow>
        </Card>

        <Card style={styles.card}>
          <Field label="Lock after" hint="Minutes of inactivity before the app locks.">
            <Select
              value={String(form.timeoutMinutes)}
              onChange={(v) => setTimeoutMinutes(Number(v))}
              options={LOCK_TIMEOUT_OPTIONS.map((m) => ({ value: String(m), label: `${m} minutes` }))}
              sheetTitle="Lock after"
              disabled={!form.autoLock}
            />
          </Field>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  card: { padding: spacing[4], gap: spacing[4] },
  pinInput: { letterSpacing: 8 },
});
