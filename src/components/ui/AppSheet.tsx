/**
 * Shared sheet system powered by @gorhom/bottom-sheet.
 *
 * Bottom-anchored modal sheet: rounded top corners, header with
 * title/description + close button, scrollable body, optional footer.
 *
 * Fully integrated with @gorhom/bottom-sheet v5:
 * - Backed by BottomSheetModal & BottomSheetModalProvider.
 * - Dynamic content height with maxDynamicContentSize capping at 92% screen height.
 * - Hardware Android back press handling.
 * - Swipe-down to dismiss with gesture coordination via BottomSheetScrollView.
 * - Tap backdrop to dismiss (disabled when non-dismissable).
 * - Modal stackBehavior="push" allowing nested sheets (e.g. Select inside filter sheet).
 * - Interactive keyboard handling (android_keyboardInputMode="adjustResize").
 * - Responsive tablet maxWidth with centered alignment.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button, IconButton } from './Button';

export interface AppSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  dismissable?: boolean;
}

export function AppSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissable = true,
}: AppSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const closingFromPropRef = useRef(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Handle hardware back press on Android
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dismissable) {
        onClose();
      }
      return true; // prevent default navigation/exit
    });
    return () => sub.remove();
  }, [open, dismissable, onClose]);

  // Synchronize open prop with BottomSheetModal present/dismiss
  useEffect(() => {
    if (open) {
      closingFromPropRef.current = false;
      sheetRef.current?.present();
      isPresentedRef.current = true;
    } else if (isPresentedRef.current) {
      closingFromPropRef.current = true;
      sheetRef.current?.dismiss();
      isPresentedRef.current = false;
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    const sheet = sheetRef.current;
    return () => {
      sheet?.dismiss();
    };
  }, []);

  const handleDismiss = useCallback(() => {
    isPresentedRef.current = false;
    if (!closingFromPropRef.current) {
      onClose();
    }
    closingFromPropRef.current = false;
  }, [onClose]);

  const maxWidth = size === 'lg' ? 672 : 448;
  const isNarrow = width < maxWidth;
  const horizontalInset = isNarrow ? 0 : Math.max(0, (width - maxWidth) / 2);

  const sheetStyle = useMemo(
    () => [
      styles.sheet,
      !isNarrow && {
        left: horizontalInset,
        right: horizontalInset,
        maxWidth,
      },
      shadows.sheet,
    ],
    [isNarrow, horizontalInset, maxWidth]
  );

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior={dismissable ? 'close' : 'none'}
        style={styles.backdrop}
      />
    ),
    [dismissable]
  );

  const renderHandle = useCallback(
    () => (
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText size={17} weight="bold" color={colors.ink.DEFAULT}>
            {title}
          </AppText>
          {description ? (
            <AppText size={13.5} color={colors.ink[500]} style={styles.description}>
              {description}
            </AppText>
          ) : null}
        </View>
        {dismissable && (
          <IconButton accessibilityLabel="Close" onPress={onClose}>
            <X size={20} color={colors.ink[500]} />
          </IconButton>
        )}
      </View>
    ),
    [title, description, dismissable, onClose]
  );

  const renderFooter = useCallback(
    (footerProps: BottomSheetFooterProps) => {
      if (!footer) return null;
      return (
        <BottomSheetFooter {...footerProps} bottomInset={0}>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
            {footer}
          </View>
        </BottomSheetFooter>
      );
    },
    [footer, insets.bottom]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing={true}
      maxDynamicContentSize={height * 0.92}
      enablePanDownToClose={dismissable}
      stackBehavior="push"
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
      enableBlurKeyboardOnGesture={true}
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      footerComponent={footer ? renderFooter : undefined}
      backgroundStyle={styles.background}
      style={sheetStyle}
      onDismiss={handleDismiss}
    >
      <BottomSheetScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          !footer && { paddingBottom: Math.max(insets.bottom, spacing[4]) },
        ]}
        keyboardShouldPersistTaps="handled"
        enableFooterMarginAdjustment={true}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

/**
 * Ported from the web reference's src/components/ui/Overlays.tsx
 * (ConfirmDialog) — co-located with AppSheet.
 * Preserves the exact public API, layered directly on top of AppSheet.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  detail?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  detail,
}: ConfirmDialogProps) {
  return (
    <AppSheet open={open} onClose={onClose} title={title} description={message}>
      {detail && (
        <View style={confirmStyles.detailBox}>
          {typeof detail === 'string' ? (
            <AppText size={13.5} color={colors.ink[700]}>
              {detail}
            </AppText>
          ) : (
            detail
          )}
        </View>
      )}
      <View style={confirmStyles.actions}>
        <Button variant="secondary" block onPress={onClose}>
          Cancel
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          block
          onPress={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </View>
    </AppSheet>
  );
}

const confirmStyles = StyleSheet.create({
  detailBox: { borderRadius: radius.xl, backgroundColor: colors.ink[50], padding: spacing[3.5] },
  actions: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] },
});

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
  },
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
  },
  backdrop: {
    backgroundColor: colors.ink.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    backgroundColor: colors.white,
  },
  headerText: { flex: 1, minWidth: 0 },
  description: { marginTop: 2 },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    backgroundColor: colors.white,
  },
});
