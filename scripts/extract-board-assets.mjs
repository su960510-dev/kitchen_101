// UX 보드(docs/design/ux-board.webp)에서 앱 샘플 이미지를 잘라 assets/images 로 내보낸다.
// 실행: npm i --no-save sharp && node scripts/extract-board-assets.mjs
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const board = path.join(root, 'docs/design/ux-board.webp');
const out = (p) => path.join(root, 'assets/images', p);
const box = (x0, y0, x1, y1) => ({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 });

/** 가장자리에서 배경과 비슷한 픽셀을 flood-fill 해서 투명하게 만든다(피사체 내부 흰색은 보존). */
async function cutout(buf, tolerance = 14) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (x, y) => (y * w + x) * 4;
  const bg = [data[0], data[1], data[2]];
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h || seen[y * w + x]) continue;
    const i = at(x, y);
    const diff = Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
    if (diff > tolerance) continue;
    seen[y * w + x] = 1;
    data[i + 3] = Math.round((diff / tolerance) ** 2 * 120);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function photo(name, region, scale = 4, patches = []) {
  let img = await sharp(board).extract(region).toBuffer();
  for (const p of patches) {
    let patch = sharp(board).extract(p.from);
    if (p.flip) patch = patch.flip();
    if (p.flop) patch = patch.flop();
    const piece = await patch.blur(0.6).toBuffer();
    img = await sharp(img).composite([{ input: piece, left: p.left - region.left, top: p.top - region.top }]).toBuffer();
  }
  await sharp(img)
    .resize({ width: region.width * scale, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.9 })
    .jpeg({ quality: 88 })
    .toFile(out(name));
}

async function sticker(name, region, scale = 4, tolerance = 14) {
  const raw = await sharp(board).extract(region).resize({ width: region.width * scale, kernel: 'lanczos3' }).sharpen({ sigma: 0.8 }).png().toBuffer();
  await sharp(await cutout(raw, tolerance)).png({ compressionLevel: 9 }).toFile(out(name));
}

// 식재료
await sticker('food/tomato.png', box(635, 282, 688, 335));
await sticker('food/lettuce.png', box(633, 356, 690, 410));
await sticker('food/eggs.png', box(631, 432, 689, 486));
await sticker('food/kimchi.png', box(631, 506, 691, 562));
await sticker('food/tomato-banner.png', box(490, 154, 570, 247), 4, 10);
await sticker('food/ing-eggs.png', box(74, 1014, 117, 1044));
await sticker('food/ing-green-onion.png', box(136, 1009, 177, 1047));
await sticker('food/ing-rice.png', box(202, 1012, 243, 1046));
await sticker('food/ing-sesame-oil.png', box(263, 1009, 301, 1047));

// 레시피 사진 (보드 위에 얹힌 UI 요소는 주변 픽셀로 메운다)
await photo('recipes/fried-rice-pan.jpg', box(345, 474, 457, 569));
await photo('recipes/fried-rice-hero.jpg', box(59, 728, 309, 883), 3);
await photo('recipes/kimchi-stew.jpg', box(380, 818, 496, 912), 4, [
  { from: box(402, 864, 474, 887), flip: true, left: 402, top: 887 },
]);
await photo('recipes/egg-rice.jpg', box(507, 818, 623, 912), 4, [
  { from: box(572, 818, 597, 843), flop: true, left: 598, top: 818 },
]);
await photo('recipes/jeyuk.jpg', box(380, 981, 496, 1072));
await photo('recipes/doenjang-stew.jpg', box(507, 981, 623, 1072));
await photo('recipes/tomato-egg.jpg', box(699, 1013, 789, 1109));

// 일러스트 · 라벨 예시
await photo('illustrations/label-sample.jpg', box(927, 139, 1163, 343), 3);
await sticker('illustrations/fridge-check.png', box(749, 767, 900, 912), 3, 10);
await sticker('illustrations/chef-hat.png', box(1005, 842, 1180, 980), 3, 12);
await photo('illustrations/veg-bowl.jpg', box(0, 330, 282, 660), 3);

// 앱 아이콘: 보드 해상도가 낮아 같은 도형을 벡터로 다시 그린다
const mark = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}
  <rect x="222" y="210" width="340" height="604" rx="92" fill="none" stroke="#3B3B3B" stroke-width="44"/>
  <path d="M222 482h340" stroke="#3B3B3B" stroke-width="44"/>
  <path d="M322 310v92M322 566v92" stroke="#3B3B3B" stroke-width="44" stroke-linecap="round"/>
  <path d="M620 330c-30-110 40-200 180-226 20 130-50 226-180 226z" fill="#6DB25B"/>
  <path d="M614 416c70-80 170-90 262-30-60 90-190 110-262 30z" fill="#7DBE69"/>
</svg>`;
await sharp(Buffer.from(mark('#F8F6F2'))).png().toFile(out('app/icon.png'));
await sharp(Buffer.from(mark(null))).png().toFile(out('app/adaptive-foreground.png'));
await sharp(Buffer.from(mark(null))).resize(512).png().toFile(out('app/splash-icon.png'));
await sharp(Buffer.from(mark('#F8F6F2'))).resize(64).png().toFile(out('app/favicon.png'));
