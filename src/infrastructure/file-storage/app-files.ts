import { Directory, File, Paths } from 'expo-file-system';

import { AppError } from '@/domain/errors';

/** 앱 전용 폴더. 사용자가 명시적으로 선택한 사진만 복사하고, DB에는 URI만 저장한다. */
const ROOT = 'jubu1dan';

function dir(...parts: string[]): Directory {
  const d = new Directory(Paths.document, ROOT, ...parts);
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

export async function importPhoto(sourceUri: string, folder: 'inventory' | 'recipes', id: string): Promise<string> {
  try {
    const extension = /\.(jpe?g|png|heic|webp)(?:\?|$)/i.exec(sourceUri)?.[1]?.toLowerCase() ?? 'jpg';
    const target = new File(dir(folder), `${id}-${Date.now()}.${extension}`);
    await new File(sourceUri).copy(target);
    return target.uri;
  } catch (error) {
    throw new AppError('file-access-lost', '사진을 저장하지 못했어요.', error);
  }
}

export function fileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function deleteFile(uri: string | undefined): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // 파일이 이미 없어도 동작에 문제 없다.
  }
}

export function deleteAllAppFiles(): void {
  const d = new Directory(Paths.document, ROOT);
  if (d.exists) d.delete();
}

export function writeCacheText(fileName: string, text: string): string {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  return file.uri;
}

export async function readText(uri: string): Promise<string> {
  return new File(uri).text();
}

export async function readBase64(uri: string): Promise<string | null> {
  try {
    return await new File(uri).base64();
  } catch {
    return null;
  }
}

export function writeBase64Photo(folder: 'inventory' | 'recipes', fileName: string, base64: string): string {
  const file = new File(dir(folder), fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}
