// 식품 안전 문구·참고 데이터 검사. 실행: npm run verify:food-guidance
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { REFERENCE_GUIDANCE } from '../src/features/food-safety/reference-guidance.ts';

const problems: string[] = [];

for (const g of REFERENCE_GUIDANCE) {
  if (!g.sourceUrl || !g.lastVerifiedOn || !g.storageCondition) problems.push(`출처·조건 누락: ${g.foodType}`);
}

// 사용자에게 보이는 코드에 만료 단정·안전 보증 문구가 들어가지 않게 한다.
const BANNED = [/만료/, /먹어도\s*(돼|됩니다|안전)/, /안전합니다/, /신선합니다/, /정확한\s*자동\s*인식/];
const ALLOWED = new Set(['safety-copy.ts']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(name) ? [full] : [];
  });
}

for (const file of [...walk('app'), ...walk('src')]) {
  if (ALLOWED.has(path.basename(file))) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (BANNED.some((re) => re.test(line))) problems.push(`${file}:${index + 1} ${line.trim()}`);
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`OK: 참고 데이터 ${REFERENCE_GUIDANCE.length}건, 금지 문구 없음`);
