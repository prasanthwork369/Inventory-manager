/**
 * Ported from the web reference's src/components/layout/Screen.tsx. Web's
 * `sticky top-0` header / `sticky bottom-20` footer around a scrolling
 * `<div>` become RN's natural fixed-header / ScrollView-body / fixed-footer
 * stack — no "sticky" positioning needed, this is just normal RN layout.
 * `wide` (web's max-w-6xl vs max-w-3xl content constraint, for desktop) is
 * kept for larger devices/tablets; it's a no-op on phone widths.
 */
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { Header } from './Header';

interface ScreenProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  scroll?: boolean;
}

const MAX_WIDTH = 768;
const MAX_WIDTH_WIDE = 1152;

export function Screen({ title, subtitle, back = true, onBack, actions, children, footer, wide, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const maxWidth = wide ? MAX_WIDTH_WIDE : MAX_WIDTH;

  return (
    <View style={styles.root}>
      <Header title={title} subtitle={subtitle} back={back} onBack={onBack} actions={actions} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.content, { maxWidth }]}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.contentContainer]}>
            <View style={[styles.content, { maxWidth }]}>{children}</View>
          </View>
        )}
        {footer && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[3] }]}>
            <View style={[styles.content, { maxWidth }]}>{footer}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink[50] },
  flex: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  content: { width: '100%', alignSelf: 'center' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
});
