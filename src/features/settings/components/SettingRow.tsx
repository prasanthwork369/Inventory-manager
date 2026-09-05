/**
 * Ported from the web reference's local `SettingRow` (repeated inline in
 * SettingsPages.tsx for every toggle-style row) — pulled into one file
 * here since 5 Settings screens need it, matching the same "promote
 * within a feature once its own screens repeat it" reasoning already
 * used elsewhere (e.g. Categories' local tile, kept local, versus this,
 * shared across many sibling screens in the same feature).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';

interface SettingRowProps {
  title: string;
  caption: string;
  children: React.ReactNode;
}

export function SettingRow({ title, caption, children }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.flex1}>
        <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
          {title}
        </AppText>
        <AppText size={12.5} color={colors.ink[500]} style={styles.caption}>
          {caption}
        </AppText>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[4], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  flex1: { flex: 1, minWidth: 0 },
  caption: { marginTop: 2, lineHeight: 19.5 },
});
