import { parseIngredient, parseRecipeText } from '@/features/recipes/recipe-text-parser';

describe('parseIngredient', () => {
  it.each([
    ['계란 2개', { name: '계란', quantity: 2, unit: '개' }],
    ['간장 1/2큰술', { name: '간장', quantity: 0.5, unit: '큰술' }],
    ['돼지고기 앞다리살 300g', { name: '돼지고기 앞다리살', quantity: 300, unit: 'g' }],
    ['- 대파 반 대', { name: '대파', quantity: 0.5, unit: '대' }],
    ['양파 1개 정도', { name: '양파', quantity: 1, unit: '개' }],
    ['계란2개', { name: '계란', quantity: 2, unit: '개' }],
    ['밥 1.5공기', { name: '밥', quantity: 1.5, unit: '공기' }],
  ])('%s', (raw, expected) => {
    expect(parseIngredient(raw)).toEqual(expected);
  });

  it('keeps vague amounts as text', () => {
    expect(parseIngredient('소금 약간')).toEqual({ name: '소금', text: '약간' });
    expect(parseIngredient('참깨 취향껏')).toEqual({ name: '참깨', text: '취향껏' });
  });

  it('rejects sentences', () => {
    expect(parseIngredient('팬에 기름을 두르고 중불에서 3분 볶아요')).toBeNull();
    expect(parseIngredient('맛있게 드세요')).toBeNull();
  });
});

describe('parseRecipeText', () => {
  it('splits a typical blog post by its headers', () => {
    const text = `초간단 김치볶음밥
2인분 / 조리시간 15분

[재료]
- 김치 1컵
- 밥 2공기
- 대파 1대
- 참기름 1큰술
- 소금 약간

[만드는 법]
1. 대파를 송송 썰어요.
2. 팬에 대파와 김치를 볶아요.
3) 밥을 넣고 고루 섞어 주세요.
① 참기름을 둘러 마무리해요.`;
    const parsed = parseRecipeText(text);
    expect(parsed.title).toBe('초간단 김치볶음밥');
    expect(parsed.servings).toBe(2);
    expect(parsed.minutes).toBe(15);
    expect(parsed.ingredients.map((i) => i.name)).toEqual(['김치', '밥', '대파', '참기름', '소금']);
    expect(parsed.ingredients[4]).toMatchObject({ name: '소금', text: '약간' });
    expect(parsed.steps).toEqual(['대파를 송송 썰어요.', '팬에 대파와 김치를 볶아요.', '밥을 넣고 고루 섞어 주세요.', '참기름을 둘러 마무리해요.']);
    expect(parsed.ingredients.every((i) => i.group === '재료')).toBe(true);
  });

  it('reads comma-separated ingredients on one line, like a video description', () => {
    const parsed = parseRecipeText('재료: 계란 3개, 토마토 2개, 소금 약간\n토마토를 썰어 주세요.\n계란을 스크램블해요.');
    expect(parsed.ingredients).toHaveLength(3);
    expect(parsed.steps).toHaveLength(2);
  });

  it('works without headers', () => {
    const parsed = parseRecipeText('두부 1모\n된장 2큰술\n물을 끓여 된장을 풀어요.\n두부를 넣고 5분 더 끓여요.');
    expect(parsed.ingredients.map((i) => i.name)).toEqual(['두부', '된장']);
    expect(parsed.steps).toHaveLength(2);
  });

  it('separates seasoning sections', () => {
    const parsed = parseRecipeText('재료\n돼지고기 400g\n양념\n고추장 2큰술\n설탕 1큰술\n조리 순서\n고기를 양념에 재워요.');
    expect(parsed.ingredients.map((i) => i.name)).toEqual(['돼지고기', '고추장', '설탕']);
    expect(parsed.steps).toEqual(['고기를 양념에 재워요.']);
  });

  it('returns empty lists for unrelated text', () => {
    const parsed = parseRecipeText('');
    expect(parsed.ingredients).toEqual([]);
    expect(parsed.steps).toEqual([]);
  });
});

