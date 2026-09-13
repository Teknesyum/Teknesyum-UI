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

module.exports = function () {
  okur();
  ortam();
  beceri();
};
