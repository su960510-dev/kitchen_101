import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import { AppError } from '@/domain/errors';
import { readBase64, readText, writeBase64Photo, writeCacheText } from '@/infrastructure/file-storage/app-files';
import type { SqlDb } from '@/infrastructure/database/sql-types';

import { parseBackup, type BackupV1 } from './backup-format';
import { backupFileName, buildBackup, restoreBackup } from './backup-service';

/** 백업 파일을 만들어 OS 공유 시트를 연다. 저장 위치는 사용자가 고른다. */
export async function exportBackup(db: SqlDb, includePhotos: boolean): Promise<void> {
  const backup = await buildBackup(db);
  if (includePhotos) {
    const photos: Record<string, string> = {};
    const uris = [...backup.items.map((i) => i.localPhotoUri), ...backup.recipes.map((r) => r.imageUri)].filter((u): u is string => !!u);
    for (const uri of uris) {
      const data = await readBase64(uri);
      if (data) photos[uri] = data;
    }
    backup.photos = photos;
  }
  const uri = writeCacheText(backupFileName(), JSON.stringify(backup));
  if (process.env.EXPO_OS === 'web') return;
  if (!(await Sharing.isAvailableAsync())) throw new AppError('unknown', '이 기기에서는 공유 시트를 열 수 없어요.');
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: '주부1단 백업 내보내기' });
}

function restorePhotos(backup: BackupV1): BackupV1 {
  if (!backup.photos) return { ...backup, items: backup.items.map((i) => ({ ...i, localPhotoUri: undefined })), recipes: backup.recipes.map((r) => ({ ...r, imageUri: undefined })) };
  const write = (uri: string | undefined, folder: 'inventory' | 'recipes', id: string) => {
    const data = uri ? backup.photos?.[uri] : undefined;
    return data ? writeBase64Photo(folder, `${id}-restored.jpg`, data) : undefined;
  };
  return {
    ...backup,
    items: backup.items.map((i) => ({ ...i, localPhotoUri: write(i.localPhotoUri, 'inventory', i.id) })),
    recipes: backup.recipes.map((r) => ({ ...r, imageUri: write(r.imageUri, 'recipes', r.id) })),
  };
}

/** 사용자가 고른 파일을 먼저 검증한 뒤, 호출 측 확인을 받아 복원한다. */
export async function pickBackup(): Promise<BackupV1 | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true, multiple: false });
  if (picked.canceled) return null;
  return parseBackup(await readText(picked.assets[0].uri));
}

export function applyBackup(db: SqlDb, backup: BackupV1) {
  return restoreBackup(db, restorePhotos(backup));
}
