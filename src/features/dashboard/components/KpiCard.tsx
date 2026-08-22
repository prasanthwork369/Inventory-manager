/**
 * Ported from the web reference's Dashboard.tsx `secondary` KPI tiles
 * (Stock Value / Today's Purchases / Estimated Profit).
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';

interface KpiCardProps {
  label: string;
  value: string;
  caption: string;
  onPress: () => void;
}

export function KpiCard({ label, value, caption, onPress }: KpiCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <AppText size={12} weight="semibold" color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={19} weight="extrabold" color={colors.ink.DEFAULT} tabular style={styles.value}>
        {value}
      </AppText>
      <AppText size={11.5} color={colors.ink[400]} numberOfLines={1} style={styles.caption}>
        {caption}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    padding: spacing[3.5],
  },
  cardPressed: { backgroundColor: withOpacity(colors.brand[50], 40), borderColor: colors.brand[200] },
  value: { marginTop: spacing[1.5], letterSpacing: -0.475 },
  caption: { marginTop: 2 },
});
