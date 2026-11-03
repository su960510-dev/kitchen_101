import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import type { FoodInventoryItem, Recipe } from '@/domain/models';
import { DATE_TYPE_LABELS } from '@/features/food-safety/date-policy';
import { daysLeftLabel } from '@/features/food-safety/safety-copy';
import { computeStatus } from '@/features/food-safety/status-calculator';

import { SAMPLE_ASSETS } from '../sample-assets';
import { useColors } from '../theme';
import { radius, spacing } from '../tokens';

import { GroupIcon, Icon } from './Icon';
import { softShadow } from './primitives';
import { formatMonthDay, type DateOnly } from '@/domain/date-only';
import { groupOfCategory } from '@/domain/models';

/** 사용자 사진 경로가 사라졌거나 읽을 수 없으면 대체 내용을 보여 주고 크래시하지 않는다. */
export function AppImage({ uri, assetKey, style, fallback, contain, label }: { uri?: string; assetKey?: string; style?: StyleProp<ImageStyle>; fallback?: ReactNode; contain?: boolean; label?: string }) {
  const key = uri ?? assetKey;
  const [failedKey, setFailedKey] = useState<string>();
  const failed = failedKey === key;
  const source = uri ? { uri } : assetKey ? SAMPLE_ASSETS[assetKey] : undefined;
  if (!source || failed) return <>{fallback ?? null}</>;
  return (
    <Image
      source={source as never}
      style={style as never}
      contentFit={contain ? 'contain' : 'cover'}
      onError={() => setFailedKey(key)}
      accessibilityLabel={label}
      accessible={!!label}
    />
  );
}

export function FoodThumb({ item, size = 64 }: { item: Pick<FoodInventoryItem, 'localPhotoUri' | 'sampleAssetKey' | 'category' | 'name'>; size?: number }) {
  const c = useColors();
  const fallback = (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.neutralBg, alignItems: 'center', justifyContent: 'center' }}>
      <GroupIcon group={groupOfCategory(item.category)} size={size * 0.56} />
    </View>
  );
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: item.sampleAssetKey ? c.imagePlate : 'transparent' }}>
      <AppImage uri={item.localPhotoUri} assetKey={item.sampleAssetKey} contain={!item.localPhotoUri} style={{ width: size, height: size }} fallback={fallback} />
    </View>
  );
}

export function SampleBadge() {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.neutralBg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }} accessibilityLabel="예시 데이터">
      <Text style={{ color: c.neutralText, fontSize: 11, fontWeight: '600' }}>예시</Text>
    </View>
  );
}

export function MomBadge() {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.greenSoft, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ color: c.greenDark, fontSize: 11, fontWeight: '600' }}>엄마표</Text>
    </View>
  );
}

type PillTone = 'soon' | 'neutral' | 'personal' | 'expired';

