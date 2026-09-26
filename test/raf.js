'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const RAF = path.join(L.UI, 'scripts', 'raf.js');

function shelf(books) {
  const home = L.tmp('tkui-raf-');
  const dir = path.join(home, 'private', 'tercihler');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(books))
    fs.writeFileSync(path.join(dir, name + '.md'), body, 'utf8');
  return home;
}

function shelfBoth(kurallar, tercihler) {
  const home = L.tmp('tkui-raf2-');
  const kDir = path.join(home, 'teknesyum-ui', 'kurallar');
  const tDir = path.join(home, 'private', 'tercihler');
  fs.mkdirSync(kDir, { recursive: true });
  fs.mkdirSync(tDir, { recursive: true });
  for (const [name, body] of Object.entries(kurallar || {})) fs.writeFileSync(path.join(kDir, name + '.md'), body, 'utf8');
  for (const [name, body] of Object.entries(tercihler || {})) fs.writeFileSync(path.join(tDir, name + '.md'), body, 'utf8');
  return home;
}

function raf(home, args) {
  return L.node(RAF, args || [], { env: L.cleanEnv({ TEKNESYUM_PRIVATE: home }) });
}

function okur() {
  const home = shelf({ 'ui-duzeni': '# Düzen\n\nkoyu zemin\n', 'guncelleme-paneli': '# Panel\n' });

  const list = raf(home, []);
  L.ok('raf with no name lists the books', list.status === 0 && /ui-duzeni/.test(list.stdout) && /guncelleme-paneli/.test(list.stdout), list.stderr || list.stdout);

  const one = raf(home, ['ui-duzeni']);
  L.ok('raf prints the named book', one.status === 0 && one.stdout.includes('koyu zemin'), one.stderr);

  const miss = raf(home, ['yok-boyle']);
  L.ok('a missing book exits 2 and names the shelf', miss.status === 2 && /yok-boyle/.test(miss.stderr), miss.stderr);

  const bad = raf(home, ['../../gizli']);
  L.ok('a path outside the shelf is refused', bad.status === 2, bad.stdout);

  const empty = raf(path.join(home, 'yok'), ['ui-duzeni']);
  L.ok('no shelf exits 1', empty.status === 1 && /no private shelf/.test(empty.stderr), empty.stderr);
}

function ortam() {
  const home = shelf({ ui: '# ui\n' });
  const r = raf(home, ['--help']);
  L.ok('--help exits 0 and shows the shelf path', r.status === 0 && r.stdout.includes('tercihler'), r.stdout);

  const cfg = L.tmp('tkui-cfghome-');
  fs.mkdirSync(path.join(cfg, 'teknesyum-private', 'private', 'tercihler'), { recursive: true });
  fs.writeFileSync(path.join(cfg, 'teknesyum-private', 'private', 'tercihler', 'yazim.md'), '# yazım\n', 'utf8');
  const viaCfg = L.node(RAF, [], { env: { ...process.env, CLAUDE_CONFIG_DIR: cfg, TEKNESYUM_PRIVATE: '', NO_COLOR: '1' } });
  L.ok('without TEKNESYUM_PRIVATE the shelf is found under the config dir', viaCfg.status === 0 && /yazim/.test(viaCfg.stdout), viaCfg.stderr || viaCfg.stdout);
}

function beceri() {
  const text = fs.readFileSync(path.join(L.SKILL, 'SKILL.md'), 'utf8');
  L.ok('SKILL.md points at raf.js for the rules', /raf\.js/.test(text));
  L.ok('SKILL.md names the update book', /guncelleme-paneli/.test(text));
  L.ok('SKILL.md names the readme book', /readme-protokolu/.test(text));
  L.ok('SKILL.md says a book is read once per session', /compact/i.test(text));
}

function ikiRaf() {
  const home = shelfBoth(
    { 'ui-duzeni': '# kurallar\n\nkurallardan\n', 'AGENTS': '# AGENTS\n', 'CLAUDE': '# CLAUDE\n' },
    { 'ui-duzeni': '# tercihler\n\ntercihlerden\n', 'guncelleme-paneli': '# Panel\n', 'claude': '# claude\n' }
  );

  const list = raf(home, []);
  L.ok('the shelf list is the union of kurallar and tercihler', list.status === 0 && /ui-duzeni/.test(list.stdout) && /guncelleme-paneli/.test(list.stdout), list.stdout);
  L.ok('AGENTS.md and CLAUDE.md are never listed, in either casing', !/agents/i.test(list.stdout) && !/claude/i.test(list.stdout), list.stdout);

  const names = list.stdout.trim().split(/\r?\n/).filter(Boolean);
  L.ok('a book present in both shelves is listed once', names.filter((n) => n === 'ui-duzeni').length === 1, list.stdout);

  const one = raf(home, ['ui-duzeni']);
  L.ok('oku prefers kurallar over tercihler for the same book', one.status === 0 && one.stdout.includes('kurallardan') && !one.stdout.includes('tercihlerden'), one.stdout);

  const other = raf(home, ['guncelleme-paneli']);
  L.ok('a book that only exists on tercihler still reads', other.status === 0 && other.stdout.includes('Panel'), other.stdout);
}

function sadeceKurallar() {
  const home = shelfBoth({ 'yalniz-kural': '# Tek\n' }, null);
  fs.rmSync(path.join(home, 'private'), { recursive: true, force: true });

  const list = raf(home, []);
  L.ok('a shelf with only teknesyum-ui/kurallar still lists its books', list.status === 0 && /yalniz-kural/.test(list.stdout), list.stdout);

  const one = raf(home, ['yalniz-kural']);
  L.ok('a shelf with only kurallar reads its book', one.status === 0 && one.stdout.includes('Tek'), one.stdout);
}

module.exports = function () {
  okur();
  ortam();
  ikiRaf();
  sadeceKurallar();
  beceri();
};
