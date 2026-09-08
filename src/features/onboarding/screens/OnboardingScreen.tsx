/**
 * Direct port of the web reference's src/pages/Onboarding.tsx. Structure
 * mirrors that file 1:1 on purpose: one screen component owning the step
 * machine (via useOnboarding), with Logo/Splash/StepHeader as small local
 * components exactly like the web source keeps them local to the same
 * file rather than extracting them — there's no "genuine reuse" elsewhere
 * that would justify promoting them, per the New Component Rule.
 *
 * Not wrapped in the shared `Screen` component: the web onboarding has no
 * header/back-chevron chrome at all (`<div className="flex min-h-full
 * flex-col bg-white">`, no Screen usage there either) — using `Screen`
 * here would add UI the source doesn't have.
 */
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import {
  BadgeCheck,
  DatabaseBackup,
  Fingerprint,
  LockKeyhole,
  Smartphone,
  ShieldOff,
  type LucideIcon,
} from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { completeOnboarding } from '@/hooks/useAppEntry';
import { colors, radius, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card, Divider } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Fields';
import { useToast } from '@/components/ui/Toast';
import { updateSettings } from '@/features/settings/data/settingsProvider';
import { DEFAULT_SETTINGS } from '@/features/settings/constants';
import { BUSINESS_TYPES, COUNTRIES, CURRENCIES } from '../constants';
import { useOnboarding } from '../hooks/useOnboarding';
import type { LockMode } from '../types';

// web: each step is a motion.div, opacity 0->1 + y 12->0, 300ms, this ease.
// Reanimated's FadeInDown reproduces the same opacity+translateY entrance;
// its built-in offset isn't pinned to exactly 12px, which is imperceptible
// at this distance and duration.
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const STEP_ENTER = FadeInDown.duration(300).easing(EASE);

const FEATURES: { title: string; body: string }[] = [
  { title: 'Works fully offline', body: 'Every sale and stock update is saved on this device.' },
  { title: 'Sell in seconds', body: 'Scan or search, take payment, print the receipt.' },
  { title: 'Know your profit', body: 'Daily sales, purchases and estimated profit at a glance.' },
];

const LOCK_OPTIONS: { key: LockMode; Icon: LucideIcon; title: string; body: string }[] = [
  { key: 'pin', Icon: LockKeyhole, title: '4-digit PIN', body: 'Ask for a PIN when the app opens.' },
  { key: 'biometric', Icon: Fingerprint, title: 'Biometric', body: 'Use fingerprint or face unlock on this device.' },
  { key: 'none', Icon: ShieldOff, title: 'No lock', body: 'Open the app instantly. You can add a lock later.' },
];

