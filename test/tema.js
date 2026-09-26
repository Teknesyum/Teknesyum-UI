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
};
