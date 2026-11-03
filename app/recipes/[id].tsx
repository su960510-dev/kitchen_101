import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppImage, Card, EmptyState, FieldLabel, Header, Icon, IconButton, InfoNote, OptionSheet, PrimaryButton, SampleBadge, Screen, ScreenScroll, SecondaryButton, Stepper, ToggleRow, spacing, softShadow, useColors, useStyles, type Colors, type SheetOption } from '@/design-system';
import { formatFull } from '@/domain/date-only';
import { userMessageOf } from '@/domain/errors';
import type { FoodInventoryItem } from '@/domain/models';
import { normalizeIngredient } from '@/features/fridge-matching/ingredient-normalizer';
import { useQuantity as applyUse } from '@/features/inventory/inventory-service';
import { formatQuantity, scaleIngredients } from '@/features/recipes/recipe-scaling';
import { duplicateRecipe, logCooked, saveStepNotes, setSettled } from '@/features/recipes/recipe-service';
import { sourceHost } from '@/features/recipes/recipe-source-links';
import { SAFETY_COPY } from '@/features/food-safety/safety-copy';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';
import { confirmAction, notify } from '@/utils/dialogs';

type Menu = 'edit' | 'copy' | 'delete';

export default function RecipeDetailScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings, refresh } = useAppState();
  const { data, loading, reload } = useLoader(async () => ({ detail: await recipeRepository.get(db, id), stock: await inventoryRepository.listActive(db) }), [id]);
  const detail = data?.detail;
  const [servings, setServings] = useState<number>();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookedPanel, setCookedPanel] = useState(false);

  const target = servings ?? detail?.recipe.baseServings ?? settings.defaultServings;
  const scaled = useMemo(() => (detail ? scaleIngredients(detail.ingredients, detail.recipe.baseServings, target) : []), [detail, target]);

  if (!detail) {
    return (
      <Screen>
        <Header title="레시피" />
        {loading ? null : <EmptyState title="레시피를 찾을 수 없어요" />}
      </Screen>
    );
  }
  const { recipe } = detail;
  const minutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const heroKey = recipe.sampleAssetKey === 'fried-rice' ? 'fried-rice-hero' : recipe.sampleAssetKey;
  const hasNotesChanged = Object.keys(notes).length > 0;

  const run = async (task: () => Promise<unknown>) => {
    try {
      await task();
      refresh();
      reload();
    } catch (error) {
      notify(userMessageOf(error));
    }
  };

  const save = () =>
    run(async () => {
      if (recipe.isSample) {
        const copy = await duplicateRecipe(db, recipe.id);
        if (hasNotesChanged) {
          const copied = await recipeRepository.get(db, copy.id);
          const mapped: Record<string, string> = {};
          detail.steps.forEach((step, index) => {
            if (step.id in notes && copied?.steps[index]) mapped[copied.steps[index].id] = notes[step.id];
          });
          await saveStepNotes(db, copy.id, mapped);
        }
        notify('내 레시피로 저장했어요', '예시 레시피를 복제했어요. 이제 자유롭게 고칠 수 있어요.');
        router.replace({ pathname: '/recipes/[id]', params: { id: copy.id } });
        return;
      }
      await saveStepNotes(db, recipe.id, notes);
      setNotes({});
      notify('저장했어요');
    });

  const toggleSettled = (next: boolean) => run(() => setSettled(db, recipe.id, next));

  const onMenu = async (action: Menu) => {
    if (action === 'edit') router.push({ pathname: '/recipes/edit/[id]', params: { id: recipe.id } });
    if (action === 'copy') {
      await run(async () => {
        const copy = await duplicateRecipe(db, recipe.id);
        router.push({ pathname: '/recipes/[id]', params: { id: copy.id } });
      });
    }
    if (action === 'delete' && (await confirmAction('레시피 삭제', '메모와 기록도 함께 지워져요.', '삭제'))) {
      await recipeRepository.remove(db, recipe.id);
      refresh();
      router.back();
    }
  };
  const menu: SheetOption<Menu>[] = recipe.isSample
    ? [{ value: 'copy', label: '내 레시피로 복제', icon: 'note' }, { value: 'delete', label: '삭제', icon: 'trash', danger: true }]
    : [{ value: 'edit', label: '수정', icon: 'note' }, { value: 'copy', label: '복제', icon: 'plus' }, { value: 'delete', label: '삭제', icon: 'trash', danger: true }];

  const usedStock = detail.ingredients
    .map((ingredient) => data?.stock.find((item) => normalizeIngredient(item.name) === normalizeIngredient(ingredient.displayName)))
    .filter((item, index, list): item is FoodInventoryItem => !!item && item.quantity != null && !item.isSample && list.indexOf(item) === index);

  const openSource = async () => {
    if (!recipe.sourceUrl) return;
    if (!(await confirmAction('외부 사이트로 이동', `${sourceHost(recipe.sourceUrl)} 을(를) 열어요. 네트워크를 사용해요.`, '열기'))) return;
    try {
      await Linking.openURL(recipe.sourceUrl);
    } catch {
      notify('링크를 열지 못했어요', '링크 복사로 다른 앱에서 열어 보세요.');
    }
  };

  return (
    <Screen>
      <ScreenScroll contentStyle={{ paddingHorizontal: 0 }} footer={<PrimaryButton label="레시피 저장" onPress={save} />}>
        <View style={s.heroWrap}>
          <AppImage uri={recipe.imageUri} assetKey={heroKey} style={s.hero} fallback={<View style={[s.hero, s.heroEmpty]}><Icon name={recipe.sourceUrl ? 'link' : 'chef-filled'} size={48} color={c.hint} /></View>} label={recipe.title} />
          <View style={[s.corner, s.cornerLeft]}>
            <IconButton icon="back" label="뒤로" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/recipes'))} />
          </View>
          <View style={[s.corner, s.cornerRight]}>
            <IconButton icon={recipe.isSettled ? 'bookmark-filled' : 'bookmark'} label={recipe.isSettled ? '정착 해제' : '우리 집 정착 레시피로 표시'} onPress={() => toggleSettled(!recipe.isSettled)} />
          </View>
        </View>

        <View style={s.body}>
          <View style={s.titleRow}>
            <Text accessibilityRole="header" style={s.title}>
              {recipe.title}
            </Text>
            <IconButton icon="dots-vertical" label="레시피 메뉴" size={22} color={c.sub} onPress={() => setMenuOpen(true)} />
          </View>
          <View style={s.metaRow}>
            <Icon name="people" size={16} color={c.sub} />
            <Text style={s.meta}>{recipe.baseServings}인분</Text>
            {minutes > 0 ? (
              <>
                <Text style={s.meta}>·</Text>
                <Icon name="timer" size={16} color={c.sub} />
                <Text style={s.meta}>{minutes}분</Text>
              </>
            ) : null}
            {recipe.difficulty ? (
              <>
                <Text style={s.meta}>·</Text>
                <Icon name="level" size={16} color={c.sub} />
                <Text style={s.meta}>난이도 {recipe.difficulty}</Text>
              </>
            ) : null}
            {recipe.isSample ? <SampleBadge /> : null}
            {recipe.isSettled ? <MomBadgeLike /> : null}
          </View>

          {recipe.sourceUrl ? (
            <Card style={s.linkCard}>
              <Text style={s.linkTitle}>{recipe.userProvidedSourceTitle ?? '원본 링크'}</Text>
              <Text style={s.meta}>{sourceHost(recipe.sourceUrl)}</Text>
              {recipe.tags ? <Text style={s.meta}>#{recipe.tags}</Text> : null}
              <View style={s.linkActions}>
                <SecondaryButton label="원본 열기" icon="external" onPress={openSource} />
                <SecondaryButton
                  label="링크 복사"
                  icon="link"
                  onPress={async () => {
                    await Clipboard.setStringAsync(recipe.sourceUrl!);
                    notify('링크를 복사했어요');
                  }}
                />
              </View>
            </Card>
          ) : null}

          {recipe.note ? <InfoNote icon="note">{recipe.note}</InfoNote> : null}

          {detail.ingredients.length > 0 ? (
            <>
              <View style={s.sectionRow}>
                <Text accessibilityRole="header" style={s.section}>
                  필요한 재료
                </Text>
                <Stepper label="인원수" value={target} suffix="인분" onChange={setServings} />
              </View>
              <View style={s.ingredients}>
                {scaled.map(({ ingredient, displayAmount, needsRoundingCheck, roundedSuggestion, wasScaled }) => (
                  <View key={ingredient.id} style={s.ingredient}>
                    <AppImage assetKey={ingredient.sampleAssetKey} contain style={[s.ingredientImage, { backgroundColor: c.imagePlate, borderRadius: 8 }]} fallback={<View style={s.ingredientDot}><Text style={s.ingredientInitial}>{ingredient.displayName.slice(0, 1)}</Text></View>} />
                    <Text numberOfLines={1} style={s.ingredientName}>
                      {ingredient.displayName}
                    </Text>
                    <Text numberOfLines={1} style={s.ingredientAmount}>
                      {displayAmount}
                    </Text>
                    {wasScaled && ingredient.quantity != null ? (
                      <Text style={s.ingredientBase}>
                        기준 {formatQuantity(ingredient.quantity)}
                        {ingredient.unit ?? ''}
                      </Text>
                    ) : null}
                    {needsRoundingCheck ? <Text style={s.rounding}>약 {roundedSuggestion}{ingredient.unit}? 직접 확인</Text> : null}
                  </View>
                ))}
              </View>
              {target !== recipe.baseServings ? <InfoNote>계산 결과는 추천량이에요. 조리 시간·불 세기는 바꾸지 않았어요.</InfoNote> : null}
            </>
          ) : null}

          {detail.steps.length > 0 ? (
            <>
              <Text accessibilityRole="header" style={[s.section, { marginTop: 26, marginBottom: 12 }]}>
                조리 순서
              </Text>
              {detail.steps.map((step, index) => (
                <View key={step.id} style={s.step}>
                  <View style={s.stepHead}>
                    <View style={s.stepNumber}>
                      <Text style={s.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={s.stepText}>{step.instruction}</Text>
                  </View>
                  <TextInput
                    value={notes[step.id] ?? step.personalNote ?? ''}
                    onChangeText={(t) => setNotes((n) => ({ ...n, [step.id]: t }))}
                    placeholder="내 메모 (예: 중불 3분 더)"
                    placeholderTextColor={c.hint}
                    accessibilityLabel={`${index + 1}단계 내 메모`}
                    style={s.stepNote}
                  />
                </View>
              ))}
            </>
          ) : null}

          <FieldLabel>우리 집 기록</FieldLabel>
          <Card style={s.card}>
            <ToggleRow label="우리 집 정착 레시피" hint={recipe.settledAt ? `${recipe.settledAt.slice(0, 10)} 정착 · 내가 직접 정하는 표시예요` : '내가 직접 정하는 표시예요. 외부 평가가 아니에요.'} value={recipe.isSettled} onChange={toggleSettled} />
            <View style={s.cookRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.cookTitle}>만든 횟수 {detail.cookLogs.length}번</Text>
                <Text style={s.meta}>{detail.cookLogs[0] ? `마지막 ${formatFull(detail.cookLogs[0].cookedAt)}` : '아직 기록이 없어요'}</Text>
              </View>
              <SecondaryButton
                label="오늘 만들었어요"
                onPress={() =>
                  run(async () => {
                    await logCooked(db, recipe.id, target);
                    setCookedPanel(true);
                  })
                }
              />
            </View>
            {cookedPanel && usedStock.length > 0 ? (
              <View style={s.usedPanel}>
                <Text style={s.cookTitle}>쓴 재료를 냉장고에서 줄일까요?</Text>
                {usedStock.map((item) => (
                  <View key={item.id} style={s.usedRow}>
                    <Text style={s.meta}>
                      {item.name} · 남은 {item.quantity}
                      {item.unit ?? ''}
                    </Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${item.name} 1 사용`} onPress={() => run(() => applyUse(db, item.id, Math.min(1, item.quantity ?? 1)))} style={s.useChip}>
                      <Text style={s.useChipText}>1 사용</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          {detail.versions.length > 0 ? (
            <>
              <FieldLabel>변경 이력</FieldLabel>
              <Card style={s.card}>
                {detail.versions.map((version) => (
                  <View key={version.id} style={s.versionRow}>
                    <Text style={s.cookTitle}>
                      {version.label}
                      {version.id === recipe.settledVersionId ? ' · 대표 버전' : ''}
                    </Text>
                    <Text style={s.meta}>{version.createdAt.slice(0, 10)}</Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}
          <InfoNote>{SAFETY_COPY.allergyNote}</InfoNote>
        </View>
      </ScreenScroll>
      <OptionSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={recipe.title} options={menu} onSelect={onMenu} />
    </Screen>
  );
}

function MomBadgeLike() {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.green, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>정착완료</Text>
    </View>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    heroWrap: { marginHorizontal: spacing.md, marginTop: spacing.xs, borderRadius: 20, overflow: 'hidden' },
    hero: { width: '100%', aspectRatio: 1.62 },
    heroEmpty: { backgroundColor: c.neutralBg, alignItems: 'center', justifyContent: 'center' },
    corner: { position: 'absolute', top: 0, width: 44, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    cornerLeft: { left: 0, borderBottomRightRadius: 18 },
    cornerRight: { right: 0, borderBottomLeftRadius: 18 },
    body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    title: { flex: 1, maxWidth: 270, color: c.ink, fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 10 },
    meta: { color: c.sub, fontSize: 14, lineHeight: 20 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
    section: { color: c.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
    ingredients: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    ingredient: { width: '23%', flexGrow: 1, minWidth: 72, alignItems: 'center', backgroundColor: c.surface, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4, gap: 3, ...softShadow },
    ingredientImage: { width: 48, height: 40 },
    ingredientDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' },
    ingredientInitial: { color: c.greenDark, fontSize: 16, fontWeight: '700' },
    ingredientName: { color: c.ink, fontSize: 13, fontWeight: '500', marginTop: 4 },
    ingredientAmount: { color: c.sub, fontSize: 13 },
    ingredientBase: { color: c.hint, fontSize: 11 },
    rounding: { color: c.soonText, fontSize: 11, textAlign: 'center' },
    step: { marginBottom: spacing.lg, gap: 8 },
    stepHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.neutralBg, alignItems: 'center', justifyContent: 'center' },
    stepNumberText: { color: c.ink, fontSize: 13, fontWeight: '700' },
    stepText: { flex: 1, color: c.ink, fontSize: 16, lineHeight: 24 },
    stepNote: { marginLeft: 36, minHeight: 42, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: c.ink, fontSize: 14 },
    linkCard: { padding: spacing.lg, marginTop: spacing.lg, gap: 4 },
    linkTitle: { color: c.ink, fontSize: 16, fontWeight: '700' },
    linkActions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap' },
    card: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    cookRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: spacing.sm },
    cookTitle: { color: c.ink, fontSize: 15, fontWeight: '600' },
    usedPanel: { borderTopWidth: 1, borderTopColor: c.line, paddingVertical: spacing.md, gap: 8 },
    usedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    useChip: { backgroundColor: c.neutralBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    useChipText: { color: c.ink, fontSize: 13, fontWeight: '600' },
    versionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  });
