'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./lib');

const RAF = path.join(L.UI, 'scripts', 'raf.js');
const BASLANGIC = path.join(L.UI, 'hooks', 'baslangic.js');
const ONCE = path.join(L.UI, 'hooks', 'once.js');
const CONFIG = { version: '1.1.0', off: false, template: 'neon', targets: ['css'], signature: { off: false } };

const PANEL = [
  '---',
  'tetik: (^|/)Guncelleme[^/]*\\.(axaml|tsx)$',
  'ister: {"dosya":"(^|/)Guncelleme[^/]*\\\\.(axaml|tsx)$","icermez":"Process\\\\.Start","mesaj":"no silent restart"}',
  '---',
  '# Panel',
  '',
  'Body.',
].join('\n');

const LISANS = [
  '---',
  'her: evet',
  'ister: {"dosya":"^LICENSE$","var":true,"mesaj":"LICENSE is missing"}',
  '---',
  '# Lisans',
].join('\n');

const SENKRON = ['---', 'icerik: electron-updater', '---', '# Senkron'].join('\n');

const TEKNIK = '# Panel\n\nTechnical text.\n';

function shelf() {
  const dir = L.tmp('tkui-rafk-');
  L.write(path.join(dir, 'private', 'tercihler', 'guncelleme-paneli.md'), PANEL);
  L.write(path.join(dir, 'teknesyum-ui', 'kurallar', 'guncelleme-paneli.md'), TEKNIK);
  L.write(path.join(dir, 'teknesyum-ui', 'kurallar', 'kabuk.md'), '---\nher: evet\n---\n# Only technical\n');
  L.write(path.join(dir, 'private', 'tercihler', 'lisans.md'), LISANS);
  L.write(path.join(dir, 'private', 'tercihler', 'senkron.md'), SENKRON);
  L.write(path.join(dir, 'private', 'tercihler', 'yazim.md'), '# Yazim\n\nNo frontmatter.\n');
  return dir;
}

function project() {
  const dir = L.tmp('tkui-rafp-');
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function env(shelfDir, cfgDir) {
  return { ...process.env, TEKNESYUM_PRIVATE: shelfDir, CLAUDE_CONFIG_DIR: cfgDir, NO_COLOR: '1' };
}

function cfg() {
  const dir = L.tmp('tkui-rafc-');
  L.write(path.join(dir, 'teknesyum-ui.json'), JSON.stringify(CONFIG));
  return dir;
}

function run(script, args, e, input) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: e, input, windowsHide: true, timeout: 30000 });
}

function fresh(e) {
  delete require.cache[require.resolve(RAF)];
  const saved = process.env.TEKNESYUM_PRIVATE;
  process.env.TEKNESYUM_PRIVATE = e.TEKNESYUM_PRIVATE;
  const raf = require(RAF);
  return { raf, restore: () => (saved === undefined ? delete process.env.TEKNESYUM_PRIVATE : (process.env.TEKNESYUM_PRIVATE = saved)) };
}

function metaAndMatch(e) {
  const { raf, restore } = fresh(e);
  try {
    const books = raf.kitaplar().map((b) => b.ad);
    L.ok('books with frontmatter are enforceable', books.join(',') === 'guncelleme-paneli,lisans,senkron', books.join(','));
    L.ok('a book without frontmatter is not', !books.includes('yazim'));
    L.ok('only the pp shelf is read for enforcement', !books.includes('kabuk'));

    const p = project();
    L.write(path.join(p, 'src', 'main.js'), 'x\n');
    L.ok('her: evet applies to every project', raf.uyan(p).map((b) => b.ad).join(',') === 'lisans');
    L.write(path.join(p, 'src', 'GuncellemePaneli.axaml'), '<UserControl/>\n');
    L.write(path.join(p, 'package.json'), '{"dependencies":{"electron-updater":"1"}}\n');
    L.ok('path and content triggers match', raf.uyan(p).map((b) => b.ad).join(',') === 'guncelleme-paneli,lisans,senkron');

    const bekleyen = raf.bekleyen(p);
    L.ok('unapplied books are pending', bekleyen.length === 3 && bekleyen.every((b) => b.neden === 'hiç uygulanmadı'));

    const lis = raf.kitaplar().find((b) => b.ad === 'lisans');
    L.ok('var: true reports a missing file', raf.denetle(p, lis).length === 1);
    L.write(path.join(p, 'LICENSE'), 'AGPL\n');
    L.ok('var: true passes once the file exists', raf.denetle(p, lis).length === 0);

    L.write(path.join(p, 'src', 'GuncellemePaneli.axaml'), '<UserControl/>\nProcess.Start(x)\n');
    const pan = raf.kitaplar().find((b) => b.ad === 'guncelleme-paneli');
    const f = raf.denetle(p, pan);
    L.ok('icermez reports the line', f.length === 1 && f[0].line === 2 && f[0].file === 'src/GuncellemePaneli.axaml', JSON.stringify(f));
  } finally {
    restore();
  }
}

