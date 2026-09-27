'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const ESLE = path.join(L.UI, 'scripts', 'esle.js');
const E = require(ESLE);
const K = require(path.join(L.UI, 'scripts', 'kaydet.js'));
const T = JSON.parse(fs.readFileSync(K.TOKENS, 'utf8'));

const HER_SECIM = {
  renk: { 'renk-1': '#123456' },
  koyu: false,
  yazi: { carpan: 1.1, govde: 500, yari: 700, kahraman: 900, aile: 'mono' },
  sekil: { r: 6, rPencere: 14 },
  kaydir: { kalinlik: 10, renk: 'renk-2', davranis: 'smooth', bicim: 'solan' },
  arka: { tur: 'izgara', durak: 12, aci: 120, don: true },
  arayuzEgri: 'in-out',
  sure: { fast: 120 },
  parlama: { glow: { alpha: 0.5, blur: 20 } },
  yogunluk: 1.25,
  kenar: 2,
  cam: 24,
  golge: 0.5,
  pencere: { kenar: 'yok', cubuk: 40 },
  dugme: { h: 44, px: 16 },
  etiket: { support: { tr: 'Destekle', ref: 'renk-1', fs: 'fs-2', weight: 'fw-hero' }, title: { en: 'My App' } },
};

function eslemeler() {
  L.ok('the neon template maps to an empty diff', JSON.stringify(E.beklenen(T, {})) === '{}', JSON.stringify(E.beklenen(T, {})));
  L.ok('every preview choice has a token', E.eslenmemis(HER_SECIM).length === 0, E.eslenmemis(HER_SECIM).join(','));
  L.ok('an unknown choice is reported', E.eslenmemis({ yeni: { secim: 1 } }).join() === 'yeni.secim');
  const bek = E.beklenen(T, HER_SECIM);
  const yollar = [];
  for (const [g, a] of Object.entries(bek)) for (const [ad, alan] of Object.entries(a)) for (const k of Object.keys(alan)) yollar.push(g + '.' + ad + '.' + k);
  for (const y of ['shape.window-edge.ref', 'metric.titlebar-h-min.value', 'metric.btn-h.value', 'metric.btn-px.value', 'metric.scrollbar-style.value', 'metric.scroll-behavior.value', 'derived.scrollbar-thumb.ref', 'derived.bg-gradient.type', 'derived.bg-gradient.rotate', 'derived.glass.blur', 'derived.shadow-panel.alpha', 'shape.border-w.value', 'space.1.value', 'easing.out.bezier', 'label.support.tr', 'label.support.weight', 'label.title.en'])
    L.ok('the mapping writes ' + y, yollar.includes(y), yollar.join(','));
  let yazilan = null;
  try {
    yazilan = JSON.parse(K.tokenMetni(fs.readFileSync(K.TOKENS, 'utf8'), bek).metin);
  } catch (e) {
    L.ok('the full mapping passes the validator', false, e.message);
  }
  if (yazilan) {
    L.ok('the full mapping passes the validator', true);
    L.ok('the written tokens equal the mapping', E.tokenUyusmaz(yazilan, bek).length === 0, E.tokenUyusmaz(yazilan, bek).join(','));
  }
  const { ilk, su } = E.durumdan(T, { etiket: { brand: { tr: 'Marka' } } });
  L.ok('a label edit round-trips through the state', su.etiket.brand.tr === 'Marka' && ilk.etiket.brand.tr === T.label.brand.tr);
}

function etiketler() {
  const Et = require(path.join(L.UI, 'scripts', 'etiket.js'));
  const tr = Et.locale(T, 'tr');
  const en = Et.locale(T, 'en');
  L.ok('the tr label file carries every signature key', ['sig.brand', 'sig.brandTitle', 'sig.support', 'sig.supportTitle', 'update.label', 'sync.synced', 'app.title'].every((k) => typeof tr[k] === 'string'), JSON.stringify(tr));
  L.ok('tr and en carry the same keys', Object.keys(tr).join() === Object.keys(en).join());
  L.ok('label css points at colour, size and weight tokens', /--tk-label-support-color: var\(--tk-renk-3-text\)/.test(Et.css(T)) && /--tk-label-title-accent:/.test(Et.css(T)));
}