export function OnboardingScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const {
    step,
    business,
    businessError,
    security,
    securityValid,
    currencySymbol,
    goToBusinessStep,
    updateBusinessField,
    submitBusiness,
    setLockMode,
    setPin,
    completeSecurityStep,
  } = useOnboarding();

  // web: finish() — updateSettings(business + security) + setOnboarded(true)
  // + toast + navigate('/'). Persists the collected business/security draft
  // into the same Settings row the Settings screens later read/edit, so
  // there's one source of truth (Section 13) — email/logo aren't collected
  // here, so they start blank rather than inheriting the seeded demo
  // business's placeholder values. Only `hasPinSet` is derived from the
  // chosen lock mode; the raw PIN digits are never persisted (see
  // SecuritySettings' own doc comment).
  const finish = async () => {
    await updateSettings({
      business: {
        name: business.name,
        type: business.type,
        currency: business.currency,
        country: business.country,
        phone: business.phone,
        address: business.address,
        currencySymbol,
        email: '',
        logo: '',
      },
      security: {
        mode: security.mode,
        hasPinSet: security.mode === 'pin',
        autoLock: DEFAULT_SETTINGS.security.autoLock,
        timeoutMinutes: DEFAULT_SETTINGS.security.timeoutMinutes,
      },
    });
    await completeOnboarding();
    toast('Your business is ready to go.');
    router.replace('/(tabs)');
  };

  // web: marks onboarded then navigate('/backup'). /more/backup is now the
  // real Backup screen built in Phase 13.
  const restoreBackup = () => {
    toast('Demo backup restored to this device.', 'info');
    router.replace('/more/backup');
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[8] }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            {step === 'splash' && <Splash />}

            {step === 'welcome' && (
              <Animated.View key="welcome" entering={STEP_ENTER} style={styles.stepFlex}>
                <Logo />
                <View style={styles.welcomeBody}>
                  <AppText size={30} weight="extrabold" color={colors.ink.DEFAULT} style={styles.welcomeTitle}>
                    Take control of your inventory.
                  </AppText>
                  <AppText size={16} color={colors.ink[500]} style={styles.welcomeSubtitle}>
                    Track products, stock, sales and purchases — all in one simple app.
                  </AppText>
                  <View style={styles.featureList}>
                    {FEATURES.map((f) => (
                      <View key={f.title} style={styles.featureRow}>
                        <BadgeCheck size={20} color={colors.brand[600]} style={styles.featureIcon} />
                        <View style={styles.featureText}>
                          <AppText size={14.5} weight="semibold" color={colors.ink.DEFAULT}>
                            {f.title}
                          </AppText>
                          <AppText size={13.5} color={colors.ink[500]}>
                            {f.body}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.ctaGroup}>
                  <Button size="lg" block onPress={goToBusinessStep}>
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    block
                    variant="secondary"
                    icon={<DatabaseBackup size={18} color={colors.ink.DEFAULT} />}
                    onPress={restoreBackup}
                  >
                    Restore Backup
                  </Button>
                </View>
              </Animated.View>
            )}

            {step === 'business' && (
              <Animated.View key="business" entering={STEP_ENTER} style={styles.stepFlex}>
                <StepHeader step={1} total={3} title="Create your business" subtitle="This appears on your receipts and reports." />
                <View style={styles.formBody}>
                  <Field label="Business name" required error={businessError}>
                    <Input
                      value={business.name}
                      onChangeText={(v) => updateBusinessField('name', v)}
                      placeholder="e.g. Neptune General Store"
                      invalid={!!businessError}
                    />
                  </Field>
                  <Field label="Business type">
                    <Select
                      value={business.type}
                      onChange={(v) => updateBusinessField('type', v)}
                      options={BUSINESS_TYPES.map((t) => ({ value: t, label: t }))}
                      sheetTitle="Business type"
                    />
                  </Field>
                  <View style={styles.row2col}>
                    <Field label="Currency" style={styles.flex1}>
                      <Select
                        value={business.currency}
                        onChange={(v) => updateBusinessField('currency', v)}
                        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                        sheetTitle="Currency"
                      />
                    </Field>
                    <Field label="Country" style={styles.flex1}>
                      <Select
                        value={business.country}
                        onChange={(v) => updateBusinessField('country', v)}
                        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                        sheetTitle="Country"
                      />
                    </Field>
                  </View>
                  <Field label="Phone" hint="Optional — printed on receipts.">
                    <Input
                      value={business.phone}
                      onChangeText={(v) => updateBusinessField('phone', v)}
                      placeholder="+91 98765 43210"
                      keyboardType="phone-pad"
                    />
                  </Field>
                  <Field label="Address" hint="Optional">
                    <Textarea
                      value={business.address}
                      onChangeText={(v) => updateBusinessField('address', v)}
                      placeholder="Shop no, street, city"
                    />
                  </Field>
                </View>
                <View style={styles.ctaGroupSingle}>
                  <Button size="lg" block onPress={submitBusiness}>
                    Create Business
                  </Button>
                </View>
              </Animated.View>
            )}

            {step === 'security' && (
              <Animated.View key="security" entering={STEP_ENTER} style={styles.stepFlex}>
                <StepHeader
                  step={2}
                  total={3}
                  title="Protect your business data"
                  subtitle="Your data lives on this device. Add a lock so only you can open it."
                />
                <View style={styles.securityBody}>
                  {LOCK_OPTIONS.map((opt) => {
                    const selected = security.mode === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setLockMode(opt.key)}
                        style={({ pressed }) => [
                          styles.lockOption,
                          selected ? styles.lockOptionActive : pressed && styles.lockOptionPressed,
                        ]}
                      >
                        <opt.Icon size={20} color={colors.brand[600]} style={styles.lockOptionIcon} />
                        <View style={styles.flex1}>
                          <AppText size={15} weight="semibold" color={colors.ink.DEFAULT}>
                            {opt.title}
                          </AppText>
                          <AppText size={13} color={colors.ink[500]} style={styles.lockOptionBody}>
                            {opt.body}
                          </AppText>
                        </View>
                      </Pressable>
                    );
                  })}
                  {security.mode === 'pin' && (
                    <Field label="Set your PIN" hint="4 digits. You can change it in Settings.">
                      <Input
                        value={security.pin}
                        onChangeText={setPin}
                        keyboardType="number-pad"
                        placeholder="••••"
                        maxLength={4}
                        style={styles.pinInput}
                      />
                    </Field>
                  )}
                </View>
                <View style={styles.ctaGroupSingle}>
                  <Button size="lg" block disabled={!securityValid} onPress={completeSecurityStep}>
                    Continue
                  </Button>
                </View>
              </Animated.View>
            )}

            {step === 'done' && (
              <Animated.View key="done" entering={STEP_ENTER} style={styles.stepFlex}>
                <StepHeader step={3} total={3} title="Your business is ready." subtitle="Here is how your shop is set up right now." />
                <Card style={styles.summaryCard}>
                  <SummaryRow label="Products" value="22 sample products loaded" />
                  <Divider />
                  <SummaryRow label="Stock" value="Opening stock recorded for every product" />
                  <Divider />
                  <SummaryRow label="Currency" value={`${business.currency} (${currencySymbol})`} />
                  <Divider />
                  <SummaryRow label="Tax" value="GST 5% — exclusive of price" />
                  <Divider />
                  <SummaryRow label="Storage" value="Saved on this device" />
                </Card>
                <View style={styles.noticeBox}>
                  <Smartphone size={16} color={colors.ink[500]} style={styles.noticeIcon} />
                  <AppText size={13} color={colors.ink[500]} style={styles.noticeText}>
                    Your business data is stored locally on this device. Create a backup regularly from Settings so you
                    never lose it.
                  </AppText>
                </View>
                <View style={styles.flex1} />
                <View style={styles.ctaGroupSingle}>
                  <Button size="lg" block onPress={finish}>
                    Go to Dashboard
                  </Button>
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText size={14} color={colors.ink[500]}>
        {label}
      </AppText>
      <AppText size={14} weight="semibold" color={colors.ink.DEFAULT}>
        {value}
      </AppText>
    </View>
  );
}

