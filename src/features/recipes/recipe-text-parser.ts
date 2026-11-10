/**
 * 사용자가 직접 붙여넣은 레시피 글을 재료·조리 순서 초안으로 나눈다. 기기 안에서만 동작하고 네트워크를 쓰지 않는다.
 * 결과는 사용자가 편집기에서 확인·수정한 뒤 저장한다. 붙여넣은 원문은 저장하지 않는다.
 */
export interface ParsedIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  /** '약간', '적당량' 같은 비정량 표현 */
  text?: string;
}

export interface ParsedRecipeText {
  title?: string;
  servings?: number;
  minutes?: number;
  ingredients: ParsedIngredient[];
  steps: string[];
}

const UNITS = [
  'kg', 'g', 'ml', 'mL', 'L', 'l', 'cc', '큰술', '작은술', '스푼', '숟가락', '티스푼', 'T', 't', '컵', '공기', '개', '알', '대', '쪽', '모', '줄기', '뿌리', '장', '마리', '봉지', '봉', '캔', '팩', '줌', '꼬집', '토막', '조각', '통', '송이', '인분',
];
const UNIT_PATTERN = UNITS.sort((a, b) => b.length - a.length).map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const VAGUE = /^(약간|적당량|적당히|조금|소량|취향껏|기호에\s*따라|한\s*꼬집|넉넉히|듬뿍)$/;
const KOREAN_NUMBER: Record<string, number> = { 반: 0.5, 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5 };

const INGREDIENT_HEADER = /^\[?\s*(재료|주재료|부재료|준비\s*재료|준비물|양념장|양념|소스|ingredients?)(?![가-힣a-z])\s*\]?\s*(\([^)]*\))?\s*[:：]?\s*/i;
const STEP_HEADER = /^\[?\s*(만드는\s*(법|방법)|만들기|조리\s*(법|방법|순서)|요리\s*(법|방법|순서)|순서|레시피|directions?|instructions?|steps?|how\s*to)(?![가-힣a-z])\s*\]?\s*[:：]?\s*$/i;
const BULLET = /^[\s\-–—•·*▶►▷○●◎□■①-⑳]+/;
const NUMBERED = /^\s*(?:step\s*\d+|\d+\s*[.)．、]|\(\d+\)|[①-⑳])\s*/i;
/** 줄 앞의 이모지·기호. 체크·별·전구 같은 표시는 팁 줄로 본다. */
const LEADING_DECOR = /^[\s\p{Extended_Pictographic}️‍⃣✔✓☑⭐★☆※➜→👉\-–—•·*▶►▷○●◎□■]+/u;
const TIP_MARK = /^[\s️]*(✔|✓|☑|⭐|★|☆|💡|※|➜|→|👉|tip\b)/iu;
const SPOON_PHRASE = /\s*(밥\s*수저|밥\s*숟가락|숟가락|계량\s*스푼|종이컵)\s*로\s*/g;

function parseQuantity(raw: string): { quantity?: number; unit?: string; text?: string } | null {
  const value = raw.trim();
  if (!value) return null;
  if (VAGUE.test(value)) return { text: value };
  const m = new RegExp(`^(\\d+(?:\\.\\d+)?(?:\\s*/\\s*\\d+)?|½|⅓|¼|반|한|두|세|네|다섯)\\s*(${UNIT_PATTERN})?\\s*(?:정도|가량)?$`).exec(value);
  if (!m) return null;
  let quantity: number;
  const n = m[1].replace(/\s/g, '');
  if (n.includes('/')) {
    const [a, b] = n.split('/').map(Number);
    quantity = a / b;
  } else if (n === '½') quantity = 0.5;
  else if (n === '⅓') quantity = 1 / 3;
  else if (n === '¼') quantity = 0.25;
  else quantity = KOREAN_NUMBER[n] ?? Number(n);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return { quantity: Math.round(quantity * 100) / 100, unit: m[2] };
}

/** `계란 2개`, `간장 1/2큰술`, `소금 약간`, `대파(흰 부분) 1대` */
export function parseIngredient(raw: string): ParsedIngredient | null {
  const line = raw.replace(BULLET, '').replace(/\s+/g, ' ').trim();
  if (!line || line.length > 40) return null;
  const tokens = line.split(' ');
  for (let cut = tokens.length - 1; cut >= 1; cut--) {
    const name = tokens.slice(0, cut).join(' ');
    const amount = parseQuantity(tokens.slice(cut).join(' '));
    if (amount && /[가-힣a-zA-Z]/.test(name)) return { name: name.replace(/[:：]$/, ''), ...amount };
  }
  // 붙어 쓴 경우: `계란2개`
  const glued = new RegExp(`^([가-힣a-zA-Z()\\s]+?)(\\d+(?:\\.\\d+)?(?:/\\d+)?\\s*(?:${UNIT_PATTERN})?)$`).exec(line);
  if (glued) {
    const amount = parseQuantity(glued[2]);
    if (amount) return { name: glued[1].trim(), ...amount };
  }
  return null;
}

function looksLikeStep(line: string): boolean {
  return NUMBERED.test(line) || (line.length >= 8 && /(요|다|세요|니다|주세요|줍니다)[.!~]?$/.test(line));
}

interface CleanLine {
  text: string;
  tip: boolean;
}

