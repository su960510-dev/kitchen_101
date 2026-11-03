import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Header, InfoNote, RowLink, Screen, ScreenScroll, SecondaryButton, ToggleRow, spacing, useStyles, type Colors } from '@/design-system';
import { userMessageOf } from '@/domain/errors';
import { applyBackup, exportBackup, pickBackup } from '@/features/backup/backup-actions';
import { clearAllData } from '@/features/backup/backup-service';
import { restoreItem } from '@/features/inventory/inventory-service';
import { hasSampleData, removeSampleData } from '@/features/sample-data/sample-data';
import { cancelAllNotifications } from '@/infrastructure/notifications/local-notifications';
import { deleteAllAppFiles } from '@/infrastructure/file-storage/app-files';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';
import { confirmAction, notify } from '@/utils/dialogs';

export default function DataManagementScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { refresh, updateSettings } = useAppState();
  const [includePhotos, setIncludePhotos] = useState(false);
  const { data, reload } = useLoader(async () => ({ finished: await inventoryRepository.listFinished(db), sample: await hasSampleData(db) }));
  const finished = data?.finished ?? [];
  const consumedCount = finished.filter((i) => i.consumedAt).length;
  const discardedCount = finished.filter((i) => i.discardedAt).length;

  const guard = async (task: () => Promise<void>) => {
    try {
      await task();
    } catch (error) {
      notify(userMessageOf(error));
    }
  };

  return (
    <Screen>
      <Header title="데이터 관리" />
      <ScreenScroll>
        <Text style={s.section}>내보내기·복원</Text>
        <Card style={s.card}>
          <ToggleRow label="사진 포함" hint="파일이 커질 수 있어요." value={includePhotos} onChange={setIncludePhotos} />
          <RowLink
            label="JSON으로 내보내기"
            hint="저장 위치는 직접 골라요. 예시 데이터는 빠져요."
            onPress={() =>
              guard(async () => {
                if (await confirmAction('백업 파일 주의', '백업에는 가정 정보와 개인 레시피가 들어 있어요. 공유 전에 받는 사람과 저장 위치를 확인해 주세요.', '계속')) await exportBackup(db, includePhotos);
              })
            }
          />
          <RowLink
            label="백업에서 복원"
            hint="현재 데이터를 백업 내용으로 바꿔요."
            onPress={() =>
              guard(async () => {
                const backup = await pickBackup();
                if (!backup) return;
                if (!(await confirmAction('복원할까요?', `식재료 ${backup.items.length}개, 레시피 ${backup.recipes.length}개로 현재 데이터를 바꿔요.`, '복원'))) return;
                const report = await applyBackup(db, backup);
                refresh();
                notify('복원했어요', `식재료 ${report.items}개, 레시피 ${report.recipes}개`);
              })
            }
          />
        </Card>

        <Text style={s.section}>소진·폐기 기록</Text>
        <Card style={s.card}>
          <Text style={s.meta}>
            최근 기록 소진 {consumedCount}개 · 폐기 {discardedCount}개
          </Text>
          {finished.slice(0, 10).map((item) => (
            <View key={item.id} style={s.finishedRow}>
              <Text style={s.finishedName} numberOfLines={1}>
                {item.name} · {item.discardedAt ? '폐기' : '소진'}
              </Text>
              <SecondaryButton
                label="복구"
                onPress={() =>
                  guard(async () => {
                    await restoreItem(db, item.id);
                    refresh();
                    reload();
                  })
                }
              />
            </View>
          ))}
          <InfoNote>재고 관리 기록이에요. 식품 안전을 판단하는 근거가 아니에요.</InfoNote>
        </Card>

        <Text style={s.section}>삭제</Text>
        <Card style={s.card}>
          <RowLink
            label="저장된 라벨 인식 원문 지우기"
            onPress={() =>
              guard(async () => {
                if (!(await confirmAction('인식 원문 지우기', '보관을 선택한 라벨 인식 원문을 모두 지워요.', '지우기'))) return;
                await inventoryRepository.clearOcrText(db);
                notify('지웠어요');
              })
            }
          />
          {data?.sample ? (
            <RowLink
              label="예시 데이터 지우기"
              onPress={() =>
                guard(async () => {
                  await removeSampleData(db);
                  refresh();
                  reload();
                })
              }
            />
          ) : null}
          <RowLink
            label="전체 데이터 삭제"
            danger
            hint="되돌릴 수 없어요."
            onPress={() =>
              guard(async () => {
                if (!(await confirmAction('전체 데이터 삭제', '식재료, 레시피, 사진, 설정을 모두 지워요. 되돌릴 수 없어요.', '모두 삭제'))) return;
                await cancelAllNotifications();
                await clearAllData(db);
                deleteAllAppFiles();
                await updateSettings({ onboardingDone: false, notificationEnabled: false });
                refresh();
                router.replace('/onboarding');
              })
            }
          />
        </Card>
      </ScreenScroll>
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    section: { color: c.sub, fontSize: 13, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.sm },
    card: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    meta: { color: c.sub, fontSize: 14, paddingVertical: spacing.sm },
    finishedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
    finishedName: { flex: 1, color: c.ink, fontSize: 15 },
  });
