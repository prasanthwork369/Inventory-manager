/**
 * Direct port of the web reference's src/pages/Scanner.tsx. Not wrapped in
 * the shared `Screen` component — same exception as NewPurchaseScreen/
 * NewSaleScreen: this is a root-level fullScreenModal with its own custom
 * dark header, and its Close button uses router.back() to dismiss it
 * (the web's `navigate(-1)` has no modal-presentation equivalent to
 * preserve). The close button is a locally styled Pressable rather than
 * the shared IconButton — IconButton's pressed tint is a light gray
 * suited to the app's usual white/light screens, but this is the one
 * screen with a dark (`bg-ink`) background, matching the web's own
 * one-off `hover:bg-white/10` override on this specific instance.
 */
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PackageSearch, ScanLine, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, withOpacity } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Fields';
import { ProductThumb } from '@/components/common/ProductThumb';
import { formatMoney } from '@/features/products/utils/money';
import { getStockStatus } from '@/features/products/utils/stockStatus';
import { useScanner } from '../hooks/useScanner';

const CURRENCY_SYMBOL = '₹';
const FRAME_HEIGHT = 192;
const FRAME_WIDTH = 256;

export function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { status, code, match, manual, setManual, scanAgain, submitManual } = useScanner();

  const scanLineTop = useSharedValue(FRAME_HEIGHT * 0.08);
  useEffect(() => {
    if (status === 'scanning') {
      scanLineTop.value = withRepeat(withTiming(FRAME_HEIGHT * 0.92, { duration: 1200, easing: Easing.linear }), -1, true);
    }
  }, [status, scanLineTop]);
  const scanLineStyle = useAnimatedStyle(() => ({ top: scanLineTop.value }));

  return (
    <View style={styles.root}>
      {/* This is the one dark-background screen in the app — override the
          root layout's "dark" (dark icon) default so status bar content
          stays visible here; reverts automatically when this unmounts. */}
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <X size={20} color={colors.white} />
        </Pressable>
        <View style={styles.flex1}>
          <AppText size={16} weight="bold" color={colors.white}>
            Scan barcode
          </AppText>
          <AppText size={12.5} color={withOpacity(colors.white, 60)}>
            Point the camera at the product barcode
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.scanArea}>
          <View style={styles.scanBox}>
            <View style={styles.frameWrap}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                {status === 'scanning' && <Animated.View style={[styles.scanLine, scanLineStyle]} />}
              </View>
            </View>
            <AppText size={13} weight="medium" color={withOpacity(colors.white, 70)} style={styles.scanCaption}>
              {status === 'scanning' ? 'Looking for a barcode…' : `Detected ${code}`}
            </AppText>
          </View>

          <View style={styles.manualWrap}>
            <SearchInput value={manual} onChangeText={setManual} placeholder="Or enter barcode manually" />
            {manual.length > 0 && (
              <Button block style={styles.findButton} onPress={submitManual}>
                Find product
              </Button>
            )}
          </View>
        </View>

        <View style={styles.resultArea}>
          {status === 'found' && match && (
            <Card style={styles.resultCard}>
              <View style={styles.resultRow}>
                <ProductThumb product={match} />
                <View style={styles.flex1}>
                  <AppText size={15} weight="bold" color={colors.ink.DEFAULT} numberOfLines={1}>
                    {match.name}
                  </AppText>
                  <AppText size={12.5} color={colors.ink[400]}>
                    SKU {match.sku} · {match.currentStock} in stock
                  </AppText>
                </View>
                <AppText size={16} weight="extrabold" color={colors.ink.DEFAULT} tabular>
                  {formatMoney(match.sellingPriceMinor, CURRENCY_SYMBOL)}
                </AppText>
              </View>
              <View style={styles.resultActions}>
                <Button block variant="secondary" onPress={() => router.push(`/products/${match.id}`)}>
                  Open product
                </Button>
                <Button block disabled={getStockStatus(match) === 'out'} onPress={() => router.push('/sales/new')}>
                  Add to sale
                </Button>
              </View>
            </Card>
          )}

          {status === 'notfound' && (
            <Card style={styles.notFoundCard}>
              <View style={styles.notFoundIcon}>
                <PackageSearch size={24} color={colors.warn[600]} />
              </View>
              <AppText size={16} weight="bold" color={colors.ink.DEFAULT}>
                Product not found
              </AppText>
              <AppText size={13.5} color={colors.ink[500]} style={styles.notFoundMessage}>
                No product on this device uses barcode {code || manual}. Create it now so the next scan works.
              </AppText>
              <View style={styles.notFoundActions}>
                <Button block variant="secondary" icon={<ScanLine size={16} color={colors.ink.DEFAULT} />} onPress={scanAgain}>
                  Scan again
                </Button>
                <Button block onPress={() => router.push('/products/new')}>
                  Create product
                </Button>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink.DEFAULT },
  flex1: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  closeButton: {
    height: spacing[10],
    width: spacing[10],
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: { backgroundColor: withOpacity(colors.white, 10) },
  scrollContent: { flexGrow: 1 },
  scanArea: { width: '100%', maxWidth: 448, alignSelf: 'center', paddingHorizontal: spacing[4] },
  scanBox: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: withOpacity(colors.white, 10),
    backgroundColor: withOpacity(colors.white, 5),
    overflow: 'hidden',
  },
  frameWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  frame: {
    height: FRAME_HEIGHT,
    width: FRAME_WIDTH,
    borderRadius: radius['2xl'],
    borderWidth: 2,
    borderColor: withOpacity(colors.white, 70),
  },
  corner: { position: 'absolute', height: 24, width: 24, borderColor: colors.brand[400] },
  cornerTopLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius['2xl'] },
  cornerTopRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius['2xl'] },
  cornerBottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius['2xl'] },
  cornerBottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius['2xl'] },
  scanLine: { position: 'absolute', left: 8, right: 8, height: 2, borderRadius: radius.full, backgroundColor: colors.brand[400] },
  scanCaption: { position: 'absolute', left: 0, right: 0, bottom: spacing[5], textAlign: 'center' },
  manualWrap: { marginTop: spacing[4] },
  findButton: { marginTop: spacing[2] },
  resultArea: { width: '100%', maxWidth: 448, alignSelf: 'center', padding: spacing[4] },
  resultCard: { padding: spacing[4] },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  resultActions: { flexDirection: 'row', gap: spacing[2.5], marginTop: spacing[3] },
  notFoundCard: { alignItems: 'center', padding: spacing[5] },
  notFoundIcon: {
    height: spacing[12],
    width: spacing[12],
    borderRadius: radius['2xl'],
    backgroundColor: colors.warn[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  notFoundMessage: { marginTop: spacing[1], textAlign: 'center' },
  notFoundActions: { flexDirection: 'row', gap: spacing[2.5], marginTop: spacing[4], width: '100%' },
});