function Logo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoBadge}>
        <AppText size={17} weight="extrabold" color={colors.white}>
          N
        </AppText>
      </View>
      <View>
        <AppText size={15} weight="bold" color={colors.ink.DEFAULT}>
          Code Neptune
        </AppText>
        <AppText size={12} weight="medium" color={colors.ink[400]}>
          Inventory & Stock Manager
        </AppText>
      </View>
    </View>
  );
}

const TRACK_WIDTH = 128;
const BAR_WIDTH = TRACK_WIDTH / 3;

// web: logo entrance is opacity 0->1 + scale 0.96->1 (280ms). The scale
// component is dropped here (FadeIn only, no scale) — a 4% scale change
// on a static splash shown for ~1.5s isn't perceptible enough to justify
// a second animated style for it; the loading-bar sweep below (the part
// that's actually visible/meaningful) is preserved exactly.
function Splash() {
  const x = useSharedValue(-BAR_WIDTH);

  useEffect(() => {
    x.value = withRepeat(withTiming(TRACK_WIDTH * 3 - BAR_WIDTH, { duration: 1100, easing: Easing.linear }), -1);
  }, [x]);

  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.splashWrap}>
      <Animated.View entering={FadeIn.duration(280)} style={styles.splashLogo}>
        <View style={styles.splashBadge}>
          <AppText size={34} weight="extrabold" color={colors.white}>
            N
          </AppText>
        </View>
        <AppText size={19} weight="bold" color={colors.ink.DEFAULT} style={styles.splashTitle}>
          Code Neptune
        </AppText>
        <AppText size={13.5} weight="medium" color={colors.ink[400]}>
          Inventory & Stock Manager
        </AppText>
      </Animated.View>
      <View style={styles.splashTrack}>
        <Animated.View style={[styles.splashBar, barStyle]} />
      </View>
    </View>
  );
}

