/**
 * Direct port of the web reference's AboutSettings (SettingsPages.tsx).
 * Version reads the real app config (expo-constants) instead of a
 * hardcoded string; the web's "Build 2026.08" has no equivalent build
 * number in this app's config, so it's dropped rather than invented.
 */
import React from 'react';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Cloud, FileText, LifeBuoy, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider } from '@/components/ui/Card';
import { Screen } from '@/components/layout/Screen';
import { useToast } from '@/components/ui/Toast';
import { SettingRow } from '../components/SettingRow';

const LINKS = [
  { label: 'Privacy policy', Icon: FileText },
  { label: 'Terms of use', Icon: FileText },
  { label: 'Contact support', Icon: LifeBuoy },
];

export function AboutScreen() {
  const toast = useToast();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title="About" subtitle="Code Neptune Inventory & Stock Manager">
      <View style={styles.stack}>
        <Card style={styles.heroCard}>
          <View style={styles.logo}>
            <AppText size={22} weight="extrabold" color={colors.white}>
              N
            </AppText>
          </View>
          <AppText size={18} weight="extrabold" color={colors.ink.DEFAULT} style={styles.appName}>
            Code Neptune Inventory
          </AppText>
          <AppText size={13} color={colors.ink[500]}>
            Version {version}
          </AppText>
        </Card>

        <Card style={styles.overflowHidden}>
          <SettingRow title="Your data stays here" caption="Everything is stored locally on this device. No account, no server, no internet needed.">
            <ShieldCheck size={20} color={colors.good[500]} />
          </SettingRow>
          <Divider />
          <SettingRow title="Cloud sync" caption="Optional multi-device sync is coming in a future release. It will never be required.">
            <Cloud size={20} color={colors.ink[400]} />
          </SettingRow>
        </Card>

        <Card style={styles.overflowHidden}>
          {LINKS.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <Divider />}
              <Pressable onPress={() => toast(`${item.label} opens in your browser.`, 'info')} style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <item.Icon size={18} color={colors.ink[500]} />
                <AppText size={15} weight="semibold" color={colors.ink.DEFAULT} style={styles.flex1}>
                  {item.label}
                </AppText>
              </Pressable>
            </View>
          ))}
        </Card>

        <Button variant="secondary" block onPress={() => router.push('/more/backup')}>
          Backup my data
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing[4] },
  flex1: { flex: 1 },
  overflowHidden: { overflow: 'hidden' },
  heroCard: { alignItems: 'center', padding: spacing[6] },
  logo: { height: spacing[14], width: spacing[14], borderRadius: radius['2xl'], backgroundColor: colors.brand[600], alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] },
  appName: { letterSpacing: -0.45 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  linkRowPressed: { backgroundColor: colors.ink[50] },
});
