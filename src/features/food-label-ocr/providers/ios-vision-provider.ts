import { requireOptionalNativeModule } from 'expo';

import type { FoodLabelOcrProvider, TextRecognitionResult } from '../ocr-contracts';

interface NativeFoodLabelOcr {
  getCapabilities(): Promise<{ available: boolean; languages: string[]; offline: boolean }>;
  recognize(uri: string): Promise<Omit<TextRecognitionResult, 'platform' | 'rawText'> & { rawText?: string }>;
}

/** modules/food-label-ocr(Swift, Apple Vision)를 감싼다. 개발 빌드에서만 존재한다. */
export function createIosVisionProvider(): FoodLabelOcrProvider | null {
  const native = requireOptionalNativeModule<NativeFoodLabelOcr>('FoodLabelOcr');
  if (!native) return null;
  return {
    getCapabilities: () => native.getCapabilities(),
    recognize: async (uri) => {
      const result = await native.recognize(uri);
      return {
        platform: 'IOS_VISION',
        lines: result.lines,
        rawText: result.lines.map((l) => l.text).join('\n'),
        processingMs: result.processingMs,
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
      };
    },
  };
}
