'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

module.exports = function tema() {
  const M = require(path.join(L.UI, 'scripts', 'tema.js'));
  const O = require(path.join(L.UI, 'scripts', 'onizleme.js'));
  const hepsi = M.liste();

  L.ok('nine public themes, five light and four dark', hepsi.length === 9 && hepsi.filter((t) => t.tur === 'acik').length === 5 && hepsi.filter((t) => t.tur === 'koyu').length === 4);
  L.ok('karbon is not a public theme', !hepsi.some((t) => t.ad === 'karbon'));
  L.ok('theme names are unique', new Set(hepsi.map((t) => t.ad)).size === hepsi.length);
  for (const t of hepsi) {
    const r = M.denetle(t);
    L.ok(t.ad + ' passes the 7:1 gate and scores at least 85', r.uretim && r.skor.genel >= 85);
    L.ok(t.ad + ' sets meta.dark from its kind', JSON.parse(M.tokenlar(t)).meta.dark === (t.tur === 'koyu'));
  }
  const eskiTema = JSON.parse(fs.readFileSync(path.join(M.DIZIN, hepsi[0].ad + '.json'), 'utf8'));
  eskiTema.renk = Object.fromEntries(Object.entries(eskiTema.renk).map(([k, v]) => [k.replace('renk-1', 'blue').replace('renk-2', 'pink').replace('renk-3', 'purple'), v]));
  const eskiDosya = path.join(L.tmp('tk-tema-'), eskiTema.ad + '.json');
  fs.writeFileSync(eskiDosya, JSON.stringify(eskiTema));
  L.ok('a theme with the old colour names reads with renk-1/2/3', JSON.stringify(M.oku(eskiDosya).renk) === JSON.stringify(hepsi[0].renk));
  const s = O.yanit('/temalar.json');
  const g = s.status === 200 ? JSON.parse(s.body) : [];
  L.ok('/temalar.json lists every public theme and marks private ones', hepsi.every((t) => g.some((x) => x.ad === t.ad)) && g.every((x) => typeof x.ozel === 'boolean') && g.filter((x) => x.ozel).length === M.ozelListe().length);

  const sablon = path.join(M.DIZIN, 'react');
  const acik = M.acikListe();
  L.ok('the shipped themes.json is the standard look plus the nine public themes', fs.readFileSync(path.join(sablon, 'themes.json'), 'utf8').replace(/\r\n/g, '\n') === M.ortakMetin(acik) && acik.length === 10 && acik[0].id === 'standart');
  L.ok('without a shelf the shared list comes from the plugin', M.ortakListe().kaynak === 'eklenti');

  const eskiRaf = process.env.TEKNESYUM_PRIVATE;
  const raf = L.tmp('tk-raf-');
  const proje = L.tmp('tk-tema-proje-');
  try {
    process.env.TEKNESYUM_PRIVATE = raf;
    fs.mkdirSync(path.join(raf, 'teknesyum-ui', 'temalar'), { recursive: true });
    fs.writeFileSync(path.join(raf, 'teknesyum-ui', 'temalar', 'temalar.json'), JSON.stringify(acik.slice(0, 3)));
    const o = M.ortakListe();
    L.ok('a shelf temalar.json becomes the shared list', o.kaynak === 'raf' && o.liste.length === 3);
    L.ok('the shared list file is not read as a single private theme', M.ozelListe().length === 0);
    fs.mkdirSync(path.join(proje, 'teknesyum-ui', 'temalar'), { recursive: true });
    L.ok('a project without themes.json is left alone', M.projeTazele(proje) === null);
    fs.writeFileSync(M.projeListesi(proje), '[]\n');
    const ilk = M.projeTazele(proje);
    const ikinci = M.projeTazele(proje);
    L.ok('the project list is refreshed from the shelf, once', ilk.yazildi && ilk.sayi === 3 && !ikinci.yazildi && JSON.parse(fs.readFileSync(M.projeListesi(proje), 'utf8')).length === 3);
  } finally {
    process.env.TEKNESYUM_PRIVATE = eskiRaf;
  }

  let ts = null;
  try {
    ts = require(path.join(L.UI, '..', 'test', 'tsx', 'node_modules', 'typescript'));
  } catch {
    ts = null;
  }
  if (ts) {
    const js = ts.transpileModule(fs.readFileSync(path.join(sablon, 'theme.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const yukle = (liste) => {
      const exports = {};
      new Function('require', 'exports', js)(() => liste, exports);
      return exports;
    };
    const sayi = (v) => (v.match(/\d+/g) || []).slice(0, 3).map(Number);
    const zayif = (liste) => {
      const K = yukle(liste);
      const out = [];
      for (const th of liste) {
        const tok = K.themeTokens(th);
        for (const ad of K.TEXT_TOKENS)
          for (const zemin of [th.black, th.surface]) if (K.ratio(sayi(tok[ad]), K.rgb(zemin)) < K.MIN_RATIO) out.push(th.id + ' ' + ad);
      }
      return out;
    };
    const a = zayif(acik);
    L.ok('every shipped theme keeps its text tokens at 4.5:1 on ground and panel', a.length === 0, a.join(', '));
    const K = yukle(acik);
    const tok = K.themeTokens(acik[1]);
    L.ok('a theme sets the panel, scrim and tint tokens too', ['--tk-panel', '--tk-scrim', '--tk-renk-1-10', '--tk-track', '--tk-window-edge'].every((n) => typeof tok[n] === 'string'));
    L.ok('light and dark themes are told apart by their ground', acik.some((t) => K.isLight(t)) && acik.some((t) => !K.isLight(t)));
    const gercek = path.join(require('os').homedir(), '.claude', 'teknesyum-private', 'teknesyum-ui', 'temalar', 'temalar.json');
    if (fs.existsSync(gercek)) {
      const r = zayif(JSON.parse(fs.readFileSync(gercek, 'utf8')));
      L.ok('every shelf theme keeps its text tokens at 4.5:1', r.length === 0, r.join(', '));
    }
  }
};