describe('SNS caption style', () => {
  // 직접 만든 예시. 이모지 제목, 소제목, 단위 없는 양, 여러 줄 단계, 팁, 해시태그를 담았다.
  const caption = `주말 브런치로 딱이에요 🍳✨
오늘은 남은 재료로 만들어 봤어요!

┄┄┄┄┄┄┄┄
🧺 재료 (2인분)
식빵 4장
계란 2개
우유 밥수저로 3스푼 ➜ 두유로 바꿔도 돼요
⭐️ 버터는 무염이 좋아요

🍯 소스
메이플시럽 2, 시나몬 0.5
설탕, 소금

🍳 만드는 방법
1️⃣ 계란과 우유를 섞어
식빵을 충분히 적셔요
2️⃣ 버터 두른 팬에 [중불]로
앞뒤 3분씩 구워요
✔️ 센 불이면 금방 타요
3️⃣ 소스를 뿌려 마무리해요

#브런치 #프렌치토스트`;

  const parsed = parseRecipeText(caption);

  it('reads emoji headers, servings and title', () => {
    expect(parsed.title).toBe('주말 브런치로 딱이에요');
    expect(parsed.servings).toBe(2);
  });

  it('collects ingredients across sub-sections and skips tips and titles', () => {
    expect(parsed.ingredients.map((i) => i.name)).toEqual(['식빵', '계란', '우유', '메이플시럽', '시나몬', '설탕', '소금']);
    expect(parsed.ingredients.find((i) => i.name === '우유')).toMatchObject({ name: '우유', quantity: 3, unit: '큰술', group: '재료' });
    expect(parsed.ingredients.find((i) => i.name === '시나몬')).toMatchObject({ name: '시나몬', quantity: 0.5, unit: undefined, note: '단위 확인', group: '양념' });
  });

  it('joins wrapped numbered steps into clean sentences and moves tips out', () => {
    expect(parsed.steps).toEqual(['계란과 우유를 섞어 식빵을 충분히 적셔요.', '버터 두른 팬에 중불로 앞뒤 3분씩 구워요.', '소스를 뿌려 마무리해요.']);
    expect(parsed.tips).toEqual(['버터는 무염이 좋아요.', '센 불이면 금방 타요.']);
  });

  it('does not treat a step starting with 재료 as a header', () => {
    expect(parseRecipeText('만드는 법\n1. 재료를 손질해요.').steps).toEqual(['재료를 손질해요.']);
  });
});

describe('normalizeRecipe', () => {
  const { normalizeRecipe, cleanText, finishSentence } = jest.requireActual('@/features/recipes/recipe-normalizer');

  it('cleans decorations and chat marks', () => {
    expect(cleanText('맛있어요 ㅎㅎ!! 🤤')).toBe('맛있어요!');
    expect(cleanText('[약불]에서 5분~~')).toBe('약불에서 5분');
    expect(finishSentence('끓여요 !')).toBe('끓여요.');
    expect(finishSentence('볶아 주세요')).toBe('볶아 주세요.');
  });

  it('unifies units, moves parentheses to notes and removes duplicates', () => {
    const r = normalizeRecipe({
      title: '맛있는 찌개..!! 🍲',
      ingredients: [
        { name: '간장', quantity: 1, unit: 'T' },
        { name: '설탕', quantity: 1, unit: 't' },
        { name: '물', quantity: 500, unit: 'cc' },
        { name: '대파(흰 부분)', quantity: 1, unit: '대' },
        { name: '간장', quantity: 2, unit: '큰술' },
        { name: '고춧가루', quantity: 2 },
      ],
      steps: ['  ', '끓여요'],
    });
    expect(r.title).toBe('맛있는 찌개');
    expect(r.ingredients.map((i: { name: string; unit?: string }) => `${i.name}:${i.unit ?? ''}`)).toEqual(['간장:큰술', '설탕:작은술', '물:ml', '대파:대', '고춧가루:']);
    expect(r.ingredients[3].note).toBe('흰 부분');
    expect(r.ingredients[4].note).toBe('단위 확인');
    expect(r.steps).toEqual(['끓여요.']);
  });
});

