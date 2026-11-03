/** 웹 개발 미리보기 구현. expo-file-system 이 웹을 지원하지 않아 선택한 파일은 세션 동안만 유지한다. */
export async function importPhoto(sourceUri: string, _folder: 'inventory' | 'recipes', _id: string): Promise<string> {
  return sourceUri;
}
export function fileExists(_uri: string): boolean {
  return true;
}
export function deleteFile(_uri: string | undefined): void {}
export function deleteAllAppFiles(): void {}
export function writeCacheText(_fileName: string, text: string): string {
  return URL.createObjectURL(new Blob([text], { type: 'application/json' }));
}
export async function readText(uri: string): Promise<string> {
  return (await fetch(uri)).text();
}
export async function readBase64(_uri: string): Promise<string | null> {
  return null;
}
export function writeBase64Photo(_folder: 'inventory' | 'recipes', _fileName: string, base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}
