import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useStyles } from '../theme';
import { HIT_SLOP, radius, spacing, type Colors } from '../tokens';

import { Icon, type IconName } from './Icon';

export const softShadow = {
  shadowColor: '#7C7264',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }, style]}>{children}</View>;
}

/** 스크롤 영역 + 하단 고정 버튼(보드의 검정 pill 버튼 배치). */
export function ScreenScroll({ children, footer, contentStyle }: { children: ReactNode; footer?: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingHorizontal: spacing.xl, paddingBottom: footer ? 110 : 32 }, contentStyle]}>
        {children}
      </ScrollView>
      {footer ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.background }}>{footer}</View> : null}
    </View>
  );
}

interface HeaderProps {
  title?: string;
  align?: 'center' | 'left';
  onBack?: () => void;
  hideBack?: boolean;
  right?: ReactNode;
}

export function Header({ title, align = 'center', onBack, hideBack, right }: HeaderProps) {
  const s = useStyles(headerStyles);
  const router = useRouter();
  return (
    <View style={s.row}>
      <View style={s.side}>
        {hideBack ? null : <IconButton icon="back" label="뒤로" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.navigate('/')))} />}
      </View>
      <Text accessibilityRole="header" numberOfLines={1} style={[s.title, align === 'left' ? s.titleLeft : s.titleCenter]}>
        {title}
      </Text>
      <View style={[s.side, s.right]}>{right}</View>
    </View>
  );
}

const headerStyles = (c: Colors) =>
  StyleSheet.create({
    row: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg },
    side: { minWidth: 40, flexDirection: 'row', alignItems: 'center' },
    right: { justifyContent: 'flex-end' },
    title: { flex: 1, color: c.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
    titleCenter: { textAlign: 'center' },
    titleLeft: { marginLeft: spacing.lg },
  });

export function IconButton({ icon, label, onPress, size = 26, color }: { icon: IconName; label: string; onPress: () => void; size?: number; color?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={HIT_SLOP} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}>
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, icon, disabled, loading }: { label: string; onPress: () => void; icon?: IconName; disabled?: boolean; loading?: boolean }) {
  const c = useColors();
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: radius.pill,
        backgroundColor: c.primary,
        opacity: off ? 0.4 : pressed ? 0.85 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: spacing.xl,
      })}>
      {loading ? <ActivityIndicator color={c.onPrimary} /> : icon ? <Icon name={icon} size={20} color={c.onPrimary} /> : null}
      <Text style={{ color: c.onPrimary, fontSize: 17, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, danger, disabled }: { label: string; onPress: () => void; icon?: IconName; danger?: boolean; disabled?: boolean }) {
  const c = useColors();
  const color = danger ? c.alertText : c.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: radius.pill,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: spacing.lg,
      })}>
      {icon ? <Icon name={icon} size={18} color={color} /> : null}
      <Text style={{ color, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress, label }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string }) {
  const c = useColors();
  const base: ViewStyle = { backgroundColor: c.surface, borderRadius: radius.lg, ...softShadow };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [base, style, pressed && { opacity: 0.75 }]}>
      {children}
    </Pressable>
  );
}

export function SectionHeader({ title, trailing, onPress }: { title: string; trailing?: string; onPress?: () => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: spacing.md }}>
      <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 }}>
        {title}
      </Text>
      {trailing ? (
        <Pressable onPress={onPress} disabled={!onPress} hitSlop={HIT_SLOP} accessibilityRole={onPress ? 'button' : 'text'} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ color: c.sub, fontSize: 14 }}>{trailing}</Text>
          {onPress ? <Icon name="chevron" size={14} color={c.sub} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

export interface TabItem<T extends string> {
  key: T;
  label: string;
}

/** 보드의 밑줄 탭 */
export function UnderlineTabs<T extends string>({ tabs, value, onChange, stretch }: { tabs: TabItem<T>[]; value: T; onChange: (key: T) => void; stretch?: boolean }) {
  const c = useColors();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.line, marginHorizontal: spacing.xl, gap: stretch ? 0 : 18 }}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            style={{ paddingVertical: 10, alignItems: 'center', flex: stretch ? 1 : undefined, borderBottomWidth: 2, marginBottom: -1, borderBottomColor: active ? c.ink : 'transparent' }}>
            <Text numberOfLines={1} style={{ color: active ? c.ink : c.hint, fontSize: 15, fontWeight: active ? '700' : '500' }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 보드의 보관 방법 칩 */
export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  const c = useColors();
  const color = selected ? c.ink : c.hint;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        backgroundColor: selected ? c.greenSoft : c.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.7 : 1,
        ...softShadow,
      })}>
      {icon ? <Icon name={icon} size={18} color={color} /> : null}
      <Text style={{ color, fontSize: 15, fontWeight: selected ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={{ color: c.ink, fontSize: 18, fontWeight: '700', marginTop: 22, marginBottom: 10, letterSpacing: -0.3 }}>{children}</Text>;
}

export function TextField(props: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  label?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <TextInput
      value={props.value}
      onChangeText={props.onChangeText}
      placeholder={props.placeholder}
      placeholderTextColor={c.hint}
      accessibilityLabel={props.label ?? props.placeholder}
      keyboardType={props.keyboardType}
      multiline={props.multiline}
      autoCapitalize={props.autoCapitalize}
      style={[
        {
          minHeight: props.multiline ? 84 : 52,
          backgroundColor: c.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          color: c.ink,
          fontSize: 16,
          textAlignVertical: props.multiline ? 'top' : 'center',
          ...softShadow,
        },
        props.style as object,
      ]}
    />
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '500' }}>{label}</Text>
        {hint ? <Text style={{ color: c.sub, fontSize: 13, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: c.green, false: c.line }} />
    </View>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99, suffix = '', label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string; label: string }) {
  const c = useColors();
  const box: ViewStyle = { width: 34, height: 34, borderRadius: 17, backgroundColor: c.neutralBg, alignItems: 'center', justifyContent: 'center' };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityLabel={`${label} ${value}${suffix}`}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} 줄이기`} disabled={value <= min} hitSlop={6} onPress={() => onChange(value - 1)} style={[box, value <= min && { opacity: 0.4 }]}>
        <Icon name="minus" size={16} />
      </Pressable>
      <Text style={{ color: c.ink, fontSize: 15, fontWeight: '700', minWidth: 44, textAlign: 'center' }}>
        {value}
        {suffix}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} 늘리기`} disabled={value >= max} hitSlop={6} onPress={() => onChange(value + 1)} style={[box, value >= max && { opacity: 0.4 }]}>
        <Icon name="plus" size={16} />
      </Pressable>
    </View>
  );
}

export function InfoNote({ children, icon = 'info' }: { children: ReactNode; icon?: IconName }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md, alignItems: 'flex-start' }}>
      <Icon name={icon} size={16} color={c.sub} />
      <Text style={{ flex: 1, color: c.sub, fontSize: 13, lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

export function RowLink({ label, hint, onPress, icon, danger }: { label: string; hint?: string; onPress: () => void; icon?: IconName; danger?: boolean }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: spacing.md, paddingVertical: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
      {icon ? <Icon name={icon} size={20} color={danger ? c.alertText : c.ink} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? c.alertText : c.ink, fontSize: 16, fontWeight: '500' }}>{label}</Text>
        {hint ? <Text style={{ color: c.sub, fontSize: 13, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      <Icon name="chevron" size={18} color={c.hint} />
    </Pressable>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 6 }}>
      <Text style={{ color: c.ink, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
      {hint ? <Text style={{ color: c.sub, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{hint}</Text> : null}
    </View>
  );
}
