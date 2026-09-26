'use strict';

const path = require('path');
const L = require('./lib');

module.exports = function tema() {
  const M = require(path.join(L.UI, 'scripts', 'tema.js'));
  const O = require(path.join(L.UI, 'scripts', 'onizleme.js'));
  const hepsi = M.liste();

  L.ok('ten themes, five light and five dark', hepsi.length === 10 && hepsi.filter((t) => t.tur === 'acik').length === 5 && hepsi.filter((t) => t.tur === 'koyu').length === 5);
  L.ok('theme names are unique', new Set(hepsi.map((t) => t.ad)).size === hepsi.length);
  for (const t of hepsi) {
    const r = M.denetle(t);
    L.ok(t.ad + ' passes the 7:1 gate and scores at least 85', r.uretim && r.skor.genel >= 85);
    L.ok(t.ad + ' sets meta.dark from its kind', JSON.parse(M.tokenlar(t)).meta.dark === (t.tur === 'koyu'));
  }
  const s = O.yanit('/temalar.json');
  L.ok('/temalar.json lists every theme', s.status === 200 && JSON.parse(s.body).length === hepsi.length);
};
