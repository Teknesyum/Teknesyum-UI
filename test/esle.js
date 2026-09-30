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
  const toplu = L.tmp('tkui-toplu-');
  const eskiProje = path.join(toplu, 'Eski');
  L.write(path.join(eskiProje, '.claude', 'teknesyum-ui.json'), JSON.stringify({ uc: { surum: '0.1.0' } }));
  L.write(path.join(toplu, 'Guncel', '.claude', 'teknesyum-ui.json'), JSON.stringify((L.readJson(path.join(root, '.claude', 'teknesyum-ui.json')) || {})));
  L.write(path.join(toplu, 'Bagsiz', 'x.txt'), '1');
  r = L.node(UC, ['--toplu', toplu, '--yaz'], { env });
  L.ok('uc --toplu lists only the projects behind this version', /^Eski: 0\.1\.0 → /m.test(r.stdout) && !/Guncel|Bagsiz/.test(r.stdout), r.stdout + r.stderr);
  L.node(UC, ['--toplu', toplu, '--yaz'], { env });
  const defter = fs.readFileSync(path.join(eskiProje, '.claude', 'acik.md'), 'utf8');
  L.ok('uc --toplu --yaz writes one uc line to the ledger, once', (defter.match(/^- \[ \] UI güncellemesi: 0\.1\.0 → /gm) || []).length === 1, defter);
  fs.writeFileSync(path.join(eskiProje, '.claude', 'acik.md'), '- [ ] başka iş\n- [ ] uc çalıştır: UI hiç → 0.0.1 (`node "eski/uc.js"` çıktısını izle) — 2026-01-01 00:00 — teknesyum-ui\n');
  r = L.node(UC, ['--toplu', toplu, '--yaz'], { env });
  const tazelenen = fs.readFileSync(path.join(eskiProje, '.claude', 'acik.md'), 'utf8');
  L.ok('an open uc line from an older version moves to this version', /tazelendi/.test(r.stdout) && !/eski\/uc\.js/.test(tazelenen) && (tazelenen.match(/uc çalıştır|UI güncellemesi/g) || []).length === 1 && /başka iş/.test(tazelenen), tazelenen);
  const A = require(path.join(L.UI, 'scripts', 'artik.js'));
  const art = L.tmp('tkui-artik-');
  require('child_process').spawnSync('git', ['init', '-q', art], { windowsHide: true });
  L.write(path.join(art, '.gitignore'), 'bin/\nnode_modules/\n');
  L.write(path.join(art, 'bin', 'Debug', 'a.dll'), 'x'.repeat(4096));
  L.write(path.join(art, 'dist', 'app.js'), 'izli');
  L.write(path.join(art, 'node_modules', 'p', 'i.js'), 'x');
  require('child_process').spawnSync('git', ['-C', art, 'add', '-f', 'dist/app.js'], { windowsHide: true });
  const kalem = A.tara(art);
  const bul = (r) => kalem.find((x) => x.rel === r) || {};
  L.ok('artik finds ignored build output as deletable', bul('bin').sil === true && bul('bin').bayt >= 4096, JSON.stringify(kalem));
  L.ok('artik never deletes tracked output or node_modules', bul('dist').sil === false && bul('node_modules').sil === false, JSON.stringify(kalem));
  A.temizle(art, kalem);
  L.ok('artik --sil removes only the deletable items', !fs.existsSync(path.join(art, 'bin')) && fs.existsSync(path.join(art, 'dist', 'app.js')) && fs.existsSync(path.join(art, 'node_modules')));
  L.ok('the uc instruction carries the leftover step', /artik\.js/.test(U.metin({ cwd: root })));
  L.ok('the uc instruction runs artik --sil and asks a reason for what stays', /--sil` ile çalıştır/.test(U.metin({ cwd: root })) && /gerekçe/.test(U.metin({ cwd: root })));
  L.ok('the uc instruction holds a new icon until the owner approves', /Onay gelene kadar simgeyi/.test(U.metin({ cwd: root })));
  L.ok('uc renk prints the short palette refresh, not the full audit', /^uc renk:/.test(U.metin({ cwd: root, kapsam: 'renk' })) && /setup\.js" --apply/.test(U.metin({ cwd: root, kapsam: 'renk' })) && !/artik\.js/.test(U.metin({ cwd: root, kapsam: 'renk' })));
  const arada = U.degisiklikler('0.11.0', '0.13.0');
  L.ok('the changes between two versions come from the changelog', arada.some((l) => /^## \[0\.13\.0\]/.test(l)) && arada.some((l) => /^## \[0\.12\.0\]/.test(l)) && !arada.some((l) => /^## \[0\.11\.0\]/.test(l)), arada.join('\n'));
  const css = path.join(root, 'teknesyum-ui', 'css', 'theme.css');
  fs.writeFileSync(css, fs.readFileSync(css, 'utf8').replace(/--tk-btn-h: \d+px/, '--tk-btn-h: 1px'));
  r = L.node(ESLE, ['--denetle', '--project', root], { env });
  L.ok('the gate catches a generated file that drifted', r.status === 1 && /css\/theme\.css tokenlardan üretilenle aynı değil/.test(r.stdout), r.stdout);
  r = L.node(UC, ['--bitti', '--project', root], { env });
  L.ok('uc --bitti refuses while the gate fails', r.status === 1 && /kayıt yazılmadı/.test(r.stderr), r.stdout + r.stderr);
  const eskiCfg = { uc: { surum: '0.29.0' } };
  const g = U.guncelle(root, eskiCfg);
  L.ok('uc guncelle prints only the notes since the last uc and the short steps', /^UI güncellemesi \(ucupdate\) 0\.29\.0 → /.test(g) && /## \[0\.30\.0\]/.test(g) && !/## \[0\.29\.0\]/.test(g) && /--bitti/.test(g) && !/artik\.js/.test(g) && !/ekran envanterini/.test(g), g.slice(0, 300));
  L.ok('uc guncelle is quiet work when the project is current', U.bekliyor({ uc: { surum: U.surum() } }) === null && U.bekliyor({ off: true, uc: { surum: '0.1.0' } }) === null && !!U.bekliyor(eskiCfg));
}

module.exports = function esle() {
  eslemeler();
  etiketler();
  kapi();
};