function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle: string }) {
  return (
    <View>
      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.progressSegment, i < step ? styles.progressSegmentActive : styles.progressSegmentInactive]} />
        ))}
      </View>
      <AppText size={24} weight="extrabold" color={colors.ink.DEFAULT} style={styles.stepTitle}>
        {title}
      </AppText>
      <AppText size={14.5} color={colors.ink[500]} style={styles.stepSubtitle}>
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing[6], alignItems: 'center' },
  inner: { width: '100%', maxWidth: 448, flex: 1 },
  stepFlex: { flex: 1 },

  // Splash
  splashWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { alignItems: 'center' },
  splashBadge: {
    height: 80,
    width: 80,
    borderRadius: radius['3xl'],
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: { marginTop: spacing[5] },
  splashTrack: {
    marginTop: spacing[10],
    height: 4,
    width: TRACK_WIDTH,
    overflow: 'hidden',
    borderRadius: radius.full,
    backgroundColor: colors.ink[100],
  },
  splashBar: { height: '100%', width: BAR_WIDTH, borderRadius: radius.full, backgroundColor: colors.brand[600] },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2.5] },
  logoBadge: {
    height: spacing[10],
    width: spacing[10],
    borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Welcome
  welcomeBody: { marginTop: spacing[10], flex: 1 },
  // web: text-[30px] leading-[1.15] tracking-tight -> 30*1.15, -0.025em
  welcomeTitle: { lineHeight: 34.5, letterSpacing: -0.75 },
  // web: text-[16px] leading-relaxed -> 16*1.625
  welcomeSubtitle: { marginTop: spacing[3], lineHeight: 26 },
  featureList: { marginTop: spacing[8], gap: spacing[3] },
  featureRow: { flexDirection: 'row', gap: spacing[3] },
  featureIcon: { marginTop: 2 },
  featureText: { flex: 1 },
  ctaGroup: { paddingTop: spacing[8], gap: spacing[3] },
  ctaGroupSingle: { paddingTop: spacing[6] },

  // Step header
  progressRow: { marginBottom: spacing[5], flexDirection: 'row', gap: spacing[1.5] },
  progressSegment: { height: 6, flex: 1, borderRadius: radius.full },
  progressSegmentActive: { backgroundColor: colors.brand[600] },
  progressSegmentInactive: { backgroundColor: colors.ink[100] },
  // web: text-[24px] leading-tight tracking-tight -> 24*1.25, -0.025em
  stepTitle: { lineHeight: 30, letterSpacing: -0.6 },
  // web: text-[14.5px] leading-relaxed -> 14.5*1.625
  stepSubtitle: { marginTop: spacing[1.5], lineHeight: 23.56 },

  // Business form
  formBody: { marginTop: spacing[6], flex: 1, gap: spacing[4] },
  row2col: { flexDirection: 'row', gap: spacing[3] },

  // Security
  securityBody: { marginTop: spacing[6], flex: 1, gap: spacing[3] },
  lockOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.ink[200],
    padding: spacing[4],
  },
  lockOptionActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  lockOptionPressed: { backgroundColor: colors.ink[50] },
  lockOptionIcon: { marginTop: 2 },
  lockOptionBody: { marginTop: 2 },
  pinInput: { letterSpacing: 8 },

  // Completion
  summaryCard: { marginTop: spacing[6] },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  noticeBox: {
    marginTop: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    borderRadius: radius['2xl'],
    backgroundColor: colors.ink[50],
    padding: spacing[3.5],
  },
  noticeIcon: { marginTop: 2 },
  // web: text-[13px] leading-relaxed -> 13*1.625
  noticeText: { flex: 1, lineHeight: 21.13 },
});
