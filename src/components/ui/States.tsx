/**
 * Ported from the web reference's src/components/ui/States.tsx —
 * EmptyState, ErrorNotice, Skeleton, ListSkeleton, ProcessingState.
 *
 * Skeleton: the web uses a CSS translateX gradient "shimmer" sweep
 * (@keyframes shimmer in index.css). RN has no CSS keyframes/gradients
 * without an extra dependency, so this uses a Reanimated opacity pulse
 * instead — same "loading" affordance, simpler motion. Flagged as an
 * intentional visual difference.
 */
import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, withOpacity } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyWrap, style]}>
      <View style={styles.emptyIcon}>{icon}</View>
      <AppText size={17} weight="bold" color={colors.ink.DEFAULT} style={styles.emptyTitle}>
        {title}
      </AppText>
      <AppText size={14} color={colors.ink[500]} style={styles.emptyMessage}>
        {message}
      </AppText>
      {(actionLabel || secondaryLabel) && (
        <View style={styles.emptyActions}>
          {actionLabel && onAction && <Button onPress={onAction}>{actionLabel}</Button>}
          {secondaryLabel && onSecondary && (
            <Button variant="secondary" onPress={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

interface ErrorNoticeProps {
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  tone?: 'bad' | 'warn';
  style?: StyleProp<ViewStyle>;
}

export function ErrorNotice({ title, message, action, onAction, tone = 'bad', style }: ErrorNoticeProps) {
  const palette = tone === 'bad' ? colors.bad : colors.warn;
  return (
    <View style={[styles.noticeWrap, { borderColor: palette[100], backgroundColor: palette[50] }, style]}>
      <AlertTriangle size={20} color={palette[500]} style={{ marginTop: 2 }} />
      <View style={styles.noticeBody}>
        <AppText size={14} weight="bold" color={palette[700]}>
          {title}
        </AppText>
        <AppText size={13.5} color={palette[700]} style={styles.noticeMessage}>
          {message}
        </AppText>
        {action && onAction && (
          <AppText onPress={onAction} size={13} weight="bold" color={palette[700]} style={styles.noticeAction}>
            {action}
          </AppText>
        )}
      </View>
    </View>
  );
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.skeletonBase, animatedStyle, style]} />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.listSkeletonWrap} accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listSkeletonRow}>
          <Skeleton style={{ height: spacing[12], width: spacing[12], borderRadius: radius.xl }} />
          <View style={styles.listSkeletonLines}>
            <Skeleton style={{ height: 14, width: '40%' }} />
            <Skeleton style={{ height: 12, width: '25%' }} />
          </View>
          <Skeleton style={{ height: 24, width: 64, borderRadius: radius.full }} />
        </View>
      ))}
    </View>
  );
}

interface ProcessingStateProps {
  title: string;
  message: string;
}

export function ProcessingState({ title, message }: ProcessingStateProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1);
  }, [rotation]);

  const spinnerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={styles.processingWrap}>
      <Animated.View style={[styles.spinner, spinnerStyle]} />
      <AppText size={16} weight="bold" color={colors.ink.DEFAULT} style={styles.processingTitle}>
        {title}
      </AppText>
      <AppText size={13.5} color={colors.ink[500]} style={styles.processingMessage}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { alignItems: 'center', paddingHorizontal: spacing[8], paddingVertical: spacing[14] },
  emptyIcon: {
    height: spacing[16],
    width: spacing[16],
    borderRadius: radius['2xl'],
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: { textAlign: 'center' },
  emptyMessage: {
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing[1.5],
    maxWidth: 320, // web: max-w-xs = 20rem = 320px (was 280, verified mismatch)
  },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginTop: spacing[5], justifyContent: 'center' },
  noticeWrap: { flexDirection: 'row', gap: spacing[3], borderRadius: radius['2xl'], borderWidth: 1, padding: spacing[3.5] },
  noticeBody: { flex: 1, minWidth: 0 },
  noticeMessage: { lineHeight: 19, marginTop: 2, opacity: 0.85 },
  noticeAction: { marginTop: spacing[2], textDecorationLine: 'underline' },
  skeletonBase: { borderRadius: radius.lg, backgroundColor: colors.ink[100] },
  listSkeletonWrap: { gap: spacing[2.5] },
  listSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70), // web: border-ink-200/70 (was solid, verified mismatch)
    backgroundColor: colors.white,
    padding: spacing[3.5],
  },
  listSkeletonLines: { flex: 1, gap: spacing[2] },
  processingWrap: { alignItems: 'center', paddingHorizontal: spacing[8], paddingVertical: spacing[12] },
  spinner: {
    height: spacing[10],
    width: spacing[10],
    borderRadius: spacing[10] / 2,
    borderWidth: 3,
    borderColor: colors.brand[100],
    borderTopColor: colors.brand[600],
    marginBottom: spacing[4],
  },
  processingTitle: { textAlign: 'center' },
  processingMessage: {
    textAlign: 'center',
    marginTop: spacing[1],
    maxWidth: 320,
  },
});
