/**
 * 냉장고 파먹기 추천 가중치의 단일 출처. 점수는 UI에 노출하지 않고 정렬에만 쓴다.
 * 요리의 품질·영양·안전 평가가 아니다.
 * score = coverage * COVERAGE + due * DUE_BONUS(상한 적용) + 정착 보너스 - 부족 재료 * PENALTY
 */
export const RECIPE_MATCH_POLICY = {
  COVERAGE_WEIGHT: 1,
  DUE_BONUS_PER_INGREDIENT: 0.5,
  DUE_BONUS_CAP: 1,
  SETTLED_BONUS: 0.2,
  MISSING_PENALTY_PER_INGREDIENT: 0.1,
} as const;

/** 비슷한 이름을 같은 재료로 볼지에 대한 정책. 자동 동의어는 표기 차이만, 근사 일치는 이유에 명시한다. */
export const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  계란: ['달걀', '유정란', '란'],
  밥: ['쌀밥', '즉석밥', '공기밥', '찬밥'],
  돼지고기: ['돼지 고기', '제육', '제육용 돼지고기', '돈육', '삼겹살', '목살', '앞다리살'],
  소고기: ['쇠고기', '한우'],
  김치: ['배추김치', '묵은지', '신김치'],
  두부: ['찌개두부', '부침두부'],
  토마토: ['방울토마토'],
  참기름: ['참 기름'],
  식용유: ['기름', '콩기름', '카놀라유'],
  고추장: ['태양초고추장'],
  된장: ['재래된장'],
};

/** 근사 일치: 자동으로 같다고 단정하지 않고 "대파로 봤어요"처럼 근거를 보여 준다. */
export const APPROXIMATE_INGREDIENTS: [string, string][] = [
  ['파', '대파'],
  ['파', '쪽파'],
  ['고추', '청양고추'],
];
