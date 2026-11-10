import { parseIngredient, parseRecipeText, type ParsedRecipeText } from '../recipe-text-parser';

/** HTML 문자열에서 레시피 초안을 찾는다. 순수 함수라 기기·테스트 어디서나 같은 결과를 낸다. */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…' };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/** 태그를 지우고 줄바꿈을 살린 본문 텍스트 */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article|span class="se-[^"]*")>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/[\t  ​]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function isoMinutes(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const m = /^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i.exec(value);
  if (!m || (!m[1] && !m[2])) return undefined;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

function stepTexts(value: unknown): string[] {
  if (typeof value === 'string') return parseRecipeText(value).steps.length ? parseRecipeText(value).steps : [value.trim()].filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value.flatMap((step) => {
    if (typeof step === 'string') return [step.trim()];
    if (step && typeof step === 'object') {
      const s = step as { '@type'?: string; text?: string; itemListElement?: unknown };
      if (s['@type'] === 'HowToSection') return stepTexts(s.itemListElement);
      if (typeof s.text === 'string') return [s.text.trim()];
    }
    return [];
  }).map((t) => decodeEntities(t).replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function findRecipeNode(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = obj['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return obj;
  return findRecipeNode(obj['@graph']);
}

/** schema.org Recipe 구조 데이터(사이트가 검색엔진용으로 공개한 재료·순서) */
export function extractJsonLdRecipe(html: string): ParsedRecipeText | null {
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const recipe = findRecipeNode(data);
    if (!recipe) continue;
    const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const ingredients = rawIngredients
      .filter((x): x is string => typeof x === 'string')
      .map((x) => decodeEntities(x).replace(/\s+/g, ' ').trim())
      .map((x) => parseIngredient(x) ?? { name: x });
    const steps = stepTexts(recipe.recipeInstructions);
    if (!ingredients.length && !steps.length) continue;
    const yieldText = Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield;
    const servings = /(\d+)/.exec(String(yieldText ?? ''))?.[1];
    return {
      title: typeof recipe.name === 'string' ? decodeEntities(recipe.name).trim() : undefined,
      servings: servings ? Number(servings) : undefined,
      minutes: isoMinutes(recipe.totalTime) ?? isoMinutes(recipe.cookTime),
      ingredients,
      steps,
    };
  }
  return null;
}

/** 블로그 본문 영역. 앞에 있는 것이 우선이다. */
const BODY_MARKERS: RegExp[] = [
  /<div[^>]+class="[^"]*\bse-main-container\b[^"]*"[^>]*>/i, // 네이버 블로그 스마트에디터 ONE
  /<div[^>]+id="postViewArea"[^>]*>/i, // 네이버 블로그 구형 에디터
  /<div[^>]+class="[^"]*\b(tt_article_useless_p_margin|contents_style|entry-content|post-content|article-content|view_content)\b[^"]*"[^>]*>/i, // 티스토리 등
  /<article[^>]*>/i,
  /<main[^>]*>/i,
];

/** 여는 태그부터 짝이 맞는 닫는 태그까지 잘라 본문 밖(댓글, 추천 글)을 읽지 않는다. */
export function sliceElement(html: string, start: number): string {
  const tag = /^<([a-z0-9]+)/i.exec(html.slice(start))?.[1]?.toLowerCase() ?? 'div';
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  return html.slice(start, start + 400_000);
}

export function extractBodyText(html: string): string {
  for (const marker of BODY_MARKERS) {
    const m = marker.exec(html);
    if (m) return htmlToText(sliceElement(html, m.index));
  }
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  return htmlToText(body ? body[1] : html);
}

export function pageTitle(html: string): string | undefined {
  const og = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html);
  const title = og?.[1] ?? /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];
  return title ? decodeEntities(title).replace(/\s*[:|-]\s*네이버 블로그\s*$/, '').trim() : undefined;
}

/** 재료·순서가 많이 잡힌 쪽을 고른다. */
export function richness(parsed: ParsedRecipeText | null): number {
  return parsed ? parsed.ingredients.length * 2 + parsed.steps.length : 0;
}

/**
 * 링크 미리보기용으로 사이트가 공개하는 설명(og:description). 인스타그램은 여기에 게시물 캡션 전체를 담는다.
 * `좋아요 12개, 댓글 3개 - user님: "..."` 같은 앞부분은 떼어 낸다.
 */
export function previewCaption(html: string): string | undefined {
  const m = /<meta[^>]+(?:property|name)=["']og:description["'][^>]+content="([^"]*)"/i.exec(html) ?? /<meta[^>]+content="([^"]*)"[^>]+(?:property|name)=["']og:description["']/i.exec(html);
  if (!m) return undefined;
  let text = decodeEntities(m[1]).trim();
  const quoted = /^[^\n]{0,120}?[:：]\s*["“](.*)["”]\s*$/s.exec(text);
  if (quoted) text = quoted[1];
  return text || undefined;
}

