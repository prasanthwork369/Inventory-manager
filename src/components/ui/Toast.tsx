/**
 * Ported from the web reference's src/components/ui/Toast.tsx
 * (ToastProvider/useToast). Same tones, same 3200ms auto-dismiss, same
 * stacked-from-bottom layout. Framer Motion's spring enter/exit is
 * replaced with Reanimated (already a project dependency).
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, withOpacity } from '../../theme';
import { AppText } from './AppText';

type ToastTone = 'success' | 'error' | 'warn' | 'info';
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<{ toast: (message: string, tone?: ToastTone) => void }>({
  toast: () => undefined,
});

const icons: Record<ToastTone, (props: { size: number }) => React.ReactElement> = {
  success: ({ size }) => <CheckCircle2 size={size} color={colors.good[500]} />,
  error: ({ size }) => <XCircle size={size} color={colors.bad[500]} />,
  warn: ({ size }) => <TriangleAlert size={size} color={colors.warn[500]} />,
  info: ({ size }) => <Info size={size} color={colors.brand[500]} />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  // Rapid-triggering / unmount safety: every scheduled dismiss is tracked so
  // it can be cancelled if the provider unmounts before it fires (avoids a
  // setState call — and, transitively, the FadeOutDown exit animation
  // mounting — on an already-unmounted tree).
  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach(clearTimeout);
      active.clear();
    };
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, tone, message }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setItems((s) => s.filter((t) => t.id !== id));
    }, 3200);
    timers.current.add(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* web: bottom-24 (6rem = 96px) above the safe area */}
      <View pointerEvents="box-none" style={[styles.container, { bottom: insets.bottom + spacing[24] }]}>
        {items.map((t) => {
          const Icon = icons[t.tone];
          return (
            <Animated.View key={t.id} entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(200)} style={styles.toast}>
              <Icon size={20} />
              <AppText size={14} weight="medium" color={colors.ink.DEFAULT} style={styles.message}>
                {t.message}
              </AppText>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).toast;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    zIndex: 60,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    width: '100%',
    maxWidth: 384,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.ink[200], 70),
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...shadows.lift,
  },
  message: { flex: 1 },
});
