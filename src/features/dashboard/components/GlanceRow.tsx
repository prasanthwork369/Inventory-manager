/**
 * Ported from the web reference's Dashboard.tsx local `GlanceRow` function
 * ("Today at a glance" card rows).
 *
 * Chevron color: web sets `text-ink-300`, which — per the empirical
 * finding from the earlier parity-patch phase (compiled the web project's
 * actual Tailwind output) — is not a defined shade and resolves to zero
 * CSS, inheriting the ambient body color (ink.DEFAULT, near-black), not a
 * light gray. Used here accordingly rather than inventing a gray.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';

interface GlanceRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
}

export function GlanceRow({ icon, label, value, onPress }: GlanceRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>{icon}</View>
      <AppText size={14} weight="medium" color={colors.ink[700]} style={styles.flex1}>
        {label}
      </AppText>
      <AppText size={14.5} weight="bold" color={colors.ink.DEFAULT} tabular>
        {value}
      </AppText>
      <ChevronRight size={16} color={colors.ink.DEFAULT} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  rowPressed: { backgroundColor: colors.ink[50] },
  iconWrap: {
    height: spacing[9],
    width: spacing[9],
    borderRadius: radius.xl,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
});
