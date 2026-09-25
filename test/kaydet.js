'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

module.exports = function kaydet() {
  const K = require(path.join(L.UI, 'scripts', 'kaydet.js'));
  const S = require(path.join(L.UI, 'scripts', 'onizleme.js'));
  const metin = fs.readFileSync(K.TOKENS, 'utf8');
  const T = JSON.parse(metin);

  L.ok('dogrula accepts a colour, a weight and a stop count', K.dogrula({ brand: { blue: { value: '#4499FF' } }, size: { 'fw-semi': { value: 500 } }, derived: { 'bg-gradient': { stops: 12 } } }, T).length === 4);
  const hata = (d) => {
    try {
      K.dogrula(d, T);
      return '';
    } catch (e) {
      return e.message;
    }
  };
  L.ok('dogrula rejects a bad hex', /#rrggbb/.test(hata({ brand: { blue: { value: 'mavi' } } })));
  L.ok('dogrula rejects an out-of-range size', /tamsayı/.test(hata({ shape: { r: { value: 99 } } })));
  L.ok('dogrula rejects an unknown field', /kaydedilemez/.test(hata({ brand: { gizli: { value: '#000000' } } })));
  L.ok('dogrula rejects a font name with markup', /yazı ailesi/.test(hata({ font: { sans: { chain: ['<b>'] } } })));
  L.ok('dogrula ignores the notes key', K.dogrula({ _: ['not'] }, T).length === 0);

  const eskiMavi = T.brand.blue.value.toLocaleLowerCase('en');
  const r = K.tokenMetni(metin, { brand: { blue: { value: '#4499ff' } }, shape: { r: { value: T.shape.r.value + 1 } } });
  const Y = JSON.parse(r.metin);
  L.ok('tokenMetni writes the new values', Y.brand.blue.value === '#4499ff' && Y.shape.r.value === T.shape.r.value + 1);
  L.ok('tokenMetni keeps the line count', r.metin.split('\n').length === metin.split('\n').length);
  L.ok('tokenMetni reports the old and new colour', r.eski.blue === eskiMavi && r.yeni.blue === '#4499ff' && r.ozet.length === 2);
  L.ok('tokenMetni is a no-op for unchanged values', K.tokenMetni(metin, { brand: { blue: { value: eskiMavi } } }).ozet.length === 0);

  const p = K.paletDegistir('a ' + eskiMavi + ' #FF' + eskiMavi.slice(1).toLocaleUpperCase('en') + ' rgba(' + [1, 3, 5].map((i) => parseInt(eskiMavi.slice(i, i + 2), 16)).join(', ') + ', 0.5)', r.eski, r.yeni, '.xaml');
  L.ok('paletDegistir swaps hex, ARGB and rgba', p === 'a #4499ff #FF4499FF rgba(68, 153, 255, 0.5)');

  L.ok('surumArtir bumps the minor', K.surumArtir('0.7.3') === '0.8.0');
  L.ok('surumYaz edits a package file', K.surumYaz('{ "version": "0.7.0" }', '0.7.0', '0.8.0', 'package.json') === '{ "version": "0.8.0" }');
  const log = K.changelogYaz('# C\n\n## [Unreleased]\n\n### Added\n- x\n\n## [0.7.0] - 2026-01-01\n', ['a'], '0.8.0', '2026-09-25');
  L.ok('changelogYaz dates the release and adds the save line', /## \[0\.8\.0\] - 2026-09-25/.test(log) && /### Changed\n- Preview save: a\./.test(log) && !/Unreleased/.test(log));
  L.ok('surumNotu returns the release body', /Preview save: a/.test(K.surumNotu(log, '0.8.0')) && !/0\.7\.0/.test(K.surumNotu(log, '0.8.0')));

  const gecerli = { 'x-onizleme': '1', 'content-type': 'application/json', origin: 'onizleme://sayfa' };
  L.ok('/surum answers the package version', JSON.parse(S.istek('GET', '/surum').body).surum === K.surum());
  L.ok('/kaydet/durum answers idle', JSON.parse(S.istek('GET', '/kaydet/durum').body).calisiyor === false);
  L.ok('/kaydet refuses GET', S.istek('GET', '/kaydet').status === 405);
  L.ok('/kaydet refuses a request without the header', S.istek('POST', '/kaydet', '{}', { 'content-type': 'application/json' }).status === 403);
  L.ok('/kaydet refuses a foreign origin', S.istek('POST', '/kaydet', '{}', { ...gecerli, origin: 'https://ornek.com' }).status === 403);
  L.ok('/kaydet refuses a bad body', S.istek('POST', '/kaydet', 'x', gecerli).status === 400);
  L.ok('/kaydet refuses an invalid field', S.istek('POST', '/kaydet', '{"brand":{"blue":{"value":"x"}}}', gecerli).status === 400);
  L.ok('other paths refuse POST', S.istek('POST', '/tokens.json', '', gecerli).status === 405);
};