function kapi() {
  const raf = L.tmp('tkui-esle-raf-');
  const env = L.cleanEnv({ TEKNESYUM_PRIVATE: raf });
  L.write(path.join(raf, 'teknesyum-ui', 'onizleme', 'ayarlar.json'), JSON.stringify({ surum: 1, fark: { pencere: { cubuk: 40 }, dugme: { h: 44 } } }));
  L.write(path.join(raf, 'teknesyum-ui', 'benim.tokens.json'), fs.readFileSync(K.TOKENS, 'utf8'));
  L.write(path.join(raf, 'teknesyum-ui', 'benim.notlar.json'), '{"notlar":["x"]}');
  let r = L.node(ESLE, ['--denetle'], { env });
  L.ok('the gate reports settings that never reached the tokens', r.status === 1 && /ayar ile token ayrı: metric\.btn-h\.value/.test(r.stdout) && /not dosyası/.test(r.stdout), r.stdout + r.stderr);
  L.ok('the gate prints no colour value', !/#[0-9a-f]{6}/i.test(r.stdout));
  r = L.node(ESLE, ['--yaz', '--denetle'], { env });
  L.ok('--yaz makes the gate pass', r.status === 0 && /düzen eşleşmesi 0 fark/.test(r.stdout), r.stdout + r.stderr);
  L.ok('--yaz removes the notes file', !fs.existsSync(path.join(raf, 'teknesyum-ui', 'benim.notlar.json')));

  const root = L.tmp('tkui-esle-proje-');
  r = L.node(L.SETUP, ['--apply', '--template', 'benim', '--targets', 'css,avalonia', '--project', root], { env });
  L.ok('setup --apply ends on a zero layout match', r.status === 0 && /düzen eşleşmesi 0 fark/.test(r.stdout), r.stdout + r.stderr);
  L.ok('setup writes the label files', fs.existsSync(path.join(root, 'teknesyum-ui', 'css', 'labels.tr.json')) && fs.existsSync(path.join(root, 'teknesyum-ui', 'avalonia', 'labels.en.json')));
  const UC = path.join(L.UI, 'scripts', 'uc.js');
  r = L.node(UC, ['--bitti', '--project', root], { env });
  const kayit = (L.readJson(path.join(root, '.claude', 'teknesyum-ui.json')) || {}).uc || {};
  L.ok('uc --bitti records the version once the gate passes', r.status === 0 && /^\d+\.\d+\.\d+$/.test(kayit.surum || ''), r.stdout + r.stderr);
  r = L.node(UC, ['--project', root], { env });
  L.ok('the next uc does not rescan from scratch', /Son uc \d+\.\d+\.\d+ sürümünde tamamlandı/.test(r.stdout) && /Baştan tarama yapma/.test(r.stdout), r.stdout);
  const U = require(UC);
  const arada = U.degisiklikler('0.11.0', '0.13.0');
  L.ok('the changes between two versions come from the changelog', arada.some((l) => /^## \[0\.13\.0\]/.test(l)) && arada.some((l) => /^## \[0\.12\.0\]/.test(l)) && !arada.some((l) => /^## \[0\.11\.0\]/.test(l)), arada.join('\n'));
  const css = path.join(root, 'teknesyum-ui', 'css', 'theme.css');
  fs.writeFileSync(css, fs.readFileSync(css, 'utf8').replace(/--tk-btn-h: \d+px/, '--tk-btn-h: 1px'));
  r = L.node(ESLE, ['--denetle', '--project', root], { env });
  L.ok('the gate catches a generated file that drifted', r.status === 1 && /css\/theme\.css tokenlardan üretilenle aynı değil/.test(r.stdout), r.stdout);
  r = L.node(UC, ['--bitti', '--project', root], { env });
  L.ok('uc --bitti refuses while the gate fails', r.status === 1 && /kayıt yazılmadı/.test(r.stderr), r.stdout + r.stderr);
}

module.exports = function esle() {
  eslemeler();
  etiketler();
  kapi();
};
