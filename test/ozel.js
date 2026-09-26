'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

function yerelTokenYollari() {
  const eski = process.env.TEKNESYUM_PRIVATE;
  process.env.TEKNESYUM_PRIVATE = path.join(L.tmp('tk-ozel-yerel-'), 'yok');
  try {
    delete require.cache[require.resolve(path.join(L.UI, 'scripts', 'ozel.js'))];
    const O = require(path.join(L.UI, 'scripts', 'ozel.js'));
    L.ok('tokenYollari is null without a private shelf', O.tokenYollari() === null);
  } finally {
    if (eski === undefined) delete process.env.TEKNESYUM_PRIVATE;
    else process.env.TEKNESYUM_PRIVATE = eski;
  }
}

module.exports = function ozel() {
  yerelTokenYollari();
  const eski = { p: process.env.TEKNESYUM_PRIVATE, g: process.env.TEKNESYUM_OZEL_GITSIZ };
  const raf = L.tmp('tk-ozel-');
  process.env.TEKNESYUM_PRIVATE = raf;
  process.env.TEKNESYUM_OZEL_GITSIZ = '1';
  try {
    const S = require(path.join(L.UI, 'scripts', 'onizleme.js'));
    const O = require(path.join(L.UI, 'scripts', 'ozel.js'));
    const b = { 'x-onizleme': '1', 'content-type': 'application/json' };
    const bos = JSON.parse(S.istek('GET', '/ozel-ayar', '', {}).body);
    L.ok('private settings are empty before the first save', bos.var === false && bos.tur === 'raf');
    const veri = { surum: 1, sihirbaz: true, fark: { renk: { 'renk-1': '#123456' }, yogunluk: 1.1 } };
    const w = S.istek('POST', '/ozel-ayar', JSON.stringify(veri), b);
    const dosya = path.join(raf, 'teknesyum-ui', 'onizleme', 'ayarlar.json');
    L.ok('a private save lands under teknesyum-private/teknesyum-ui/onizleme', w.status === 200 && fs.existsSync(dosya));
    const geri = JSON.parse(S.istek('GET', '/ozel-ayar', '', {}).body);
    L.ok('the saved diff reads back unchanged', geri.var && JSON.stringify(geri.ayar) === JSON.stringify(veri));
    L.ok('a private save never touches the public repo', !fs.existsSync(O.YEREL) || fs.readFileSync(O.YEREL, 'utf8') !== fs.readFileSync(dosya, 'utf8'));
    L.ok('saving does not publish', JSON.parse(w.body).gonderim === undefined);
    L.ok('publishing is a separate request that needs the preview header', S.istek('POST', '/ozel-ayar/yayimla', '', {}).status === 403 && S.istek('POST', '/ozel-ayar/yayimla', '', b).status === 200);
    L.ok('a private save without the preview header is refused', S.istek('POST', '/ozel-ayar', JSON.stringify(veri), {}).status === 403);
    L.ok('a foreign origin is refused', S.istek('POST', '/ozel-ayar', JSON.stringify(veri), Object.assign({ origin: 'https://ornek.com' }, b)).status === 403);
    L.ok('an invalid colour is refused', S.istek('POST', '/ozel-ayar', JSON.stringify({ fark: { renk: { 'renk-1': 'red' } } }), b).status === 400);
    fs.writeFileSync(dosya, JSON.stringify({ surum: 1, fark: { renk: { blue: '#123456', 'pink-text': '#abcdef' }, kaydir: { renk: 'purple-text' } } }));
    const tasinan = JSON.parse(S.istek('GET', '/ozel-ayar', '', {}).body).ayar.fark;
    L.ok('a record with the old colour names reads back with renk-1/2/3', JSON.stringify(tasinan) === JSON.stringify({ renk: { 'renk-1': '#123456', 'renk-2-text': '#abcdef' }, kaydir: { renk: 'renk-3-text' } }), JSON.stringify(tasinan));
    const gi = fs.readFileSync(path.join(L.UI, '..', '.gitignore'), 'utf8');
    L.ok('the local fallback file is gitignored', /^ui\/onizleme\/ozel-ayar\.json$/m.test(gi));

    const yol = O.tokenYollari();
    L.ok('tokenYollari points under the private shelf', yol && yol.tokenlar === path.join(raf, 'teknesyum-ui', 'benim.tokens.json') && yol.notlar === path.join(raf, 'teknesyum-ui', 'benim.notlar.json'), JSON.stringify(yol));

    const tokenYolu = O.tokenYaz({ brand: { 'renk-1': { value: '#112233' } }, _: ['renk-4 karşılığı yok'] });
    L.ok('tokenYaz writes benim.tokens.json and returns its path', tokenYolu === yol.tokenlar && fs.existsSync(yol.tokenlar));
    const yaziTokens = JSON.parse(fs.readFileSync(yol.tokenlar, 'utf8'));
    L.ok('the written token file carries the changed colour', yaziTokens.brand['renk-1'].value === '#112233', yaziTokens.brand['renk-1'].value);
    const yaziNotlar = JSON.parse(fs.readFileSync(yol.notlar, 'utf8'));
    L.ok('benim.notlar.json carries the note array', JSON.stringify(yaziNotlar) === JSON.stringify({ notlar: ['renk-4 karşılığı yok'] }), JSON.stringify(yaziNotlar));

    L.ok('tokenYaz without an object returns null', O.tokenYaz(null) === null && O.tokenYaz([1, 2]) === null);

    const kayit = O.yaz({ surum: 1, fark: { renk: { 'renk-1': '#223344' } }, tokenlar: { brand: { 'renk-2': { value: '#334455' } } } });
    L.ok('yaz strips tokenlar before saving and returns the tokens path', kayit.tokenlar === yol.tokenlar);
    const kayitliDosya = JSON.parse(fs.readFileSync(kayit.yol, 'utf8'));
    L.ok('the saved record never carries a tokenlar field', !('tokenlar' in kayitliDosya), JSON.stringify(kayitliDosya));
    const yeniTokens = JSON.parse(fs.readFileSync(yol.tokenlar, 'utf8'));
    L.ok('yaz forwards its tokenlar to tokenYaz', yeniTokens.brand['renk-2'].value === '#334455', yeniTokens.brand['renk-2'].value);

    L.ok('yaz without a tokenlar field records no tokens path', O.yaz({ surum: 1, fark: { renk: { 'renk-1': '#445566' } } }).tokenlar === null);
  } finally {
    if (eski.p === undefined) delete process.env.TEKNESYUM_PRIVATE;
    else process.env.TEKNESYUM_PRIVATE = eski.p;
    if (eski.g === undefined) delete process.env.TEKNESYUM_OZEL_GITSIZ;
    else process.env.TEKNESYUM_OZEL_GITSIZ = eski.g;
  }
};
