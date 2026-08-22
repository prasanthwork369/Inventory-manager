/**
 * Ported from the web reference's src/components/layout/Screen.tsx header
 * region (extracted here as its own component per Stage A's component
 * list; `Screen` composes it). Web's `sticky ... bg-white/95 backdrop-blur`
 * is a solid white background here — see the visual-differences note in the
 * Stage A summary for why blur was dropped.
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { AppText } from '../ui/AppText';
import { IconButton } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, back = true, onBack, actions }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
      {back && (
        <IconButton accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.ink[700]} />
        </IconButton>
      )}
      <View style={styles.titleWrap}>
        <AppText size={17} weight="bold" color={colors.ink.DEFAULT} numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        {subtitle && (
          <AppText size={12.5} color={colors.ink[500]} numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
      </View>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  backButton: { marginLeft: -spacing[2] },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { lineHeight: 21 },
  subtitle: { marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], flexShrink: 0 },
});
