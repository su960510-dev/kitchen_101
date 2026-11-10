import { extractBodyText, extractJsonLdRecipe, htmlToText } from '@/features/recipes/link-import/html-extract';
import { isUnsupportedHost, parsePage, readableUrl } from '@/features/recipes/link-import/link-recipe-importer';
import { pickYoutubeRecipe, toYoutubeSources, youtubeVideoId } from '@/features/recipes/link-import/youtube';

// 모든 HTML·JSON 은 테스트용으로 직접 만든 합성 데이터다.
const JSON_LD_PAGE = `<html><head><title>사이트</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Recipe","name":"두부조림 &amp; 밥",
"recipeYield":"2 servings","totalTime":"PT1H10M","recipeIngredient":["두부 1모","간장 2T","설탕 약간","고명"],
"recipeInstructions":[{"@type":"HowToStep","text":"두부를 썰어요."},{"@type":"HowToSection","itemListElement":[{"@type":"HowToStep","text":"양념을 부어 졸여요."}]}]}]}</script>
</head><body><p>본문</p></body></html>`;

const BLOG_PAGE = `<html><head><meta property="og:title" content="엄마표 된장찌개 : 네이버 블로그"></head><body>
<div class="header">메뉴 로그인 이웃추가</div>
<div class="se-main-container">
  <div class="se-component"><p class="se-text-paragraph"><span>오늘은 된장찌개를 끓였어요.</span></p></div>
  <p class="se-text-paragraph"><span>[재료]</span></p>
  <p class="se-text-paragraph"><span>두부 1모</span></p>
  <p class="se-text-paragraph"><span>된장 2큰술</span></p>
  <p class="se-text-paragraph"><span>애호박&nbsp;1/2개</span></p>
  <p class="se-text-paragraph"><span>[만드는 법]</span></p>
  <p class="se-text-paragraph"><span>1. 물에 된장을 풀어요.</span></p>
  <p class="se-text-paragraph"><span>2. 두부와 애호박을 넣고 끓여요.</span></p>
  <script>var tracking = "재료 9999개";</script>
</div>
<div class="comment">댓글 맛있겠어요</div></body></html>`;

describe('html extraction', () => {
  it('reads schema.org Recipe data, including nested graphs and sections', () => {
    const r = extractJsonLdRecipe(JSON_LD_PAGE)!;
    expect(r.title).toBe('두부조림 & 밥');
    expect(r.servings).toBe(2);
    expect(r.minutes).toBe(70);
    expect(r.ingredients[0]).toEqual({ name: '두부', quantity: 1, unit: '모' });
    expect(r.ingredients[1]).toEqual({ name: '간장', quantity: 2, unit: 'T' });
    expect(r.ingredients[3]).toEqual({ name: '고명' });
    expect(r.steps).toEqual(['두부를 썰어요.', '양념을 부어 졸여요.']);
  });

  it('takes only the blog body and drops scripts', () => {
    const text = extractBodyText(BLOG_PAGE);
    expect(text).not.toContain('로그인');
    expect(text).not.toContain('9999');
    expect(text).toContain('애호박 1/2개');
  });

  it('parses a blog page into a draft with the page title', () => {
    const page = parsePage(BLOG_PAGE)!;
    expect(page.source).toBe('본문');
    expect(page.parsed.title).toBe('엄마표 된장찌개');
    expect(page.parsed.ingredients.map((i) => i.name)).toEqual(['두부', '된장', '애호박']);
    expect(page.parsed.steps).toEqual(['물에 된장을 풀어요.', '두부와 애호박을 넣고 끓여요.']);
  });

  it('prefers structured data when the site provides it', () => {
    expect(parsePage(JSON_LD_PAGE)?.source).toBe('레시피 구조 데이터');
  });

  it('returns null when nothing looks like a recipe', () => {
    expect(parsePage('<html><body><p>안녕하세요</p></body></html>')).toBeNull();
  });

  it('decodes entities and line breaks', () => {
    expect(htmlToText('a&amp;b<br>c&#44;d&#x41;')).toBe('a&b\nc,dA');
  });

  it('opens Naver blog posts through the mobile page', () => {
    expect(readableUrl('https://blog.naver.com/cook123/223456789')).toBe('https://m.blog.naver.com/cook123/223456789');
    expect(readableUrl('https://blog.naver.com/PostView.naver?blogId=cook123&logNo=223456789')).toBe('https://m.blog.naver.com/cook123/223456789');
    expect(readableUrl('https://example.com/a')).toBe('https://example.com/a');
  });
});

describe('unsupported hosts', () => {
  it('recognizes SNS that need login', () => {
    expect(isUnsupportedHost('https://www.instagram.com/p/abc/')).toBe(true);
    expect(isUnsupportedHost('https://instagr.am/p/abc')).toBe(true);
    expect(isUnsupportedHost('https://blog.naver.com/a/1')).toBe(false);
    expect(isUnsupportedHost('https://notinstagram.com/a')).toBe(false);
  });
});

describe('youtube', () => {
  it('finds the video id in every link form', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=abc123XYZ_-&t=1')).toBe('abc123XYZ_-');
    expect(youtubeVideoId('https://youtu.be/abc123XYZ_-')).toBe('abc123XYZ_-');
    expect(youtubeVideoId('https://m.youtube.com/shorts/abc123XYZ_-')).toBe('abc123XYZ_-');
    expect(youtubeVideoId('https://example.com/watch?v=abc')).toBeNull();
  });

  const video = { items: [{ snippet: { title: '10분 제육볶음', channelId: 'UC_owner', description: '구독 부탁드려요!\n#요리 #집밥' } }] };
  const threads = {
    items: [
      { snippet: { topLevelComment: { snippet: { textOriginal: '맛있어 보여요', authorChannelId: { value: 'UC_fan' }, likeCount: 500 } } } },
      { snippet: { topLevelComment: { snippet: { textOriginal: '[재료]\n돼지고기 400g\n고추장 2큰술\n양파 1개\n[만드는 법]\n1. 고기를 양념에 재워요.\n2. 센 불에 볶아요.', authorChannelId: { value: 'UC_owner' }, likeCount: 30 } } } },
    ],
  };

  it("uses the creator's comment when the description has no recipe", () => {
    const pick = pickYoutubeRecipe(toYoutubeSources(video, threads))!;
    expect(pick.source).toBe('작성자 댓글');
    expect(pick.parsed.title).toBe('10분 제육볶음');
    expect(pick.parsed.ingredients).toHaveLength(3);
    expect(pick.parsed.steps).toHaveLength(2);
  });

  it('uses the description when it has the recipe', () => {
    const withDescription = { items: [{ snippet: { ...video.items[0].snippet, description: '재료: 계란 2개, 대파 1대, 밥 1공기, 간장 1큰술\n1. 파기름을 내요.\n2. 밥을 볶아요.' } }] };
    expect(pickYoutubeRecipe(toYoutubeSources(withDescription, { items: [] }))?.source).toBe('설명란');
  });

  it('returns null when no text has ingredients', () => {
    expect(pickYoutubeRecipe(toYoutubeSources(video, { items: [threads.items[0]] }))).toBeNull();
  });
});
