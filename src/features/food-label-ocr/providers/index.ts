import { Platform } from 'react-native';

import type { FoodLabelOcrProvider } from '../ocr-contracts';

import { createIosVisionProvider } from './ios-vision-provider';

/** 네이티브 모듈이 없어도(Expo Go, 웹, Android 미구현) 앱은 수동 입력으로 계속 동작한다. */
const unavailable: FoodLabelOcrProvider = {
  getCapabilities: async () => ({ available: false, languages: [], offline: true }),
  recognize: async () => {
    throw new Error('OCR provider unavailable');
  },
};

let cached: FoodLabelOcrProvider | null = null;

export function getOcrProvider(): FoodLabelOcrProvider {
  if (!cached) cached = Platform.OS === 'ios' ? createIosVisionProvider() ?? unavailable : unavailable;
  return cached;
}
