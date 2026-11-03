export type OcrPlatform = 'IOS_VISION' | 'ANDROID_ML_KIT' | 'MANUAL';

export interface OcrTextLine {
  text: string;
  confidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface TextRecognitionResult {
  platform: OcrPlatform;
  lines: OcrTextLine[];
  rawText: string;
  processingMs: number;
  imageWidth?: number;
  imageHeight?: number;
}

export interface FoodLabelOcrProvider {
  getCapabilities(): Promise<{ available: boolean; languages: string[]; offline: boolean }>;
  recognize(localImageUri: string): Promise<TextRecognitionResult>;
}
