import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, formatFull, isDateOnly, todayKst, toDateOnly, type DateOnly } from '@/domain/date-only';

import { useColors } from '../theme';
import { radius, spacing } from '../tokens';

import { Icon, type IconName } from './Icon';
import { PrimaryButton, SecondaryButton, softShadow } from './primitives';

export function BottomSheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="닫기" />
      <View style={{ backgroundColor: c.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, 20), maxHeight: '85%' }}>
        {title ? <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 18, fontWeight: '700', marginBottom: spacing.md }}>{title}</Text> : null}
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </Modal>
  );
}

export interface SheetOption<T> {
  value: T;
  label: string;
  hint?: string;
  icon?: IconName;
  danger?: boolean;
}

export function OptionSheet<T>({ visible, onClose, title, options, value, onSelect }: { visible: boolean; onClose: () => void; title?: string; options: SheetOption<T>[]; value?: T; onSelect: (value: T) => void }) {
  const c = useColors();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              onClose();
              onSelect(o.value);
            }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 54, opacity: pressed ? 0.6 : 1 })}>
            {o.icon ? <Icon name={o.icon} size={22} color={o.danger ? c.alertText : c.ink} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={{ color: o.danger ? c.alertText : c.ink, fontSize: 16, fontWeight: selected ? '700' : '500' }}>{o.label}</Text>
              {o.hint ? <Text style={{ color: c.sub, fontSize: 13, marginTop: 2 }}>{o.hint}</Text> : null}
            </View>
            {selected ? <Icon name="check" size={20} color={c.green} /> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 달력 시트. 기본값을 계산해 넣지 않으며, 사용자가 고른 날짜만 돌려준다. */
export function CalendarSheet({ visible, onClose, title, value, onSelect, onClear }: { visible: boolean; onClose: () => void; title: string; value?: DateOnly; onSelect: (date: DateOnly) => void; onClear?: () => void }) {
  const c = useColors();
  const today = todayKst();
  const base = value && isDateOnly(value) ? value : today;
  const [cursor, setCursor] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) });
  const [lastBase, setLastBase] = useState(base);
  if (lastBase !== base) {
    setLastBase(base);
    setCursor({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) });
  }
  const first = toDateOnly(cursor.y, cursor.m, 1)!;
  const leading = new Date(`${first}T00:00:00Z`).getUTCDay();
  const cells: (DateOnly | null)[] = Array.from({ length: leading }, () => null);
  for (let d = first; d.slice(5, 7) === first.slice(5, 7); d = addDays(d, 1)) cells.push(d);
  const move = (delta: number) => setCursor(({ y, m }) => (m + delta < 1 ? { y: y - 1, m: 12 } : m + delta > 12 ? { y: y + 1, m: 1 } : { y, m: m + delta }));

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={12} onPress={() => move(-1)} style={{ padding: 6 }}>
          <Icon name="back" size={20} />
        </Pressable>
        <Text style={{ color: c.ink, fontSize: 16, fontWeight: '700' }}>
          {cursor.y}년 {cursor.m}월
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={12} onPress={() => move(1)} style={{ padding: 6 }}>
          <Icon name="chevron" size={20} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((d) => (
          <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', color: c.sub, fontSize: 12, marginBottom: 6 }}>
            {d}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((date, i) => {
          if (!date) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
          const selected = date === value;
          const isToday = date === today;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={formatFull(date)}
              accessibilityState={{ selected }}
              onPress={() => {
                onClose();
                onSelect(date);
              }}
              style={{ width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.primary : 'transparent', borderWidth: isToday && !selected ? 1 : 0, borderColor: c.green }}>
                <Text style={{ color: selected ? c.onPrimary : c.ink, fontSize: 15 }}>{Number(date.slice(8, 10))}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {onClear ? (
        <View style={{ marginTop: spacing.md }}>
          <SecondaryButton
            label="날짜 지우기"
            onPress={() => {
              onClose();
              onClear();
            }}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}

/** 보드의 날짜 행(달력 아이콘 + 라벨 + 큰 날짜 + chevron) */
export function DateRow({ label, value, placeholder = '날짜 선택', onPress, hint }: { label: string; value?: DateOnly; placeholder?: string; onPress: () => void; hint?: string }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${value ? formatFull(value) : placeholder}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, opacity: pressed ? 0.7 : 1, marginBottom: 10, ...softShadow })}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="calendar" size={20} />
          <Text style={{ color: c.ink, fontSize: 15, fontWeight: '500' }}>{label}</Text>
        </View>
        <Text style={{ color: value ? c.ink : c.hint, fontSize: 19, fontWeight: value ? '600' : '400', marginTop: 6, marginLeft: 2 }}>{value ? formatFull(value) : placeholder}</Text>
        {hint ? <Text style={{ color: c.sub, fontSize: 12, marginTop: 4, marginLeft: 2 }}>{hint}</Text> : null}
      </View>
      <Icon name="chevron" size={18} color={c.hint} />
    </Pressable>
  );
}

export { PrimaryButton };
