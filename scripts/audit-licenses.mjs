// 설치된 패키지의 라이선스를 집계하고 GPL/AGPL 류를 찾는다. 실행: npm run audit:licenses
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = 'node_modules';
const rows = new Map();

function visit(dir) {
  const manifest = path.join(dir, 'package.json');
  if (existsSync(manifest)) {
    try {
      const p = JSON.parse(readFileSync(manifest, 'utf8'));
      if (p.name && p.version) rows.set(`${p.name}@${p.version}`, typeof p.license === 'string' ? p.license : p.license?.type ?? 'UNKNOWN');
    } catch {
      // 깨진 fixture 는 건너뛴다.
    }
  }
  const nested = path.join(dir, 'node_modules');
  if (existsSync(nested)) scan(nested);
}

function scan(base) {
  for (const name of readdirSync(base)) {
    if (name.startsWith('.')) continue;
    if (name.startsWith('@')) readdirSync(path.join(base, name)).forEach((n) => visit(path.join(base, name, n)));
    else visit(path.join(base, name));
  }
}
scan(root);

const counts = {};
for (const license of rows.values()) counts[license] = (counts[license] ?? 0) + 1;
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v}\t${k}`).join('\n'));
const direct = Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).dependencies);
console.log('\n[runtime dependencies]');
for (const name of direct) {
  const p = JSON.parse(readFileSync(path.join(root, name, 'package.json'), 'utf8'));
  console.log(`${name}@${p.version}\t${typeof p.license === 'string' ? p.license : p.license?.type ?? 'UNKNOWN'}`);
}
const flagged = [...rows].filter(([, l]) => /(^|[^L])GPL|AGPL|SSPL/i.test(l) && !/LGPL/i.test(l));
console.log('\n[copyleft 검토 대상]', flagged.length ? flagged.map(([k, l]) => `${k} (${l})`).join(', ') : '없음');
const unknown = [...rows].filter(([, l]) => l === 'UNKNOWN').map(([k]) => k);
console.log('[라이선스 표기 없음]', unknown.length ? unknown.join(', ') : '없음');
