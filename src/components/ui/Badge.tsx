/**
 * Ported from the web reference's src/components/ui/Surface.tsx (Badge).
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'brand';

const tones: Record<Tone, { bg: string; text: string; dot: string }> = {
  neutral: { bg: colors.ink[100], text: colors.ink[700], dot: colors.ink[400] },
  good: { bg: colors.good[50], text: colors.good[700], dot: colors.good[500] },
  warn: { bg: colors.warn[50], text: colors.warn[700], dot: colors.warn[500] },
  bad: { bg: colors.bad[50], text: colors.bad[700], dot: colors.bad[500] },
  brand: { bg: colors.brand[50], text: colors.brand[700], dot: colors.brand[500] },
};

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ tone = 'neutral', dot, children, style }: BadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.dot }]} />}
      {typeof children === 'string' ? (
        <AppText size={12} weight="semibold" color={t.text}>
          {children}
        </AppText>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
  },
  dot: { height: 6, width: 6, borderRadius: 3 },
});