function uyduCli(e) {
  const p = project();
  L.write(path.join(p, 'src', 'GuncellemePaneli.tsx'), 'Process.Start()\n');
  let r = run(RAF, ['--uydu', 'guncelleme-paneli', '--project', p], e);
  L.ok('--uydu refuses while a check fails', r.status === 1 && !fs.existsSync(path.join(p, '.claude', 'teknesyum-raf.json')), r.stderr);
  L.write(path.join(p, 'src', 'GuncellemePaneli.tsx'), 'ok\n');
  r = run(RAF, ['--uydu', 'guncelleme-paneli', '--project', p], e);
  L.ok('--uydu records once the checks pass', r.status === 0 && /recorded/.test(r.stdout), r.stderr);
  r = run(RAF, ['--uyan', p], e);
  L.ok('--uyan lists state per book', /guncelleme-paneli {2}uygulandı/.test(r.stdout) && /lisans {2}hiç uygulanmadı/.test(r.stdout), r.stdout);
  r = run(RAF, ['--uydu', 'yazim', '--project', p], e);
  L.ok('--uydu rejects a book without frontmatter', r.status === 2);

  L.write(path.join(e.TEKNESYUM_PRIVATE, 'teknesyum-ui', 'kurallar', 'guncelleme-paneli.md'), TEKNIK + 'More.\n');
  r = run(RAF, ['--uyan', p], e);
  L.ok('an edited technical book makes its pp book pending again', /guncelleme-paneli {2}değişti/.test(r.stdout), r.stdout);
  L.write(path.join(e.TEKNESYUM_PRIVATE, 'teknesyum-ui', 'kurallar', 'guncelleme-paneli.md'), TEKNIK);
}

function sessionNote(e) {
  const p = project();
  L.write(path.join(p, 'main.py'), 'print(1)\n');
  let r = run(BASLANGIC, [], e, JSON.stringify({ cwd: p, source: 'startup' }));
  const o = JSON.parse(r.stdout || '{}');
  const ctx = (o.hookSpecificOutput && o.hookSpecificOutput.additionalContext) || '';
  L.ok('SessionStart names a pending book with no UI files', /teknesyum-ui raf:/.test(ctx) && /lisans \(hiç uygulanmadı\)/.test(ctx), ctx);
  L.write(path.join(p, 'LICENSE'), 'x\n');
  run(RAF, ['--uydu', 'lisans', '--project', p], e);
  r = run(BASLANGIC, [], e, JSON.stringify({ cwd: p, source: 'startup' }));
  const ctx2 = r.stdout ? (JSON.parse(r.stdout).hookSpecificOutput || {}).additionalContext || '' : '';
  L.ok('SessionStart drops the book once it is applied', !/teknesyum-ui raf:/.test(ctx2), ctx2);
}

function writeGuard(e) {
  const p = project();
  L.write(path.join(p, '.claude', 'teknesyum-ui.json'), JSON.stringify(CONFIG));
  const file = path.join(p, 'src', 'GuncellemePaneli.axaml');
  const call = (sid) => run(ONCE, [], e, JSON.stringify({ cwd: p, session_id: sid, tool_input: { file_path: file } }));
  const sid = 'rafk-' + Date.now();
  let r = call(sid);
  const o = r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : {};
  L.ok('a write the book names is denied once', o.permissionDecision === 'deny' && /guncelleme-paneli/.test(o.permissionDecisionReason), r.stdout);
  r = call(sid);
  L.ok('the second write in the session goes through', r.stdout === '', r.stdout);
  L.write(path.join(p, 'src', 'GuncellemePaneli.axaml'), 'ok\n');
  run(RAF, ['--uydu', 'guncelleme-paneli', '--project', p], e);
  r = call(sid + '-b');
  L.ok('an applied book never denies', r.stdout === '', r.stdout);
  r = run(ONCE, [], e, JSON.stringify({ cwd: p, session_id: sid + '-c', tool_input: { file_path: path.join(p, 'notes.txt') } }));
  L.ok('a file no book names is never denied', r.stdout === '');
}

function scanRule(e) {
  const p = project();
  L.write(path.join(p, '.claude', 'teknesyum-ui.json'), JSON.stringify(CONFIG));
  L.write(path.join(p, 'src', 'GuncellemePaneli.tsx'), 'export {}\nProcess.Start()\n');
  const r = run(L.SCAN, [p, '--json', '--rules', 'raf'], e);
  let f = [];
  try {
    f = JSON.parse(r.stdout);
  } catch {}
  L.ok('scan reports shelf checks as raf/ister', f.some((x) => x.rule === 'raf/ister' && x.file === 'src/GuncellemePaneli.tsx' && x.line === 2), r.stdout + r.stderr);
  L.ok('scan reports a missing required file', f.some((x) => x.rule === 'raf/ister' && /LICENSE is missing/.test(x.message)));
}

module.exports = function rafkitap() {
  const e = env(shelf(), cfg());
  metaAndMatch(e);
  uyduCli(e);
  sessionNote(e);
  writeGuard(e);
  scanRule(e);
};
