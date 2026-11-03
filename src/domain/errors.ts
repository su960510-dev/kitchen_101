export type AppErrorCode = 'validation' | 'not-found' | 'unconfirmed-date' | 'backup-invalid' | 'file-access-lost' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;

  constructor(code: AppErrorCode, userMessage: string, cause?: unknown) {
    super(userMessage, cause === undefined ? undefined : { cause });
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

export function userMessageOf(error: unknown, fallback = '문제가 생겼어요. 다시 시도해 주세요.'): string {
  return error instanceof AppError ? error.userMessage : fallback;
}

/** 식품명, OCR 원문, 레시피 메모 같은 사용자 내용은 로그에 남기지 않는다. */
export function logError(scope: string, error: unknown): void {
  const name = error instanceof Error ? error.name : 'Error';
  const code = error instanceof AppError ? error.code : 'unknown';
  console.warn(`[${scope}] ${name}:${code}`);
}
