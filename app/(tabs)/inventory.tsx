import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertBanner, BottomSheet, Chip, EmptyState, FieldLabel, Header, IconButton, InventoryRow, OptionSheet, PrimaryButton, Screen, TextField, UnderlineTabs, spacing, useStyles, type Colors, type SheetOption } from '@/design-system';
import { todayKst } from '@/domain/date-only';
import { CATEGORY_LABELS, groupOfCategory, type InventoryCategory, type InventoryGroup, type StorageLocation } from '@/domain/models';
import { attentionBanner } from '@/features/inventory/attention-banner';
import { filterAndSort, summarize, type InventorySort } from '@/features/inventory/inventory-service';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';

type Tab = 'ALL' | InventoryGroup;
type AddChoice = 'scan' | 'manual' | 'mom';

const ADD_OPTIONS: SheetOption<AddChoice>[] = [
  { value: 'scan', label: '포장 라벨로 등록', hint: '촬영하거나 앨범에서 선택해요. 날짜는 직접 확인해요.', icon: 'scan' },
  { value: 'manual', label: '직접 입력', icon: 'note' },
  { value: 'mom', label: '엄마표 반찬 등록', hint: '받은 날짜와 내 관리 알림을 기록해요.', icon: 'leaf' },
];

const STORAGE_FILTERS: { key: StorageLocation; label: string }[] = [
  { key: 'FRIDGE', label: '냉장' },
  { key: 'FREEZER', label: '냉동' },
  { key: 'PANTRY', label: '상온' },
];
const SORTS: { key: InventorySort; label: string }[] = [
  { key: 'DUE', label: '임박 우선' },
  { key: 'RECENT', label: '최근 등록' },
  { key: 'NAME', label: '이름순' },
];

export default function InventoryScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const insets = useSafeAreaInsets();
  const { settings } = useAppState();
  const params = useLocalSearchParams<{ group?: InventoryGroup; attention?: string; mom?: string }>();
  const today = todayKst();
  const lead = settings.reminderLeadDays;

  const [tab, setTab] = useState<Tab>('ALL');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [storage, setStorage] = useState<StorageLocation>();
  const [category, setCategory] = useState<InventoryCategory>();
  const [momOnly, setMomOnly] = useState(false);
  const [openedOnly, setOpenedOnly] = useState(false);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [sort, setSort] = useState<InventorySort>('DUE');

  // 홈에서 다른 조건으로 들어오면 그 조건을 적용한다.
  const paramsKey = `${params.group}|${params.attention}|${params.mom}`;
  const [appliedKey, setAppliedKey] = useState('');
  if (appliedKey !== paramsKey) {
    setAppliedKey(paramsKey);
    setTab(params.group ?? 'ALL');
    setAttentionOnly(params.attention === '1');
    setMomOnly(params.mom === '1');
  }

  const { data: items = [] } = useLoader(() => inventoryRepository.listActive(db), []);

  const counts = useMemo(() => {
    const c: Record<InventoryGroup, number> = { FRESH: 0, SIDE: 0, PROCESSED: 0 };
    items.forEach((i) => c[groupOfCategory(i.category)]++);
    return c;
  }, [items]);
  const visible = useMemo(
    () => filterAndSort([...items], { query, group: tab === 'ALL' ? undefined : tab, storage, category, momOnly, openedOnly, attentionOnly, sort }, today, lead),
    [items, query, tab, storage, category, momOnly, openedOnly, attentionOnly, sort, today, lead],
  );
  const banner = useMemo(() => attentionBanner(summarize(items, lead, today).attention, today, lead), [items, lead, today]);
  const activeFilters = [storage, category, momOnly, openedOnly, attentionOnly, sort !== 'DUE'].filter(Boolean).length;

  return (
    <Screen>
      <Header title="냉장고" onBack={() => router.navigate('/')} right={<IconButton icon="search" label="검색과 필터" onPress={() => setFiltersOpen(true)} />} />
      <UnderlineTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'ALL', label: `전체 ${items.length}` },
          { key: 'FRESH', label: `신선식품 ${counts.FRESH}` },
          { key: 'SIDE', label: `반찬 ${counts.SIDE}` },
          { key: 'PROCESSED', label: `가공식품 ${counts.PROCESSED}` },
        ]}
      />
      {query || activeFilters > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setFiltersOpen(true)} style={s.filterBar}>
          <Text style={s.filterText}>{query ? `"${query}" 검색 · ` : ''}필터 {activeFilters}개 적용 · {visible.length}개</Text>
        </Pressable>
      ) : null}
      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        initialNumToRender={12}
        windowSize={7}
        ListHeaderComponent={
          banner ? (
            <View style={{ marginBottom: 14 }}>
              <AlertBanner variant="list" title={banner.title} subtitle={banner.subtitle} onPress={() => setAttentionOnly((v) => !v)} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={<EmptyState title={items.length === 0 ? '아직 등록한 식재료가 없어요' : '조건에 맞는 식재료가 없어요'} hint={items.length === 0 ? '라벨을 찍거나 직접 입력해 시작해 보세요.' : undefined} />}
        renderItem={({ item }) => <InventoryRow item={item} today={today} leadDays={lead} onPress={() => router.push({ pathname: '/inventory/[id]', params: { id: item.id } })} />}
      />
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton label="식재료 추가" icon="plus" onPress={() => setAdding(true)} />
      </View>

      <OptionSheet
        visible={adding}
        onClose={() => setAdding(false)}
        title="식재료 추가"
        options={ADD_OPTIONS}
        onSelect={(choice) => router.push(choice === 'scan' ? '/inventory/scan-label' : { pathname: '/inventory/new', params: choice === 'mom' ? { mom: '1' } : {} })}
      />

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="검색과 필터">
        <TextField value={query} onChangeText={setQuery} placeholder="식재료 이름 검색" />
        <FieldLabel>보관 장소</FieldLabel>
        <View style={s.chips}>
          {STORAGE_FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={storage === f.key} onPress={() => setStorage(storage === f.key ? undefined : f.key)} />
          ))}
        </View>
        <FieldLabel>카테고리</FieldLabel>
        <View style={s.chips}>
          {(Object.keys(CATEGORY_LABELS) as InventoryCategory[]).map((k) => (
            <Chip key={k} label={CATEGORY_LABELS[k]} selected={category === k} onPress={() => setCategory(category === k ? undefined : k)} />
          ))}
        </View>
        <FieldLabel>상태</FieldLabel>
        <View style={s.chips}>
          <Chip label="엄마표 반찬만" selected={momOnly} onPress={() => setMomOnly((v) => !v)} />
          <Chip label="개봉한 것만" selected={openedOnly} onPress={() => setOpenedOnly((v) => !v)} />
          <Chip label="확인할 날짜만" selected={attentionOnly} onPress={() => setAttentionOnly((v) => !v)} />
        </View>
        <FieldLabel>정렬</FieldLabel>
        <View style={[s.chips, { marginBottom: spacing.lg }]}>
          {SORTS.map((o) => (
            <Chip key={o.key} label={o.label} selected={sort === o.key} onPress={() => setSort(o.key)} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 120 },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, backgroundColor: c.background },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterBar: { marginHorizontal: spacing.xl, marginTop: spacing.sm, backgroundColor: c.neutralBg, borderRadius: 10, padding: 8 },
    filterText: { color: c.neutralText, fontSize: 13 },
  });
