/** UX 보드에서 추출한 번들 이미지(scripts/extract-board-assets.mjs). 예시 데이터와 온보딩에만 쓴다. */
export const SAMPLE_ASSETS: Record<string, number> = {
  tomato: require('@/assets/images/food/tomato.png'),
  'tomato-banner': require('@/assets/images/food/tomato-banner.png'),
  lettuce: require('@/assets/images/food/lettuce.png'),
  eggs: require('@/assets/images/food/eggs.png'),
  kimchi: require('@/assets/images/food/kimchi.png'),
  'ing-eggs': require('@/assets/images/food/ing-eggs.png'),
  'ing-green-onion': require('@/assets/images/food/ing-green-onion.png'),
  'ing-rice': require('@/assets/images/food/ing-rice.png'),
  'ing-sesame-oil': require('@/assets/images/food/ing-sesame-oil.png'),
  'fried-rice': require('@/assets/images/recipes/fried-rice-pan.jpg'),
  'fried-rice-hero': require('@/assets/images/recipes/fried-rice-hero.jpg'),
  'kimchi-stew': require('@/assets/images/recipes/kimchi-stew.jpg'),
  'egg-rice': require('@/assets/images/recipes/egg-rice.jpg'),
  jeyuk: require('@/assets/images/recipes/jeyuk.jpg'),
  'doenjang-stew': require('@/assets/images/recipes/doenjang-stew.jpg'),
  'tomato-egg': require('@/assets/images/recipes/tomato-egg.jpg'),
};

export const ILLUSTRATIONS = {
  fridgeCheck: require('@/assets/images/illustrations/fridge-check.png') as number,
  chefHat: require('@/assets/images/illustrations/chef-hat.png') as number,
  vegBowl: require('@/assets/images/illustrations/veg-bowl.jpg') as number,
  labelSample: require('@/assets/images/illustrations/label-sample.jpg') as number,
};
