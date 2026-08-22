/**
 * Ported from the web reference's Dashboard.tsx local `AlertTile` function
 * (Low Stock / Out of Stock tiles in the "Inventory alerts" section).
 */
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';

type AlertTone = 'warn' | 'bad';

interface AlertCardProps {
  tone: AlertTone;
  icon: React.ReactNode;
  title: string;
  value: string;
  caption: string;
  onPress: () => void;
}

const tonePalette: Record<AlertTone, { border: string; bg: string; bgPressed: string; accent: string }> = {
  warn: { border: colors.warn[100], bg: colors.warn[50], bgPressed: colors.warn[100], accent: colors.warn[600] },
  bad: { border: colors.bad[100], bg: colors.bad[50], bgPressed: colors.bad[100], accent: colors.bad[600] },
};

export function AlertCard({ tone, icon, title, value, caption, onPress }: AlertCardProps) {
  const palette = tonePalette[tone];
  const titleColor = tone === 'warn' ? colors.warn[700] : colors.bad[700];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: palette.border, backgroundColor: pressed ? palette.bgPressed : palette.bg },
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.white }]}>{icon}</View>
      <View style={styles.body}>
        <AppText size={13} weight="semibold" color={titleColor}>
          {title}
        </AppText>
        <AppText size={17} weight="extrabold" color={colors.ink.DEFAULT}>
          {value}
        </AppText>
        <AppText size={12} color={colors.ink[500]} numberOfLines={1} style={styles.caption}>
          {caption}
        </AppText>
      </View>
      <ChevronRight size={18} color={palette.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing[4],
  },
  iconWrap: { height: spacing[10], width: spacing[10], borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  caption: { marginTop: 2 },
});