export function Pill({ text, tone, withIcon }: { text: string; tone: PillTone; withIcon?: boolean }) {
  const c = useColors();
  const map: Record<PillTone, [string, string]> = {
    soon: [c.soonBg, c.soonText],
    neutral: [c.neutralBg, c.neutralText],
    personal: [c.personalBg, c.personalText],
    expired: [c.expiredBg, c.expiredText],
  };
  const [bg, fg] = map[tone];
  const icon = tone === 'expired' ? 'alert' : tone === 'personal' ? 'bell' : 'clock';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      {withIcon ? <Icon name={icon} size={12} color={fg} strokeWidth={2.2} /> : null}
      <Text style={{ color: fg, fontSize: 13, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

/** 색만으로 구분하지 않도록 상태 문구·아이콘을 함께 쓰고, 개인 알림은 `내 알림`으로 표기한다. */
export function describeItemDate(item: FoodInventoryItem, today: DateOnly, leadDays: number): { line: string; pill: { text: string; tone: PillTone; withIcon: boolean } | null } {
  const s = computeStatus(item, today, leadDays);
  if (s.labelDaysLeft != null && item.labelDate && item.labelDateType) {
    const tone: PillTone = s.labelDaysLeft < 0 ? 'expired' : s.all.includes('LABEL_DATE_SOON') || s.labelDaysLeft === 0 ? 'soon' : 'neutral';
    return {
      line: `${DATE_TYPE_LABELS[item.labelDateType]} ${formatMonthDay(item.labelDate)}`,
      pill: { text: daysLeftLabel(s.labelDaysLeft), tone, withIcon: tone !== 'neutral' },
    };
  }
  if (s.reminderDaysLeft != null && item.personalReminderDate) {
    return {
      line: `내 관리 알림 ${formatMonthDay(item.personalReminderDate)}`,
      pill: { text: `내 알림 ${daysLeftLabel(s.reminderDaysLeft)}`, tone: 'personal', withIcon: true },
    };
  }
  if (s.all.includes('DATE_UNCONFIRMED')) return { line: '날짜 종류 확인 필요', pill: { text: '확인 필요', tone: 'neutral', withIcon: false } };
  return { line: item.isMomSideDish && item.receivedDate ? `받은 날짜 ${formatMonthDay(item.receivedDate)}` : '날짜 미등록', pill: null };
}

export function InventoryRow({ item, today, leadDays, onPress }: { item: FoodInventoryItem; today: DateOnly; leadDays: number; onPress: () => void }) {
  const c = useColors();
  const { line, pill } = describeItemDate(item, today, leadDays);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${line}${pill ? `, ${pill.text}` : ''}${item.isSample ? ', 예시 데이터' : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: 10, paddingLeft: 12, paddingRight: 12, marginBottom: 12, opacity: pressed ? 0.75 : 1, ...softShadow })}>
      <FoodThumb item={item} size={60} />
      <View style={{ flex: 1, marginLeft: 12, gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text numberOfLines={1} style={{ color: c.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 }}>
            {item.name}
          </Text>
          {item.isMomSideDish ? <MomBadge /> : null}
          {item.isSample ? <SampleBadge /> : null}
        </View>
        <Text numberOfLines={1} style={{ color: c.sub, fontSize: 14 }}>
          {line}
        </Text>
      </View>
      {pill ? <Pill {...pill} /> : null}
      <View style={{ marginLeft: 6 }}>
        <Icon name="chevron" size={18} color={c.hint} />
      </View>
    </Pressable>
  );
}

/** 보드의 임박 배너. 만료를 단정하지 않고 표시 날짜를 안내한다. */
export function AlertBanner({ title, subtitle, onPress, variant, imageKey, imageUri }: { title: string; subtitle: string; onPress: () => void; variant: 'home' | 'list'; imageKey?: string; imageUri?: string }) {
  const c = useColors();
  const home = variant === 'home';
  const iconSize = home ? 34 : 44;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${subtitle}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: home ? c.surface : c.alertBg,
        borderRadius: radius.lg,
        minHeight: home ? 110 : 80,
        paddingLeft: spacing.lg,
        overflow: 'hidden',
        opacity: pressed ? 0.8 : 1,
        ...softShadow,
      })}>
      <View style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: c.alertIcon, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="clock" size={iconSize * 0.72} color="#fff" strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, marginLeft: 12, gap: 4, paddingVertical: 12, paddingRight: home ? 4 : 0 }}>
        <Text numberOfLines={2} style={{ color: home ? c.ink : c.alertText, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
          {title}
        </Text>
        <Text numberOfLines={1} style={{ color: c.sub, fontSize: 13 }}>
          {subtitle}
        </Text>
      </View>
      {home ? (
        <View style={{ backgroundColor: c.imagePlate, alignSelf: 'stretch' }}>
          <AppImage uri={imageUri} assetKey={imageKey} contain={!imageUri} style={{ width: 112, height: 124, marginRight: -6, marginBottom: -8 }} />
        </View>
      ) : (
        <View style={{ paddingRight: spacing.md }}>
          <Icon name="chevron" size={20} color={c.sub} />
        </View>
      )}
    </Pressable>
  );
}

export function recipeImageKey(recipe: Pick<Recipe, 'sampleAssetKey'>): string | undefined {
  return recipe.sampleAssetKey;
}

export function recipeMeta(recipe: Pick<Recipe, 'baseServings' | 'prepMinutes' | 'cookMinutes'>): string {
  const minutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  return minutes > 0 ? `${recipe.baseServings}인분 · ${minutes}분` : `${recipe.baseServings}인분`;
}

/** 보드의 가로 레시피 카드(왼쪽 사진 + 제목 + 인분·시간) */
export function RecipeRowCard({ recipe, onPress, note, imageWidth = '46%' }: { recipe: Recipe; onPress: () => void; note?: string; imageWidth?: `${number}%` }) {
  const c = useColors();
  const placeholder = (
    <View style={{ flex: 1, backgroundColor: c.neutralBg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="chef-filled" size={34} color={c.hint} />
    </View>
  );
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${recipe.title}, ${recipeMeta(recipe)}`} style={({ pressed }) => ({ flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.lg, overflow: 'hidden', opacity: pressed ? 0.8 : 1, ...softShadow })}>
      <View style={{ width: imageWidth, minHeight: 136 }}>
        <AppImage uri={recipe.imageUri} assetKey={recipeImageKey(recipe)} style={{ width: '100%', height: '100%', position: 'absolute' }} fallback={placeholder} />
      </View>
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', gap: 8 }}>
        <Text numberOfLines={2} style={{ color: c.ink, fontSize: 16, fontWeight: '700', lineHeight: 22, letterSpacing: -0.3 }}>
          {recipe.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="timer" size={14} color={c.sub} />
          <Text style={{ color: c.sub, fontSize: 13 }}>{recipeMeta(recipe)}</Text>
          {recipe.isSample ? <SampleBadge /> : null}
        </View>
        {note ? <Text numberOfLines={2} style={{ color: c.sub, fontSize: 12, lineHeight: 17 }}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}
