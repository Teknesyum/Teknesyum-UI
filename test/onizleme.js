'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const L = require('./lib');

const SUNUCU = path.join(L.UI, 'scripts', 'onizleme.js');
const SAYFA = path.join(L.UI, 'onizleme');

module.exports = function onizleme() {
  const S = require(SUNUCU);
  const K = require(S.KONTRAST);

  const t = S.yanit('/tokens.json');
  const dosya = JSON.parse(fs.readFileSync(S.TOKENS, 'utf8'));
  L.ok('the preview server returns the token file', t.status === 200 && /json/.test(t.type));
  L.ok('the served tokens equal neon.tokens.json', JSON.stringify(JSON.parse(t.body)) === JSON.stringify(dosya));
  L.ok('the token path is ui/templates/neon.tokens.json', path.relative(L.UI, S.TOKENS).replace(/\\/g, '/') === 'templates/neon.tokens.json');

  const k = S.yanit('/kontrast.js');
  const kaynak = fs.readFileSync(S.KONTRAST, 'utf8');
  L.ok('the contrast module is served verbatim from ui/scripts/kontrast.js', k.status === 200 && k.body.includes(kaynak));
  const pencere = {};
  vm.runInNewContext(k.body, { window: pencere });
  const B = pencere.Kontrast;
  L.ok('the browser build exposes the shared contrast API', !!B && ['parse', 'pair', 'ratio', 'over', 'withAlpha', 'hex', 'fmt'].every((f) => typeof B[f] === 'function'));
  L.ok('browser and node share one formula', B && B.ratio.toString() === K.ratio.toString() && B.pair.toString() === K.pair.toString());
  const r = B && B.pair(B.parse('#00f3ff'), B.parse('#000000'), B.parse('#08090a')).ratio;
  L.ok('the served module measures black on renk-1 as the node module does', r === K.pair(K.parse('#00f3ff'), K.parse('#000000'), K.parse('#08090a')).ratio && B.fmt(r) === '15.3');

  const uyg = fs.readFileSync(path.join(SAYFA, 'uygulama.js'), 'utf8');
  L.ok('the page carries no copy of the luminance formula', !/0\.2126|0\.7152|0\.03928/.test(uyg) && /window\.Kontrast/.test(uyg));
  const html = fs.readFileSync(path.join(SAYFA, 'index.html'), 'utf8');
  L.ok('the page loads the shared module and the tokens from the server', /src="\/kontrast\.js"/.test(html) && /fetch\('\/tokens\.json'/.test(uyg));
  L.ok('the page writes no file', !/writeFile|fs\./.test(uyg));

  L.ok('an unknown path is 404', S.yanit('/../package.json').status === 404 && S.yanit('/yok').status === 404);
  L.ok('the page, style and script are served', ['/', '/stil.css', '/uygulama.js'].every((p) => S.yanit(p).status === 200));

  const kod =
    "const S = require(" + JSON.stringify(SUNUCU) + ");" +
    "S.baslat(0).then(async (s) => {" +
    "  const u = 'http://127.0.0.1:' + s.address().port;" +
    "  const t = await (await fetch(u + '/tokens.json')).json();" +
    "  const k = await (await fetch(u + '/kontrast.js')).text();" +
    "  process.stdout.write(JSON.stringify({ name: t.meta.name, 'renk-1': t.brand['renk-1'].value, shared: k.includes('window.Kontrast') }));" +
    "  s.close();" +
    "});";
  const h = L.run(process.execPath, ['-e', kod], { timeout: 30000 });
  let yanit = null;
  try {
    yanit = JSON.parse(h.stdout);
  } catch {
    yanit = null;
  }
  L.ok(
    'the live server returns the tokens over http',
    yanit && yanit.name === dosya.meta.name && yanit['renk-1'] === dosya.brand['renk-1'].value && yanit.shared,
    h.stdout + h.stderr
  );
};
