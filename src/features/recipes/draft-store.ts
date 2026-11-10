import type { RecipeDraft } from './RecipeEditor';

/**
 * 정리한 초안을 편집기로 넘기는 앱 메모리 보관함. 화면 주소에 JSON 을 실으면 이모지·'%'·'+' 같은 문자와
 * 길이 때문에 기기에서 깨질 수 있어 id 만 넘긴다. 앱을 다시 시작하면 사라진다(저장 전 초안이므로).
 */
const drafts = new Map<string, RecipeDraft>();

export function putDraft(draft: RecipeDraft): string {
  const id = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  drafts.set(id, draft);
  return id;
}

export function takeDraft(id: string | undefined): RecipeDraft | undefined {
  return id ? drafts.get(id) : undefined;
}
