import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, EmptyState, FieldLabel, Header, ILLUSTRATIONS, InfoNote, PrimaryButton, RecipeRowCard, Screen, ScreenScroll, spacing, useStyles, type Colors } from '@/design-system';
import { todayKst } from '@/domain/date-only';
import { matchRecipes, type RecipeMatch } from '@/features/fridge-matching/recipe-matcher';
import { SAFETY_COPY } from '@/features/food-safety/safety-copy';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';

const TIME_FILTERS = [undefined, 15, 30] as const;

export default function FridgePickScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { settings } = useAppState();
  const today = todayKst();
  const [settledOnly, setSettledOnly] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState<number>();
  const [excluded, setExcluded] = useState<string[]>([]);

  const { data } = useLoader(async () => ({
    recipes: await recipeRepository.list(db),
    ingredients: await recipeRepository.allIngredients(db),
    items: await inventoryRepository.listActive(db),
    synonyms: await settingsRepository.getSynonyms(db),
  }));

  const matches = useMemo(
    () => (data ? matchRecipes(data.recipes, data.ingredients, data.items, { today, leadDays: settings.reminderLeadDays, settledOnly, maxMinutes, excludedIngredients: excluded, userSynonyms: data.synonyms }) : []),
    [data, today, settings.reminderLeadDays, settledOnly, maxMinutes, excluded],
  );
  const top = matches[0];
  const rest = matches.slice(1);
  const ready = rest.filter((m) => m.isReady);
  const needsMore = rest.filter((m) => !m.isReady);
  const open = (m: RecipeMatch) => router.push({ pathname: '/recipes/[id]', params: { id: m.recipe.id } });

  return (
    <Screen>
      <Header title="냉장고 파먹기" align="left" />
      <ScreenScroll footer={top ? <PrimaryButton label="레시피 보기" onPress={() => open(top)} /> : undefined}>
        <Image source={ILLUSTRATIONS.fridgeCheck} style={s.illustration} contentFit="contain" accessibilityLabel="냉장고 일러스트" />
        <Text accessibilityRole="header" style={s.title}>
          지금은 이걸로 어때요?
        </Text>
        <Text style={s.subtitle}>{'날짜가 가까운 재료를 쓰는\n내 레시피를 먼저 보여 드려요'}</Text>

        {top ? (
          <>
            <RecipeRowCard recipe={top.recipe} imageWidth="38%" onPress={() => open(top)} />
            <Reasons match={top} />
          </>
        ) : (
          <EmptyState title="추천할 레시피가 아직 없어요" hint="재료가 겹치는 내 레시피를 찾지 못했어요. 식재료나 레시피를 등록해 보세요." />
        )}

        <FieldLabel>조건</FieldLabel>
        <View style={s.chips}>
          <Chip label="정착 레시피만" selected={settledOnly} onPress={() => setSettledOnly((v) => !v)} />
          {TIME_FILTERS.map((minutes) => (
            <Chip key={minutes ?? 'all'} label={minutes ? `${minutes}분 이내` : '시간 상관없이'} selected={maxMinutes === minutes} onPress={() => setMaxMinutes(minutes)} />
          ))}
        </View>
        {data?.items.length ? (
          <>
            <FieldLabel>쓰고 싶지 않은 재료</FieldLabel>
            <View style={s.chips}>
              {[...new Set(data.items.map((i) => i.name))].map((name) => (
                <Chip key={name} label={name} selected={excluded.includes(name)} onPress={() => setExcluded((list) => (list.includes(name) ? list.filter((x) => x !== name) : [...list, name]))} />
              ))}
            </View>
          </>
        ) : null}

        {ready.length > 0 ? (
          <>
            <FieldLabel>지금 있는 재료로 만들 수 있어요</FieldLabel>
            {ready.map((m) => (
              <View key={m.recipe.id} style={s.item}>
                <RecipeRowCard recipe={m.recipe} imageWidth="38%" onPress={() => open(m)} />
                <Reasons match={m} />
              </View>
            ))}
          </>
        ) : null}
        {needsMore.length > 0 ? (
          <>
            <FieldLabel>재료를 조금 더 준비하면 돼요</FieldLabel>
            {needsMore.map((m) => (
              <View key={m.recipe.id} style={s.item}>
                <RecipeRowCard recipe={m.recipe} imageWidth="38%" onPress={() => open(m)} />
                <Reasons match={m} />
              </View>
            ))}
          </>
        ) : null}

        <InfoNote>{SAFETY_COPY.fridgePickNote}</InfoNote>
        <InfoNote>재고에 없다고 집에 없다는 뜻은 아니에요. 등록하지 않은 재료는 `미등록`으로 표시해요.</InfoNote>
      </ScreenScroll>
    </Screen>
  );
}

function Reasons({ match }: { match: RecipeMatch }) {
  const s = useStyles(styles);
  return (
    <View style={s.reasons}>
      {match.reasons.map((reason) => (
        <Text key={reason} style={s.reason}>
          · {reason}
        </Text>
      ))}
      {match.unregistered.length > 0 ? <Text style={s.reason}>· 미등록 재료: {match.unregistered.join(', ')}</Text> : null}
      {match.insufficient.length > 0 ? <Text style={s.reason}>· 양이 부족할 수 있어요: {match.insufficient.join(', ')}</Text> : null}
      {match.uncounted.length > 0 ? <Text style={s.reason}>· 집에 있는지 확인: {match.uncounted.join(', ')}</Text> : null}
    </View>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    illustration: { width: 220, height: 212, alignSelf: 'center', backgroundColor: c.imagePlate, borderRadius: 24 },
    title: { color: c.ink, fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: spacing.md, letterSpacing: -0.5 },
    subtitle: { color: c.sub, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    item: { marginBottom: spacing.lg },
    reasons: { marginTop: spacing.sm, gap: 2 },
    reason: { color: c.sub, fontSize: 13, lineHeight: 19 },
  });
