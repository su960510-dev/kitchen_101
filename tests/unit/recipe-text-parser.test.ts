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
    expect(parsed.ingredients[4]).toEqual({ name: '소금', text: '약간' });
    expect(parsed.steps).toEqual(['대파를 송송 썰어요.', '팬에 대파와 김치를 볶아요.', '밥을 넣고 고루 섞어 주세요.', '참기름을 둘러 마무리해요.']);
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
