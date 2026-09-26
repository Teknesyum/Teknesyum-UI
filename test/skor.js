'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

module.exports = function skor() {
  const S = require(path.join(L.UI, 'scripts', 'skor.js'));
  const O = require(path.join(L.UI, 'scripts', 'onizleme.js'));
  const T = JSON.parse(fs.readFileSync(path.join(L.UI, 'templates', 'neon.tokens.json'), 'utf8'));

  const yakin = (a, b) => Math.abs(a - b) < 1e-9;
  L.ok('puan hits its anchors', yakin(S.puan(1), 0) && yakin(S.puan(3), 30) && yakin(S.puan(4.5), 50) && yakin(S.puan(7), 70) && yakin(S.puan(12), 90) && S.puan(21) === 100);
  const dizi = [1, 1.5, 2, 3, 4, 5, 6, 7, 8, 10, 14, 18, 21].map(S.puan);
  L.ok('puan rises with contrast', dizi.every((p, i) => i === 0 || p > dizi[i - 1] || p === 100));
  L.ok('not bands', S.not(95) === 'Mükemmel' && S.not(70) === 'İyi' && S.not(69.9) === 'Zayıf' && S.not(10) === 'Kötü');

  const A = S.skorla(T, {});
  L.ok('skorla resolves every part and scores 0–100', A.paneller.length === S.PANELLER.length && A.genel > 0 && A.genel <= 100);
  const w = A.paneller.flatMap((p) => p.ogeler);
  const elle = w.reduce((t, o) => t + o.puan * o.agirlik, 0) / w.reduce((t, o) => t + o.agirlik, 0);
  L.ok('genel is the usage-weighted mean', yakin(A.genel, elle));

  const koyu = S.skorla(T, { blue: '#2050c0' });
  L.ok('a darker blue lowers the score', koyu.genel < A.genel);
  L.ok('the blue parts drop, the body text holds', koyu.paneller[0].ogeler[0].puan === A.paneller[0].ogeler[0].puan && koyu.paneller[0].ogeler[2].puan < A.paneller[0].ogeler[2].puan);
  const soluk = S.skorla(T, { text: '#50535c' });
  L.ok('heavy parts weigh more than light ones', A.genel - soluk.genel > A.genel - S.skorla(T, { disabled: '#202228' }).genel);

  L.ok('onSec keeps the token pair above 7:1', S.onSec(T, {}, 'blue').ad === T.on.blue.on);
  L.ok('onSec switches when the pair drops below 7:1', S.onSec(T, { blue: '#2050c0' }, 'blue').ad === 'text');

  const r = O.yanit('/skor.js');
  L.ok('/skor.js is served for the page', r.status === 200 && r.body.includes('window.Skor = module.exports'));
};
