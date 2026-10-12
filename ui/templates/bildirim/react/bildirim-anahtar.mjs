// teknesyum-ui template bildirim/react/bildirim-anahtar.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const key = (process.env.TEKNESYUM_BILDIRIM_KEY || '').trim();
if (key.length < 40) {
  console.error('TEKNESYUM_BILDIRIM_KEY is not set (or too short). The build stops: a release without the key cannot send feedback.');
  process.exit(1);
}
const parts = [];
for (let i = 0; i < key.length; i += 9) parts.push(key.slice(i, i + 9));
const out = join(dirname(fileURLToPath(import.meta.url)), 'bildirim.anahtar.ts');
writeFileSync(out, 'export const ANAHTAR: readonly string[] = ' + JSON.stringify(parts) + ';\n', 'utf8');
console.log('wrote bildirim.anahtar.ts (' + parts.length + ' parts)');
