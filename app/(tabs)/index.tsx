import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AlertBanner,
  Card,
  Icon,
  IconButton,
  InventoryRow,
  LogoMark,
  OptionSheet,
  RecipeRowCard,
  Screen,
  SectionHeader,
  softShadow,
  spacing,
  useStyles,
  type Colors,
  type SheetOption,
} from '@/design-system';
import { todayKst } from '@/domain/date-only';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { attentionBanner } from '@/features/inventory/attention-banner';
import { summarize } from '@/features/inventory/inventory-service';
import { bestCoverage, matchRecipes } from '@/features/fridge-matching/recipe-matcher';
import { hasSampleData, removeSampleData } from '@/features/sample-data/sample-data';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';
import { confirmAction } from '@/utils/dialogs';

type AddChoice = 'scan' | 'manual' | 'mom';

const STORAGE_CARDS = [
  { key: 'FRIDGE', label: '냉장', icon: 'snow', tint: '#7FB8E0' },
  { key: 'FREEZER', label: '냉동', icon: 'fridge-door', tint: '#8E9CD8' },
  { key: 'PANTRY', label: '상온', icon: 'pantry', tint: '#E9A75A' },
] as const;
const ADD_OPTIONS: SheetOption<AddChoice>[] = [
  { value: 'scan', label: '포장 라벨로 등록', hint: '촬영하거나 앨범에서 선택해요. 날짜는 직접 확인해요.', icon: 'scan' },
  { value: 'manual', label: '직접 입력', icon: 'note' },
  { value: 'mom', label: '엄마표 반찬 등록', hint: '받은 날짜와 내 관리 알림을 기록해요.', icon: 'leaf' },
];

