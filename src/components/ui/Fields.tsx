/**
 * Ported from the web reference's src/components/ui/Fields.tsx —
 * Field/Input/SearchInput (Stage A), Textarea/Select/Segmented/Toggle
 * (parity patch). All label/value text now renders through AppText per
 * the typography lock — see AppText.tsx for why.
 *
 * Select: web uses a native <select>, which has no RN equivalent. Per
 * instruction, this uses the project's own AppSheet picker pattern instead
 * (the same shape as ProductPicker/party-selection sheets in the web app) —
 * a trigger styled like Input, opening a sheet listing the options.
 *
 * Every TextInput here has `allowFontScaling={false}` (and omits the prop
 * from its own type, so callers can't re-enable it) for the same reason
 * AppText locks it — see AppText.tsx.
 */
import React, { useState } from 'react';
import { AlertCircle, Check, ChevronDown, Search, X } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../../theme';
import { AppSheet } from './AppSheet';
import { AppText } from './AppText';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Field({ label, hint, error, required, children, style }: FieldProps) {
  return (
    <View style={style}>
      <View style={styles.labelRow}>
        <AppText size={13} weight="semibold" color={colors.ink[700]}>
          {label}
        </AppText>
        {required && (
          <AppText size={13} weight="semibold" color={colors.bad[500]}>
            *
          </AppText>
        )}
      </View>
      {children}
      {error ? (
        <View style={styles.messageRow}>
          <AlertCircle size={14} color={colors.bad[600]} style={{ marginTop: 1 }} />
          <AppText size={12.5} weight="medium" color={colors.bad[600]} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText size={12.5} color={colors.ink[400]} style={styles.hintText}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

interface InputProps extends Omit<TextInputProps, 'allowFontScaling'> {
  invalid?: boolean;
  prefix?: string;
}

export function Input({ invalid, prefix, style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = invalid ? colors.bad[500] : focused ? colors.brand[500] : colors.ink[200];

  if (prefix) {
    return (
      <View style={[styles.prefixWrap, { borderColor }]}>
        <AppText size={15} weight="semibold" color={colors.ink[400]} style={styles.prefixText}>
          {prefix}
        </AppText>
        <TextInput
          {...rest}
          allowFontScaling={false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.ink[400]}
          style={[styles.prefixInput, styles.inputTypography, style]}
        />
      </View>
    );
  }

  return (
    <TextInput
      {...rest}
      allowFontScaling={false}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      placeholderTextColor={colors.ink[400]}
      style={[styles.input, styles.inputTypography, { borderColor }, style]}
    />
  );
}

interface SearchInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchInput({ value, onChangeText, placeholder = 'Search...', onClear, style }: SearchInputProps) {
  return (
    <View style={[styles.searchWrap, style]}>
      <Search size={18} color={colors.ink[400]} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink[400]}
        accessibilityLabel={placeholder}
        allowFontScaling={false}
        style={[styles.searchInput, styles.inputTypography]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.searchClear}
        >
          <X size={16} color={colors.ink[400]} />
        </Pressable>
      )}
    </View>
  );
}

interface TextareaProps extends Omit<TextInputProps, 'allowFontScaling'> {
  invalid?: boolean;
}

export function Textarea({ invalid, style, onFocus, onBlur, ...rest }: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = invalid ? colors.bad[500] : focused ? colors.brand[500] : colors.ink[200];

  return (
    <TextInput
      {...rest}
      allowFontScaling={false}
      multiline
      textAlignVertical="top"
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      placeholderTextColor={colors.ink[400]}
      style={[styles.textarea, styles.inputTypography, { borderColor }, style]}
    />
  );
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  sheetTitle?: string;
  style?: StyleProp<ViewStyle>;
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  invalid,
  disabled,
  placeholder = 'Select...',
  sheetTitle = 'Choose an option',
  style,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const borderColor = invalid ? colors.bad[500] : colors.ink[200];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={sheetTitle}
        style={[styles.selectTrigger, { borderColor }, disabled && styles.selectTriggerDisabled, style]}
      >
        <AppText size={15} color={selected ? colors.ink.DEFAULT : colors.ink[400]} numberOfLines={1} style={styles.selectValue}>
          {selected?.label ?? placeholder}
        </AppText>
        <ChevronDown size={16} color={colors.ink[500]} />
      </Pressable>
      <AppSheet open={open} onClose={() => setOpen(false)} title={sheetTitle}>
        <View style={styles.selectOptions}>
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.selectOptionRow, pressed && styles.selectOptionRowPressed]}
              >
                <AppText size={14.5} weight={isSelected ? 'bold' : 'semibold'} color={isSelected ? colors.brand[700] : colors.ink.DEFAULT}>
                  {o.label}
                </AppText>
                {isSelected && <Check size={18} color={colors.brand[600]} />}
              </Pressable>
            );
          })}
        </View>
      </AppSheet>
    </>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function Segmented<T extends string>({ options, value, onChange, style }: SegmentedProps<T>) {
  return (
    <View style={[styles.segmented, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const isSelected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={[styles.segmentedOption, isSelected && styles.segmentedOptionActive]}
          >
            <AppText size={13} weight="semibold" color={isSelected ? colors.ink.DEFAULT : colors.ink[500]}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(checked ? 24 : 4, { duration: 150 }) }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[styles.toggleTrack, { backgroundColor: checked ? colors.brand[600] : colors.ink[200] }]}
    >
      <Animated.View style={[styles.toggleThumb, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginBottom: spacing[1.5] },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[1.5], marginTop: spacing[1.5] },
  errorText: { flexShrink: 1 },
  hintText: { marginTop: spacing[1.5] },
  // shared TextInput typography — TextInput can't render AppText, so this
  // is the one place font tokens are applied via style instead of the
  // component, kept centralized here rather than repeated per input.
  inputTypography: { fontSize: 15, color: colors.ink.DEFAULT, fontFamily: 'Inter_400Regular' },
  input: {
    height: spacing[12],
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3.5],
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing[12],
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingLeft: spacing[3.5],
  },
  prefixText: { marginRight: spacing[1] },
  prefixInput: { flex: 1, height: '100%', paddingRight: spacing[3.5] },
  searchWrap: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: spacing[3.5], zIndex: 1 },
  searchInput: {
    height: spacing[12],
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
    paddingLeft: spacing[10],
    paddingRight: spacing[10],
  },
  searchClear: {
    position: 'absolute',
    right: spacing[2.5],
    padding: spacing[1.5],
    borderRadius: radius.lg,
  },
  textarea: {
    width: '100%',
    minHeight: 88,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[3],
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: spacing[12],
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3.5],
  },
  // web: native <select disabled> — no explicit disabled style there,
  // just reduced opacity like the platform default.
  selectTriggerDisabled: { opacity: 0.5 },
  selectValue: { flexShrink: 1 },
  // minHeight only stops the sheet's dynamic sizing from collapsing when
  // there are 0-2 options (e.g. categories still loading, or a short
  // list) — a longer list already exceeds this and grows/scrolls as
  // normal, capped by AppSheet's own maxDynamicContentSize.
  selectOptions: { gap: spacing[2], minHeight: 300 },
  selectOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink[200],
    padding: spacing[3],
  },
  selectOptionRowPressed: { backgroundColor: colors.ink[50] },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: radius.xl,
    backgroundColor: colors.ink[100],
    padding: spacing[1],
  },
  segmentedOption: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
  },
  segmentedOptionActive: {
    backgroundColor: colors.white,
    ...shadows.card,
  },
  toggleTrack: {
    height: spacing[7],
    width: spacing[12],
    borderRadius: radius.full,
    justifyContent: 'center',
  },
  toggleThumb: {
    position: 'absolute',
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    ...shadows.card,
  },
});
