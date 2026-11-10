import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, FieldLabel, FoodThumb, Header, InfoNote, MomBadge, Pill, PrimaryButton, SampleBadge, Screen, ScreenScroll, SecondaryButton, Stepper, TextField, ToggleRow, describeItemDate, spacing, useStyles, type Colors } from '@/design-system';
import { formatFull, todayKst } from '@/domain/date-only';
import { userMessageOf } from '@/domain/errors';
import { CATEGORY_LABELS, STORAGE_LABELS, type FoodInventoryItem } from '@/domain/models';
import { DATE_TYPE_LABELS, isLabelDeadline } from '@/features/food-safety/date-policy';
import { SAFETY_COPY, statusMessage } from '@/features/food-safety/safety-copy';
import { computeStatus } from '@/features/food-safety/status-calculator';
import { restoreItem, saveItem } from '@/features/inventory/inventory-service';
import type { InventoryInput } from '@/features/inventory/types';
import { deleteFile } from '@/infrastructure/file-storage/app-files';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';
import { confirmAction, notify } from '@/utils/dialogs';

/** 저장할 때 추정 기한은 비워 넘겨 이름·구매일 기준으로 다시 계산되게 한다. */
function toInput(item: FoodInventoryItem): InventoryInput {
  if (item.dateSource !== 'AUTO_ESTIMATE') return item;
  return { ...item, labelDate: undefined, labelDateType: undefined, dateSource: undefined };
}

export default function InventoryDetailScreen() {
  const db = useDb();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, loading, reload } = useLoader(() => inventoryRepository.get(db, id), [id]);

  if (!item) {
    return (
      <Screen>
        <Header title="식재료" />
        {loading ? null : <EmptyState title="항목을 찾을 수 없어요" />}
      </Screen>
    );
  }
  // 저장 후 다시 불러오면 입력값을 새 값으로 초기화한다.
  return <DetailView key={`${item.id}:${item.updatedAt}`} item={item} reload={reload} />;
}

