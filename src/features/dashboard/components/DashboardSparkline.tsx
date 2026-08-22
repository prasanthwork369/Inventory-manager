/**
 * Ported from the web reference's Dashboard.tsx hero-card sparkline. Note:
 * the web source itself renders this as plain styled <div> bars, not SVG —
 * so this is plain RN Views too, matching instruction 9's "lightest
 * correct implementation" (introducing react-native-svg here would be
 * adding something the source doesn't actually use).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import type { DashboardSparklinePoint } from '../types';

const BAR_MAX_HEIGHT = 56;
const BAR_MIN_HEIGHT = 4;

interface DashboardSparklineProps {
  points: DashboardSparklinePoint[];
}

export function DashboardSparkline({ points }: DashboardSparklineProps) {
  const peak = Math.max(...points.map((p) => p.value), 1);
  const lastIndex = points.length - 1;

  return (
    <View style={styles.row}>
      {points.map((p, i) => (
        <View key={`${p.label}-${i}`} style={styles.column}>
          <View
            style={[
              styles.bar,
              {
                height: Math.max((p.value / peak) * BAR_MAX_HEIGHT, BAR_MIN_HEIGHT),
                backgroundColor: i === lastIndex ? colors.white : withOpacity(colors.white, 30),
              },
            ]}
          />
          <AppText size={10.5} weight="semibold" color={colors.brand[200]}>
            {p.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: spacing[5], flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  column: { flex: 1, alignItems: 'center', gap: spacing[1.5] },
  bar: { width: '100%', borderRadius: radius.md },
});
