/**
 * Ported from the web reference's src/components/ui/Overlays.tsx (Sheet).
 * Bottom-anchored modal sheet: rounded top corners, header with
 * title/description + close button, scrollable body, optional footer.
 *
 * Web animates the backdrop and panel as two independent Framer Motion
 * elements with their own fixed transitions (backdrop: duration 0.2s;
 * panel: duration 0.26s — both use the same duration for their enter AND
 * exit, they are not asymmetric by direction). This is reproduced here
 * with two separate Reanimated shared values rather than one, so the
 * backdrop fades faster than the panel settles/dismisses on both open and
 * close, matching the web's actual (slightly overlapping) timing.
 *
 * One simplification: web's panel keyframes are itself asymmetric —
 * initial y:32 -> animate y:0, but exit targets y:24 (not back through
 * 32). A single 0-1 progress value can't cheaply express a different
 * travel distance per direction, so this uses one fixed 28px (the
 * midpoint) both ways. The ~4-8px difference is not perceptible in
 * practice and isn't worth the added complexity of direction-aware
 * interpolation.
 *
 * RN `Modal` + Reanimated is used instead of @gorhom/bottom-sheet, per the
 * decision to not add that dependency yet. No drag-to-dismiss gesture is
 * implemented — tap-backdrop / close-button only, added later only if a
 * screen needs it.
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, withOpacity } from '../../theme';
import { AppText } from './AppText';
import { IconButton } from './Button';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const BACKDROP_DURATION = 200;
const PANEL_DURATION = 260;
const PANEL_TRAVEL = 28;

interface AppSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

export function AppSheet({ open, onClose, title, description, children, footer, size = 'md' }: AppSheetProps) {
  const [visible, setVisible] = useState(open);
  const [renderedOpen, setRenderedOpen] = useState(open);
  const backdropProgress = useSharedValue(0);
  const panelProgress = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Mount the modal synchronously during render when `open` flips true, per
  // React's "adjusting state when a prop changes" pattern — avoids the
  // setState-in-effect cascading-render pitfall for the entry case.
  if (open !== renderedOpen) {
    setRenderedOpen(open);
    if (open) setVisible(true);
  }

  useEffect(() => {
    if (open) {
      backdropProgress.value = withTiming(1, { duration: BACKDROP_DURATION, easing: EASE });
      panelProgress.value = withTiming(1, { duration: PANEL_DURATION, easing: EASE });
    } else if (visible) {
      backdropProgress.value = withTiming(0, { duration: BACKDROP_DURATION, easing: EASE });
      // Unmount is driven off the panel (the slower of the two), matching
      // which element visually finishes last in the web version.
      panelProgress.value = withTiming(0, { duration: PANEL_DURATION, easing: EASE }, (finished) => {
        if (finished) runOnJS(setVisible)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropProgress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelProgress.value,
    transform: [
      { translateY: (1 - panelProgress.value) * PANEL_TRAVEL },
      { scale: 0.98 + panelProgress.value * 0.02 },
    ],
  }));

  if (!visible) return null;

  const maxWidth = size === 'lg' ? 672 : 448;
  const isNarrow = width < maxWidth;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            { width: isNarrow ? '100%' : maxWidth, paddingBottom: insets.bottom },
            panelStyle,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText size={17} weight="bold" color={colors.ink.DEFAULT}>
                {title}
              </AppText>
              {description && (
                <AppText size={13.5} color={colors.ink[500]} style={styles.description}>
                  {description}
                </AppText>
              )}
            </View>
            <IconButton accessibilityLabel="Close" onPress={onClose}>
              <X size={20} color={colors.ink[500]} />
            </IconButton>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { backgroundColor: withOpacity(colors.ink.DEFAULT, 40) },
  panel: {
    maxHeight: '92%',
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    backgroundColor: colors.white,
    ...shadows.sheet,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  headerText: { flex: 1, minWidth: 0 },
  description: { marginTop: 2 },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
});