function DetailView({ item, reload }: { item: FoodInventoryItem; reload: () => void }) {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { settings, refresh } = useAppState();
  const [name, setName] = useState(item.name);
  // 수량이 없던 품목은 1개로 시작한다(0은 저장 시 삭제를 뜻하므로).
  const [quantity, setQuantity] = useState(item.quantity ?? 1);
  const [unit, setUnit] = useState(item.unit ?? '개');
  const [note, setNote] = useState(item.note ?? '');
  const [saving, setSaving] = useState(false);
  const today = todayKst();
  const lead = settings.reminderLeadDays;

  const status = computeStatus(item, today, lead);
  const { pill } = describeItemDate(item, today, lead);
  const finished = !!item.consumedAt || !!item.discardedAt;

  const act = async (task: () => Promise<unknown>) => {
    try {
      await task();
      refresh();
      reload();
    } catch (error) {
      notify(userMessageOf(error));
    }
  };

  const remove = async () => {
    deleteFile(item.localPhotoUri);
    await inventoryRepository.remove(db, item.id);
    refresh();
    goBack();
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/inventory'));

  const save = async () => {
    // 개수를 0으로 저장하면 확인 후 품목을 삭제한다.
    if (quantity === 0) {
      if (await confirmAction('품목 삭제', `개수가 0이라 ${item.name}이(가) 삭제됩니다.`, '삭제')) await remove();
      return;
    }
    setSaving(true);
    try {
      await saveItem(db, { ...toInput(item), name, quantity, unit: unit.trim() || undefined, note });
      refresh();
      goBack();
    } catch (error) {
      notify(userMessageOf(error));
    } finally {
      setSaving(false);
    }
  };

  const dateRows: [string, string | undefined][] = [
    ['받은 날짜', item.receivedDate],
    ['구매일', item.purchaseDate],
    ['개봉일', item.openedDate],
    ['조리일', item.cookedDate],
  ];

  return (
    <Screen>
      <Header title="식재료 상세" />
      <ScreenScroll
        footer={
          finished ? (
            <PrimaryButton label="다시 냉장고로 복구" onPress={() => act(() => restoreItem(db, item.id))} />
          ) : (
            <PrimaryButton label="저장" onPress={save} loading={saving} />
          )
        }>
        <View style={s.head}>
          <FoodThumb item={item} size={92} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={s.badges}>
              {item.isMomSideDish ? <MomBadge /> : null}
              {item.isSample ? <SampleBadge /> : null}
            </View>
            <Text accessibilityRole="header" style={s.name}>
              {item.name}
            </Text>
            <Text style={s.meta}>
              {CATEGORY_LABELS[item.category]} · {STORAGE_LABELS[item.storageLocation]}
            </Text>
          </View>
          {pill ? <Pill {...pill} /> : null}
        </View>

        {item.isSample ? <InfoNote>{SAFETY_COPY.sampleNote}</InfoNote> : null}
        {finished ? <InfoNote>{item.discardedAt ? '폐기로 기록된 항목이에요.' : '소진으로 기록된 항목이에요.'}</InfoNote> : null}

        <FieldLabel>이름</FieldLabel>
        <TextField value={name} onChangeText={setName} placeholder="식재료 이름" label="이름" />

        <FieldLabel>개수</FieldLabel>
        <Text style={s.hint}>0으로 저장하면 품목이 삭제돼요.</Text>
        <View style={s.qtyRow}>
          <Stepper label="개수" value={quantity} min={0} max={999} onChange={setQuantity} />
          <TextField value={unit} onChangeText={setUnit} placeholder="단위" label="단위" style={{ flex: 1 }} />
        </View>

        <FieldLabel>메모</FieldLabel>
        <TextField value={note} onChangeText={setNote} placeholder="데우는 방법, 남은 양 등" multiline label="메모" />

        <Card style={s.card}>
          <Text style={s.cardTitle}>{item.dateSource === 'AUTO_ESTIMATE' ? '추정 보관 기한' : '포장 표시 날짜'}</Text>
          {item.labelDate && item.labelDateType ? (
            <>
              <Text style={s.dateValue}>{formatFull(item.labelDate)}</Text>
              <Text style={s.meta}>
                {DATE_TYPE_LABELS[item.labelDateType]}
                {item.dateSource === 'AUTO_ESTIMATE' ? ' · 구매일 기준 자동 계산' : item.dateSource === 'OCR_CONFIRMED' ? ' · 라벨 인식 후 직접 확인' : item.dateSource === 'IMPORTED_BACKUP' ? ' · 백업에서 복원' : ' · 직접 입력'}
              </Text>
              {!isLabelDeadline(item.labelDateType) ? <Text style={s.meta}>이 날짜는 기한이 아니에요. 임박 계산에 쓰지 않아요.</Text> : null}
            </>
          ) : (
            <Text style={s.meta}>날짜 미등록</Text>
          )}
        </Card>

        <Card style={s.card}>
          <Text style={s.cardTitle}>내 관리 알림</Text>
          {item.personalReminderDate ? <Text style={s.dateValue}>{formatFull(item.personalReminderDate)}</Text> : <Text style={s.meta}>미설정</Text>}
          <Text style={s.meta}>{SAFETY_COPY.personalReminderNote}</Text>
        </Card>

        <View style={s.notes}>
          {status.all
            .filter((x) => x !== 'NO_DATE' || !item.isMomSideDish)
            .map((x) => (
              <InfoNote key={x} icon={x === 'EXPIRED_LABEL_DATE' ? 'alert' : 'info'}>
                {statusMessage(x, item.labelDateType)}
              </InfoNote>
            ))}
          {item.dateSource === 'AUTO_ESTIMATE' ? <InfoNote>{SAFETY_COPY.estimateNote}</InfoNote> : null}
          <InfoNote>{SAFETY_COPY.appCannotInspect}</InfoNote>
        </View>

        {dateRows.some(([, value]) => value) ? (
          <Card style={s.card}>
            <Text style={s.cardTitle}>기록</Text>
            {dateRows.map(([label, value]) =>
              value ? (
                <View key={label} style={s.recordRow}>
                  <Text style={s.meta}>{label}</Text>
                  <Text style={s.recordValue}>{formatFull(value)}</Text>
                </View>
              ) : null,
            )}
          </Card>
        ) : null}

        {!finished && !item.isSample ? (
          <Card style={s.card}>
            <ToggleRow label="날짜 알림 받기" hint={settings.notificationEnabled ? '표시 날짜와 내 관리 알림을 각각 알려요.' : '더보기에서 알림을 켜야 예약돼요.'} value={item.notifyEnabled} onChange={(v) => act(() => saveItem(db, { ...toInput(item), notifyEnabled: v }))} />
          </Card>
        ) : null}

        <View style={s.actions}>
          <SecondaryButton label="수정" icon="note" onPress={() => router.push({ pathname: '/inventory/new', params: { id: item.id } })} />
          <SecondaryButton
            label="삭제"
            icon="trash"
            danger
            onPress={async () => {
              if (await confirmAction('식재료 삭제', `${item.name}을(를) 완전히 삭제할까요?`, '삭제')) await remove();
            }}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
    badges: { flexDirection: 'row', gap: 4 },
    name: { color: c.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
    meta: { color: c.sub, fontSize: 14, lineHeight: 20 },
    card: { padding: spacing.lg, marginTop: spacing.md, gap: 4 },
    cardTitle: { color: c.ink, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    dateValue: { color: c.ink, fontSize: 20, fontWeight: '600' },
    notes: { marginTop: spacing.xs },
    recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    recordValue: { color: c.ink, fontSize: 14, fontWeight: '500' },
    hint: { color: c.sub, fontSize: 13, marginTop: -4, marginBottom: 8 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.lg, justifyContent: 'center' },
  });