export default function HomeScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { settings, refresh } = useAppState();
  const [adding, setAdding] = useState(false);
  const today = todayKst();
  const lead = settings.reminderLeadDays;

  const { data } = useLoader(async () => {
    const items = await inventoryRepository.listActive(db);
    const recipes = await recipeRepository.list(db);
    const matches = matchRecipes(recipes, await recipeRepository.allIngredients(db), items, { today, leadDays: lead });
    return { items, summary: summarize(items, lead, today), matches, recipes, sample: await hasSampleData(db) };
  }, [today, lead]);

  const summary = data?.summary;
  const banner = data ? attentionBanner(data.summary.attention, today, lead) : null;
  const recommended = data ? bestCoverage(data.matches) : undefined;
  const settled = data?.recipes.filter((r) => r.isSettled).slice(0, 2) ?? [];
  const openInventory = (params: Record<string, string> = {}) => router.navigate({ pathname: '/inventory', params });

  const clearSamples = async () => {
    if (await confirmAction('예시 데이터 지우기', '예시 식재료와 레시피만 지워요. 직접 등록한 내용은 그대로예요.', '지우기')) {
      await removeSampleData(db);
      refresh();
    }
  };

  return (
    <Screen>
      <View style={s.header}>
        <View style={s.logo} accessibilityLabel="주부1단">
          <LogoMark size={34} />
        </View>
        <IconButton icon="bell" label="확인할 날짜 보기" size={28} onPress={() => openInventory({ attention: '1' })} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {data?.sample ? (
          <Pressable onPress={clearSamples} accessibilityRole="button" accessibilityLabel="예시 데이터 지우기" style={s.sampleBar}>
            <Text numberOfLines={1} style={s.sampleText}>예시 데이터예요. 날짜는 화면 설명용이에요.</Text>
            <Text style={s.sampleAction}>지우기</Text>
          </Pressable>
        ) : null}

        {banner ? <AlertBanner variant="home" title={banner.title} subtitle={banner.subtitle} imageKey={banner.imageKey} imageUri={banner.imageUri} onPress={() => openInventory({ attention: '1' })} /> : null}

        <SectionHeader title="냉장고 현황" trailing={`전체 ${summary?.total ?? 0}개`} />
        <View style={s.groupRow}>
          {STORAGE_CARDS.map(({ key, label, icon, tint }) => (
            <Pressable key={key} onPress={() => openInventory({ storage: key })} accessibilityRole="button" accessibilityLabel={`${label} ${summary?.storageCounts[key] ?? 0}개`} style={({ pressed }) => [s.groupCard, pressed && { opacity: 0.7 }]}>
              <View style={[s.storageIcon, { backgroundColor: tint }]}>
                <Icon name={icon} size={22} color="#fff" strokeWidth={2.2} />
              </View>
              <Text style={s.groupLabel}>{label}</Text>
              <Text style={s.groupCount}>{summary?.storageCounts[key] ?? 0}개</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setAdding(true)} accessibilityRole="button" style={({ pressed }) => [s.quick, s.quickInStatus, pressed && { opacity: 0.7 }]}>
          <Text style={s.quickText}>+ 식재료 빠른 등록</Text>
        </Pressable>

        <SectionHeader title="추천 레시피" trailing="더보기" onPress={() => router.navigate('/recipes')} />
        {recommended ? (
          <RecipeRowCard recipe={recommended.recipe} onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: recommended.recipe.id } })} />
        ) : (
          <Card style={s.emptyCard}>
            <Text style={s.emptyText}>재료와 레시피를 등록하면 지금 만들 수 있는 요리를 찾아 드려요.</Text>
          </Card>
        )}

        <Pressable onPress={() => router.push('/fridge-pick')} accessibilityRole="button" style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}>
          <Text style={s.ctaTitle}>냉장고 파먹기</Text>
          <Text style={s.ctaHint}>날짜가 가까운 재료를 쓰는 내 레시피 찾기</Text>
        </Pressable>

        {summary && summary.mom.length > 0 ? (
          <>
            <SectionHeader title="엄마표 반찬" trailing={`${summary.mom.length}개`} onPress={() => openInventory({ mom: '1' })} />
            {summary.mom.slice(0, 3).map((item) => (
              <InventoryRow key={item.id} item={item} today={today} leadDays={lead} onPress={() => router.push({ pathname: '/inventory/[id]', params: { id: item.id } })} />
            ))}
          </>
        ) : null}

        {summary && summary.noDate.length > 0 ? (
          <>
            <SectionHeader title="날짜 미등록" trailing={`${summary.noDate.length}개`} />
            <Text style={s.mutedLine} numberOfLines={2}>
              {summary.noDate.map((i) => i.name).join(', ')}
            </Text>
          </>
        ) : null}

        {settled.length > 0 ? (
          <>
            <SectionHeader title="우리 집 정착 레시피" />
            {settled.map((recipe) => (
              <View key={recipe.id} style={{ marginBottom: spacing.md }}>
                <RecipeRowCard recipe={recipe} onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: recipe.id } })} />
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <OptionSheet
        visible={adding}
        onClose={() => setAdding(false)}
        title="식재료 추가"
        options={ADD_OPTIONS}
        onSelect={(choice) => router.push(choice === 'scan' ? '/inventory/scan-label' : { pathname: '/inventory/new', params: choice === 'mom' ? { mom: '1' } : {} })}
      />
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    header: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl },
    logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', ...softShadow },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: 40 },
    sampleBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.neutralBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginBottom: spacing.md },
    sampleText: { flex: 1, color: c.neutralText, fontSize: 12, lineHeight: 17 },
    sampleAction: { color: c.ink, fontSize: 13, fontWeight: '700' },
    groupRow: { flexDirection: 'row', gap: 10 },
    groupCard: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: c.surface, borderRadius: 20, paddingVertical: 16, ...softShadow },
    groupLabel: { color: c.sub, fontSize: 15, fontWeight: '500' },
    storageIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    groupCount: { color: c.ink, fontSize: 18, fontWeight: '700' },
    emptyCard: { padding: spacing.xl },
    emptyText: { color: c.sub, fontSize: 14, lineHeight: 20 },
    cta: { marginTop: spacing.xl, backgroundColor: c.greenSoft, borderRadius: 20, padding: spacing.lg },
    ctaTitle: { color: c.greenDark, fontSize: 17, fontWeight: '700' },
    ctaHint: { color: c.greenDark, fontSize: 13, marginTop: 4 },
    quick: { marginTop: spacing.md, minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface },
    quickInStatus: { marginTop: 12 },
    quickText: { color: c.ink, fontSize: 15, fontWeight: '600' },
    mutedLine: { color: c.sub, fontSize: 14, lineHeight: 20 },
  });
