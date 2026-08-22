/**
 * Step machine + form state for onboarding, ported from the web reference's
 * Onboarding.tsx local `useState` calls (`step`, `form`, `error`, `lock`,
 * `pin`) and its `submitBusiness`/`finish` handlers. Navigation (leaving
 * `/onboarding`) and toast are left to the screen — this hook only owns
 * the step machine and the draft, matching `OnboardingScreen -> useOnboarding
 * -> stable onboarding types/state` with no knowledge of routing or
 * persistence. `OnboardingDraft` is what a future SettingsRepository would
 * receive; this hook never assumes how (or whether yet) that's stored.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import { CURRENCY_SYMBOLS, DEFAULT_BUSINESS_PROFILE } from '../constants';
import type { BusinessProfile, LockMode, OnboardingDraft, OnboardingStep, SecurityPreferences } from '../types';
import { isSecurityValid, validateBusinessProfile } from '../utils/validation';

const SPLASH_DURATION_MS = 1500;

const DEFAULT_SECURITY: SecurityPreferences = { mode: 'none', pin: '' };

export function useOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [business, setBusiness] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [businessError, setBusinessError] = useState('');
  const [security, setSecurity] = useState<SecurityPreferences>(DEFAULT_SECURITY);

  // web: useEffect(() => { if (step !== 'splash') return; const t = setTimeout(...1500); ... }, [step])
  useEffect(() => {
    if (step !== 'splash') return;
    const timer = setTimeout(() => setStep('welcome'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [step]);

  // Android hardware back: the step machine is local state invisible to
  // the router, so without this, back on any internal step would exit
  // `/onboarding` entirely instead of stepping back one screen. 'welcome'
  // (the first real step) intentionally falls through to default behavior.
  useEffect(() => {
    const goBackOneStep = (): boolean => {
      if (step === 'business') {
        setStep('welcome');
        return true;
      }
      if (step === 'security') {
        setStep('business');
        return true;
      }
      if (step === 'done') {
        setStep('security');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', goBackOneStep);
    return () => sub.remove();
  }, [step]);

  const goToBusinessStep = useCallback(() => setStep('business'), []);

  const updateBusinessField = useCallback(<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    setBusiness((current) => ({ ...current, [key]: value }));
  }, []);

  // web: submitBusiness — validates name, writes settings.business, advances to 'security'
  const submitBusiness = useCallback(() => {
    const error = validateBusinessProfile(business);
    if (error) {
      setBusinessError(error);
      return false;
    }
    setBusinessError('');
    setStep('security');
    return true;
  }, [business]);

  const setLockMode = useCallback((mode: LockMode) => {
    setSecurity((current) => ({ ...current, mode, pin: mode === 'pin' ? current.pin : '' }));
  }, []);

  // web: onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
  const setPin = useCallback((raw: string) => {
    setSecurity((current) => ({ ...current, pin: raw.replace(/\D/g, '').slice(0, 4) }));
  }, []);

  const securityValid = useMemo(() => isSecurityValid(security), [security]);

  const completeSecurityStep = useCallback(() => {
    if (!securityValid) return false;
    setStep('done');
    return true;
  }, [securityValid]);

  const currencySymbol = CURRENCY_SYMBOLS[business.currency];

  const draft: OnboardingDraft = useMemo(() => ({ business, security }), [business, security]);

  return {
    step,
    business,
    businessError,
    security,
    securityValid,
    currencySymbol,
    draft,
    goToBusinessStep,
    updateBusinessField,
    submitBusiness,
    setLockMode,
    setPin,
    completeSecurityStep,
  };
}
