/**
 * Ported from the web reference's Dashboard.tsx "Today's Sales" hero
 * button — the primary, brand-colored card at the top of the dashboard.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { DashboardSparkline } from './DashboardSparkline';
import type { DashboardSparklinePoint } from '../types';

interface HeroStatCardProps {
  amountLabel: string;
  transactionCount: number;
  profitLabel: string;
  sparkline: DashboardSparklinePoint[];
  onPress: () => void;
}

export function HeroStatCard({ amountLabel, transactionCount, profitLabel, sparkline, onPress }: HeroStatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <View style={styles.flex1}>
          <AppText size={13} weight="semibold" color={colors.brand[100]}>
            {"Today’s Sales"}
          </AppText>
          <AppText size={36} weight="extrabold" color={colors.white} tabular style={styles.amount}>
            {amountLabel}
          </AppText>
          <AppText size={13} weight="medium" color={colors.brand[100]} style={styles.subtitle}>
            {transactionCount} transactions · {profitLabel} est. profit
          </AppText>
        </View>
        <ChevronRight size={20} color={colors.brand[200]} />
      </View>
      <DashboardSparkline points={sparkline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius['3xl'],
    backgroundColor: colors.brand[600],
    padding: spacing[5],
  },
  cardPressed: { backgroundColor: colors.brand[700] },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  amount: { marginTop: spacing[1], lineHeight: 36, letterSpacing: -0.9 },
  subtitle: { marginTop: spacing[2] },
});
