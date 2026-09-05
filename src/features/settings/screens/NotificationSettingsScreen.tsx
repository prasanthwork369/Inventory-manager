/**
 * Direct port of the web reference's NotificationSettings
 * (SettingsPages.tsx). Preferences only — no push/local-notification
 * scheduling is implemented, matching the web (it has none either).
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card, Divider } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Fields';
import { Screen } from '@/components/layout/Screen';
import { ListSkeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { SettingRow } from '../components/SettingRow';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

export function NotificationSettingsScreen() {
  const toast = useToast();
  const { status, form, updateField, saving, save } = useNotificationSettings();

  const handleSave = async () => {
    await save();
    toast('Notification settings saved.');
  };

  if (status === 'loading' || !form) {
    return (
      <Screen title="Notifications" subtitle="All alerts are generated on this device">
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Notifications"
      subtitle="All alerts are generated on this device"
      footer={
        <Button size="lg" block loading={saving} onPress={handleSave}>
          Save changes
        </Button>
      }
    >
      <Card style={styles.overflowHidden}>
        <SettingRow title="Low stock alerts" caption="Tell me when a product drops to its minimum stock.">
          <Toggle checked={form.lowStockAlerts} onChange={(v) => updateField('lowStockAlerts', v)} label="Low stock alerts" />
        </SettingRow>
        <Divider />
        <SettingRow title="Out of stock alerts" caption="Tell me the moment a product runs out.">
          <Toggle checked={form.outOfStockAlerts} onChange={(v) => updateField('outOfStockAlerts', v)} label="Out of stock alerts" />
        </SettingRow>
        <Divider />
        <SettingRow title="Backup reminders" caption="Remind me to back up if it has been more than a day.">
          <Toggle checked={form.backupReminders} onChange={(v) => updateField('backupReminders', v)} label="Backup reminders" />
        </SettingRow>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overflowHidden: { overflow: 'hidden' },
});
