import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, FoodThumb, Header, IconButton, InfoNote, MomBadge, Pill, PrimaryButton, SampleBadge, Screen, ScreenScroll, SecondaryButton, Stepper, ToggleRow, describeItemDate, spacing, useStyles, type Colors } from '@/design-system';
import { formatFull, todayKst } from '@/domain/date-only';
import { userMessageOf } from '@/domain/errors';
import { CATEGORY_LABELS, STORAGE_LABELS } from '@/domain/models';
import { DATE_TYPE_LABELS, isLabelDeadline } from '@/features/food-safety/date-policy';
import { SAFETY_COPY, statusMessage } from '@/features/food-safety/safety-copy';
import { computeStatus } from '@/features/food-safety/status-calculator';
import { consumeItem, discardItem, restoreItem, saveItem, useQuantity as applyUse } from '@/features/inventory/inventory-service';
import { deleteFile } from '@/infrastructure/file-storage/app-files';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';
import { confirmAction, notify } from '@/utils/dialogs';

export default function InventoryDetailScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings, refresh } = useAppState();
  const [useAmount, setUseAmount] = useState(1);
  const { data: item, loading, reload } = useLoader(() => inventoryRepository.get(db, id), [id]);
  const today = todayKst();
  const lead = settings.reminderLeadDays;

  if (!item) {
    return (
      <Screen>
        <Header title="식재료" />
        {loading ? null : <EmptyState title="항목을 찾을 수 없어요" />}
      </Screen>
    );
  }

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

  const dateRows: [string, string | undefined][] = [
    [item.isMomSideDish ? '받은 날짜' : '받은 날짜', item.receivedDate],
    ['구입일', item.purchaseDate],
    ['개봉일', item.openedDate],
    ['조리일', item.cookedDate],
  ];

  return (
    <Screen>
      <Header title="식재료 상세" right={<IconButton icon="note" label="수정" onPress={() => router.push({ pathname: '/inventory/new', params: { id: item.id } })} />} />
      <ScreenScroll
        footer={
          finished ? (
            <PrimaryButton label="다시 냉장고로 복구" onPress={() => act(() => restoreItem(db, item.id))} />
          ) : (
            <PrimaryButton label="다 먹었어요 (소진)" onPress={() => act(() => consumeItem(db, item.id))} />
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
              {item.quantity != null ? ` · ${item.quantity}${item.unit ?? ''}` : ''}
            </Text>
          </View>
          {pill ? <Pill {...pill} /> : null}
        </View>

        {item.isSample ? <InfoNote>{SAFETY_COPY.sampleNote}</InfoNote> : null}
        {finished ? <InfoNote>{item.discardedAt ? '폐기로 기록된 항목이에요.' : '소진으로 기록된 항목이에요.'}</InfoNote> : null}

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

        {item.note ? (
          <Card style={s.card}>
            <Text style={s.cardTitle}>메모</Text>
            <Text style={s.body}>{item.note}</Text>
          </Card>
        ) : null}

        {!finished && item.quantity != null ? (
          <Card style={s.card}>
            <Text style={s.cardTitle}>일부 사용</Text>
            <View style={s.useRow}>
              <Stepper label="사용 수량" value={useAmount} suffix={item.unit ?? ''} max={Math.max(1, Math.floor(item.quantity))} onChange={setUseAmount} />
              <SecondaryButton
                label="사용 기록"
                onPress={() =>
                  act(async () => {
                    await applyUse(db, item.id, useAmount);
                    setUseAmount(1);
                  })
                }
              />
            </View>
          </Card>
        ) : null}

        {!finished && !item.isSample ? (
          <Card style={s.card}>
            <ToggleRow label="날짜 알림 받기" hint={settings.notificationEnabled ? '표시 날짜와 내 관리 알림을 각각 알려요.' : '더보기에서 알림을 켜야 예약돼요.'} value={item.notifyEnabled} onChange={(v) => act(() => saveItem(db, { ...item, notifyEnabled: v }))} />
          </Card>
        ) : null}

        <View style={s.actions}>
          {!finished ? <SecondaryButton label="폐기로 기록" onPress={() => act(() => discardItem(db, item.id))} /> : null}
          <SecondaryButton
            label="삭제"
            icon="trash"
            danger
            onPress={async () => {
              if (!(await confirmAction('식재료 삭제', `${item.name}을(를) 완전히 삭제할까요?`, '삭제'))) return;
              deleteFile(item.localPhotoUri);
              await inventoryRepository.remove(db, item.id);
              refresh();
              router.back();
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
    body: { color: c.ink, fontSize: 15, lineHeight: 22 },
    card: { padding: spacing.lg, marginTop: spacing.md, gap: 4 },
    cardTitle: { color: c.ink, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    dateValue: { color: c.ink, fontSize: 20, fontWeight: '600' },
    notes: { marginTop: spacing.xs },
    recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    recordValue: { color: c.ink, fontSize: 14, fontWeight: '500' },
    useRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8, marginTop: spacing.lg, justifyContent: 'center' },
  });
