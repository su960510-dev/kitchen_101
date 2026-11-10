import type { ParsedIngredient, ParsedRecipeText } from './recipe-text-parser';

/**
 * 어디서 가져온 레시피든 같은 형식으로 맞춘다. 원문 문장을 새로 쓰지 않고, 장식·말투 기호를 걷어 내고
 * 단위·묶음·끝맺음을 통일한다. 단위가 없는 양처럼 알 수 없는 값은 채우지 않고 '단위 확인'으로 표시한다.
 */
const UNIT_ALIASES: Record<string, string> = {
  T: '큰술', Ts: '큰술', Tbsp: '큰술', tbsp: '큰술', 스푼: '큰술', 숟가락: '큰술', 밥숟가락: '큰술', 수저: '큰술',
  t: '작은술', ts: '작은술', tsp: '작은술', 티스푼: '작은술', 찻숟가락: '작은술',
  cc: 'ml', mL: 'ml', ML: 'ml', l: 'L', 리터: 'L', 그램: 'g', 킬로: 'kg',
  봉: '봉지',
};

const EMOJI = /[\p{Extended_Pictographic}️‍⃣]/gu;

export function cleanText(text: string): string {
  return text
    .replace(EMOJI, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/[ㅋㅎㅠㅜ]{1,}/g, '')
    .replace(/[~～]+/g, '')
    .replace(/!{2,}/g, '!')
    .replace(/\.{2,}|…/g, '.')
    .replace(/,{2,}/g, ',')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** 문장 끝을 마침표로 맞춘다. 느낌표 하나는 마침표로 바꾼다. */
export function finishSentence(text: string): string {
  const t = cleanText(text).replace(/[!]+$/, '').replace(/[,\s]+$/, '').trim();
  if (!t) return t;
  return /[.?]$/.test(t) ? t : `${t}.`;
}

function normalizeIngredient(i: ParsedIngredient): ParsedIngredient {
  const notes: string[] = [];
  let name = cleanText(i.name).replace(/\s*등$/, '');
  name = name.replace(/\s*\(([^)]*)\)\s*/g, (_, inner: string) => {
    if (inner.trim()) notes.push(inner.trim());
    return ' ';
  }).replace(/\s+/g, ' ').trim();
  const unit = i.unit ? UNIT_ALIASES[i.unit] ?? i.unit : undefined;
  if (i.quantity != null && !unit) notes.push('단위 확인');
  if (i.note) notes.unshift(i.note);
  return {
    name,
    quantity: i.quantity,
    unit,
    text: i.text,
    note: notes.length ? notes.join(', ') : undefined,
    group: i.group,
  };
}

const TITLE_MAX = 30;

/** 제목은 장식을 지우고 첫 문장만, 30자를 넘으면 줄인다. */
export function cleanTitle(title: string | undefined): string | undefined {
  if (!title) return undefined;
  const t = cleanText(title).split(/(?<=[.!?])\s/)[0].replace(/[.,!?]+$/, '').trim();
  if (!t) return undefined;
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX).trim()}…` : t;
}

export function normalizeRecipe(parsed: ParsedRecipeText): ParsedRecipeText {
  const seen = new Set<string>();
  const ingredients = parsed.ingredients
    .map(normalizeIngredient)
    .filter((i) => {
      if (!i.name || seen.has(i.name)) return false;
      seen.add(i.name);
      return true;
    });
  const steps = parsed.steps.map(finishSentence).filter((s) => s.replace(/[.\s]/g, '').length >= 2);
  const tipSeen = new Set<string>();
  const tips = (parsed.tips ?? []).map(finishSentence).filter((t) => {
    if (t.replace(/[.\s]/g, '').length < 2 || tipSeen.has(t)) return false;
    tipSeen.add(t);
    return true;
  });
  return { ...parsed, title: cleanTitle(parsed.title), ingredients, steps, tips: tips.length ? tips : undefined };
}
