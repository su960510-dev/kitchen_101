import * as ImagePicker from 'expo-image-picker';

const OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: false };

/** OS 사진 선택기와 카메라만 쓴다. 전체 사진 보관함에 접근하지 않는다. */
export async function pickFromAlbum(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync(OPTIONS);
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export type CameraResult = { uri: string | null; denied: boolean };

export async function takePhoto(): Promise<CameraResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { uri: null, denied: true };
  const result = await ImagePicker.launchCameraAsync(OPTIONS);
  return { uri: result.canceled ? null : result.assets[0]?.uri ?? null, denied: false };
}