/** `1️⃣` 같은 숫자 이모지는 `1.` 로 바꾸고, 앞의 장식 기호와 뒤의 `➜ 보충 설명`을 떼어 낸다. */
function cleanLine(raw: string): CleanLine | null {
  let line = raw.trim().replace(/^(\d)️?⃣\s*/, '$1. ');
  if (!/[\p{L}\p{N}]/u.test(line)) return null; // 구분선
  if (/^#/.test(line) || /^-?\s*@[\w.]+ on /.test(line)) return null; // 해시태그, 게시 정보
  const tip = TIP_MARK.test(line);
  if (!NUMBERED.test(line)) line = line.replace(LEADING_DECOR, '');
  line = line.replace(/\s*(➜|→|👉)\s.*$/u, '').replace(/[\s\p{Extended_Pictographic}️]+$/u, '').trim();
  return line ? { text: line, tip } : null;
}

/** 재료 목록 안의 이름만 있는 항목: `후추`, `우동사리 등` */
function bareIngredient(part: string): ParsedIngredient | null {
  const name = part.trim().replace(/\s*등$/, '');
  if (!name || name.length > 8 || !/^[가-힣a-zA-Z ]+$/.test(name) || /(요|다|함|기)$/.test(name)) return null;
  return { name };
}

/** 재료 목록 안의 소제목: `다대기`, `부추무침`, `국밥 먹을 때` */
function isGroupTitle(line: string): boolean {
  return line.length <= 12 && !/[\d]/.test(line) && !/(요|다|세요|니다)[.!~]?$/.test(line) && !line.includes(',');
}

export function parseRecipeText(input: string): ParsedRecipeText {
  const lines = input
    .replace(/\r/g, '')
    .split('\n')
    .map(cleanLine)
    .filter((l): l is CleanLine => !!l);
  const result: ParsedRecipeText = { ingredients: [], steps: [] };
  const seen = new Set<string>();
  const addIngredient = (ingredient: ParsedIngredient) => {
    const name = ingredient.name.replace(SPOON_PHRASE, ' ').replace(/\s+/g, ' ').trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    result.ingredients.push({ ...ingredient, name });
  };
  let mode: 'unknown' | 'ingredients' | 'steps' = 'unknown';
  let numberedSteps = false;
  // '만드는 법' 같은 제목이 있으면 그 앞의 문장(인사말, 소개)은 순서로 보지 않는다.
  const hasStepHeader = lines.some((l) => STEP_HEADER.test(l.text));

  for (const [index, { text: line, tip }] of lines.entries()) {
    const servings = /(\d+)\s*인분/.exec(line);
    if (servings && !result.servings) result.servings = Number(servings[1]);
    const minutes = /(조리\s*시간|소요\s*시간|시간)\s*[:：]?\s*(?:약\s*)?(\d+)\s*분/.exec(line);
    if (minutes && !result.minutes) result.minutes = Number(minutes[2]);

    if (STEP_HEADER.test(line)) {
      mode = 'steps';
      continue;
    }
    const header = INGREDIENT_HEADER.exec(line);
    if (header && mode !== 'steps') {
      mode = 'ingredients';
      const rest = line.slice(header[0].length).trim();
      // `재료: 계란 2개, 대파 1대` 처럼 한 줄에 이어 쓴 경우
      rest.split(/[,，、·/]/).forEach((part) => {
        const ingredient = parseIngredient(part.replace(SPOON_PHRASE, ' '));
        if (ingredient) addIngredient(ingredient);
      });
      continue;
    }

    if (mode !== 'steps' && !NUMBERED.test(line)) {
      const parts = line.replace(SPOON_PHRASE, ' ').split(/[,，、]/);
      // 이름만 있는 항목은 쉼표로 나열된 재료 목록 안에서만 인정한다(소제목과 구분).
      const parsed = parts.map((p) => parseIngredient(p) ?? (mode === 'ingredients' && parts.length > 1 ? bareIngredient(p) : null));
      if (parsed.every(Boolean) && parsed.some((p) => p!.quantity != null || p!.text != null || mode === 'ingredients')) {
        parsed.forEach((p) => addIngredient(p!));
        if (mode === 'unknown') mode = 'ingredients';
        continue;
      }
      // 재료 구역 안의 팁·소제목·보충 설명은 건너뛴다.
      if (mode === 'ingredients' && (tip || isGroupTitle(line) || !looksLikeStep(line) || hasStepHeader)) continue;
    }

    if (mode === 'steps' || (!hasStepHeader && looksLikeStep(line))) {
      mode = 'steps';
      const last = result.steps.length - 1;
      if (NUMBERED.test(line)) {
        numberedSteps = true;
        const step = line.replace(NUMBERED, '').trim();
        if (step) result.steps.push(step);
      } else if (last >= 0 && (tip || numberedSteps)) {
        // 번호 단계의 다음 줄과 팁은 앞 단계에 이어 붙인다.
        result.steps[last] = tip ? `${result.steps[last]} (팁: ${line})` : `${result.steps[last]} ${line}`;
      } else {
        result.steps.push(line.replace(BULLET, '').trim());
      }
      continue;
    }

    // 첫 줄의 짧은 문장은 제목으로 본다.
    if (index === 0 && !result.title && line.length <= 40 && !servings) result.title = line.replace(BULLET, '');
  }
  return result;
}
