import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage, EmptyState, Header, Icon, IconButton, OptionSheet, recipeMeta, SampleBadge, Screen, softShadow, spacing, UnderlineTabs, useColors, useStyles, type Colors, type SheetOption } from '@/design-system';
import type { Recipe } from '@/domain/models';
import { userMessageOf } from '@/domain/errors';
import { duplicateRecipe } from '@/features/recipes/recipe-service';
import { sourceHost } from '@/features/recipes/recipe-source-links';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';
import { confirmAction, notify } from '@/utils/dialogs';

type Tab = 'ALL' | 'SETTLED' | 'LINK';
type Add = 'new' | 'link';
const ADD_OPTIONS: SheetOption<Add>[] = [
  { value: 'new', label: '직접 등록', hint: '재료와 조리 순서를 내 방식대로 적어요.', icon: 'note' },
  { value: 'link', label: '링크 저장', hint: '원본 URL과 내가 쓴 제목·메모만 저장해요.', icon: 'link' },
];
type Menu = 'edit' | 'copy' | 'delete';

export default function RecipesScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { refresh } = useAppState();
  const [tab, setTab] = useState<Tab>('ALL');
  const [adding, setAdding] = useState(false);
  const [menuFor, setMenuFor] = useState<Recipe | null>(null);
  const { data: recipes = [] } = useLoader(() => recipeRepository.list(db), []);

  const visible = useMemo(() => {
    if (tab === 'SETTLED') return recipes.filter((r) => r.isSettled);
    if (tab === 'LINK') return recipes.filter((r) => r.sourceUrl);
    return recipes;
  }, [recipes, tab]);

  const onMenu = async (recipe: Recipe, action: Menu) => {
    try {
      if (action === 'edit') router.push({ pathname: '/recipes/edit/[id]', params: { id: recipe.id } });
      if (action === 'copy') {
        const copy = await duplicateRecipe(db, recipe.id);
        refresh();
        router.push({ pathname: '/recipes/[id]', params: { id: copy.id } });
      }
      if (action === 'delete' && (await confirmAction('레시피 삭제', `${recipe.title}을(를) 삭제할까요? 메모와 기록도 함께 지워져요.`, '삭제'))) {
        await recipeRepository.remove(db, recipe.id);
        refresh();
      }
    } catch (error) {
      notify(userMessageOf(error));
    }
  };

  const menuOptions: SheetOption<Menu>[] = menuFor?.isSample
    ? [
        { value: 'copy', label: '내 레시피로 복제', hint: '예시 레시피는 복제본을 수정해요.', icon: 'note' },
        { value: 'delete', label: '삭제', icon: 'trash', danger: true },
      ]
    : [
        { value: 'edit', label: '수정', icon: 'note' },
        { value: 'copy', label: '복제', icon: 'plus' },
        { value: 'delete', label: '삭제', icon: 'trash', danger: true },
      ];

  return (
    <Screen>
      <Header title="나만의 레시피" align="left" onBack={() => router.navigate('/')} right={<IconButton icon="plus" label="레시피 추가" size={28} onPress={() => setAdding(true)} />} />
      <UnderlineTabs<Tab>
        stretch
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'ALL', label: '전체' },
          { key: 'SETTLED', label: '정착 레시피' },
          { key: 'LINK', label: '스크랩' },
        ]}
      />
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={s.column}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <EmptyState
            title={tab === 'LINK' ? '저장한 링크가 없어요' : tab === 'SETTLED' ? '아직 정착한 레시피가 없어요' : '아직 레시피가 없어요'}
            hint={tab === 'SETTLED' ? '우리 집 입맛에 맞으면 상세 화면에서 정착 완료를 눌러 보세요.' : '오른쪽 위 + 로 추가할 수 있어요.'}
          />
        }
        renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: item.id } })} onMenu={() => setMenuFor(item)} />}
      />
      <OptionSheet visible={adding} onClose={() => setAdding(false)} title="레시피 추가" options={ADD_OPTIONS} onSelect={(v) => router.push(v === 'new' ? '/recipes/new' : '/recipes/import-link')} />
      <OptionSheet visible={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.title} options={menuOptions} onSelect={(a) => menuFor && onMenu(menuFor, a)} />
    </Screen>
  );
}

function RecipeCard({ recipe, onPress, onMenu }: { recipe: Recipe; onPress: () => void; onMenu: () => void }) {
  const s = useStyles(styles);
  const c = useColors();
  const placeholder = (
    <View style={[s.image, s.placeholder]}>
      <Icon name={recipe.sourceUrl ? 'link' : 'chef-filled'} size={30} color={c.hint} />
    </View>
  );
  return (
    <View style={s.card}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${recipe.title}, ${recipeMeta(recipe)}${recipe.isSettled ? ', 정착 완료' : ''}`} style={({ pressed }) => pressed && { opacity: 0.8 }}>
        <AppImage uri={recipe.imageUri} assetKey={recipe.sampleAssetKey} style={s.image} fallback={placeholder} />
        {recipe.isSettled ? (
          <View style={s.settled}>
            <Text style={s.settledText}>정착완료</Text>
          </View>
        ) : null}
      </Pressable>
      <View style={s.body}>
        <Pressable onPress={onPress} accessible={false} style={{ flex: 1, gap: 6 }}>
          <Text numberOfLines={1} style={s.title}>
            {recipe.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text numberOfLines={1} style={s.meta}>
              {recipe.sourceUrl ? sourceHost(recipe.sourceUrl) : recipeMeta(recipe)}
            </Text>
            {recipe.isSample ? <SampleBadge /> : null}
          </View>
        </Pressable>
        <IconButton icon="dots-vertical" label={`${recipe.title} 메뉴`} size={20} color={c.sub} onPress={onMenu} />
      </View>
    </View>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 24 },
    column: { gap: 12 },
    card: { flex: 1, maxWidth: '50%', backgroundColor: c.surface, borderRadius: 18, marginBottom: 14, overflow: 'hidden', ...softShadow },
    image: { width: '100%', aspectRatio: 1.24, borderRadius: 14 },
    placeholder: { backgroundColor: c.neutralBg, alignItems: 'center', justifyContent: 'center' },
    settled: { position: 'absolute', alignSelf: 'center', bottom: 6, backgroundColor: c.green, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
    settledText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    body: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 4, paddingVertical: 10 },
    title: { color: c.ink, fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
    meta: { color: c.sub, fontSize: 13, flexShrink: 1 },
  });
