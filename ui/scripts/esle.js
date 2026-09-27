'use strict';

const EGRILER = [
  ['out', 'Yumuşak Varış', [0.2, 0, 0, 1]],
  ['in', 'Çıkış', [0.4, 0, 1, 1]],
  ['spring', 'Yaylı', [0.34, 1.36, 0.64, 1]],
  ['in-out', 'Yavaş-Hızlı-Yavaş', [0.4, 0, 0.2, 1]],
  ['fast-slow-fast', 'Hızlı Başla-Yavaşla-Hızlı Bitir', [0.15, 0.85, 0.85, 0.15]],
  ['emphasized', 'Vurgulu Varış', [0.05, 0.7, 0.1, 1]],
  ['sharp', 'Keskin', [0.4, 0, 0.6, 1]],
  ['linear', 'Doğrusal', [0, 0, 1, 1]],
];
const ARKALAR = { duz: 'flat', degrade: 'gradient', cam: 'glass', izgara: 'grid', hale: 'halo' };
const BICIMLER = { dolu: 'solid', ince: 'thin', hap: 'pill', gizli: 'hover', solan: 'fade', incelen: 'shrink' };
const SURELER = ['instant', 'fast', 'base', 'slow'];
const PARLAMALAR = ['glow', 'glow-button', 'glow-hero'];

const r2 = (n) => Math.round(n * 100) / 100;
const kopya = (o) => JSON.parse(JSON.stringify(o));
const duzNesne = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

function geri(harita, v, yedek) {
  for (const [k, d] of Object.entries(harita)) if (d === v) return k;
  return yedek;
}

function aileler(T) {
  const zincir = (f) => {
    const q = (s) => (f['css-quote'] ? "'" + s + "'" : s.includes(' ') ? "'" + s + "'" : s);
    return f.chain.map(q).join(', ') + ', ' + f['css-fallback'];
  };
  return {
    sans: ['Token Sans (' + T.font.sans.chain[0] + ')', zincir(T.font.sans), T.font.sans.chain],
    mono: ['Token Mono (' + T.font.mono.chain[0] + ')', zincir(T.font.mono), T.font.mono.chain],
    segoe: ['Segoe UI', "'Segoe UI', system-ui, sans-serif", ['Segoe UI']],
    sistem: ['Sistem Yazısı', 'system-ui, -apple-system, sans-serif', ['system-ui']],
    inter: ['Inter', "Inter, 'Segoe UI', system-ui, sans-serif", ['Inter', 'Segoe UI']],
    serif: ['Georgia (Serif)', 'Georgia, serif', ['Georgia']],
  };
}

function deger(e, alan, yedek) {
  return e && e[alan] !== undefined ? e[alan] : yedek;
}

function ilkDurum(T, secenek) {
  const s = secenek || {};
  const renk = {};
  for (const g of ['brand', 'role']) for (const [k, v] of Object.entries(T[g] || {})) if (v && v.value) renk[k] = String(v.value).toLowerCase();
  const parlama = {};
  for (const g of PARLAMALAR) parlama[g] = { alpha: T.derived[g].alpha, blur: T.derived[g].blur };
  const egri = {};
  for (const [ad, , b] of EGRILER) egri[ad] = b.slice();
  for (const [ad, v] of Object.entries(T.easing || {})) if (v && Array.isArray(v.bezier)) egri[ad] = v.bezier.slice();
  const sure = {};
  for (const k of SURELER) sure[k] = T.duration[k].ms;
  const g = T.derived['bg-gradient'];
  const kenar = T.shape['window-edge'];
  const m = T.metric;
  return {
    parlama,
    parlamaDuzey: 'token',
    egri,
    arayuzEgri: 'out',
    sure,
    sureCarpan: 1,
    yogunluk: 1,
    kenar: deger(T.shape['border-w'], 'value', 1),
    cam: deger(T.derived.glass, 'blur', 16),
    golge: 1,
    pencere: {
      kenar: kenar ? (kenar.ref === 'none' ? 'yok' : kenar.ref) : 'border-strong',
      cubuk: deger(m['titlebar-h-min'], 'value', 32),
    },
    dugme: {
      h: deger(m['btn-h'], 'value', Math.round(T.size['fs-2'].value * T.size['lh-heading'].value + 14 * 2 + 2)),
      px: deger(m['btn-px'], 'value', 20),
    },
    renk,
    koyu: T.meta.dark !== false,
    arka: { tur: geri(ARKALAR, g.type, 'degrade'), durak: g.stops, aci: deger(g, 'angle', 160), don: deger(g, 'rotate', false) },
    yazi: { aile: 'sans', carpan: 1, govde: T.size['fw-body'].value, yari: T.size['fw-semi'].value, kahraman: T.size['fw-hero'].value },
    sekil: { r: T.shape.r.value, rPencere: T.shape['r-window'].value },
    kaydir: {
      kalinlik: m['scrollbar-w'].value,
      renk: deger(T.derived['scrollbar-thumb'], 'ref', 'renk-3-text'),
      davranis: deger(m['scroll-behavior'], 'value', 'auto'),
      bicim: geri(BICIMLER, deger(m['scrollbar-style'], 'value', 'solid'), 'dolu'),
    },
    etiket: etiketler(T),
    hareketAz: !!s.hareketAz,
  };
}

function etiketler(T) {
  const out = {};
  for (const [ad, e] of Object.entries(T.label || {})) {
    if (ad === '_' || !duzNesne(e)) continue;
    out[ad] = {};
    for (const [k, v] of Object.entries(e)) if (k !== 'rationale') out[ad][k] = v;
  }
  return out;
}

function birlestir(hedef, f, sablon) {
  for (const [k, v] of Object.entries(f || {})) {
    if (k === 'hareketAz' || !(k in sablon)) continue;
    const s = sablon[k];
    if (duzNesne(s)) {
      if (duzNesne(v)) birlestir(hedef[k], v, s);
    } else if (Array.isArray(s) ? Array.isArray(v) && v.length === s.length : typeof v === typeof s) hedef[k] = kopya(v);
  }
  return hedef;
}

function durumdan(T, fark) {
  const ilk = ilkDurum(T);
  return { ilk, su: birlestir(kopya(ilk), fark, ilk) };
}

function thumbHover(ref) {
  return ref === 'renk-2' ? 'renk-1' : 'renk-2';
}

function tokenFarki(T, su, ilk) {
  const out = {};
  const koy = (bolum, anahtar, v) => {
    out[bolum] = out[bolum] || {};
    out[bolum][anahtar] = Object.assign(out[bolum][anahtar] || {}, v);
  };
  for (const ad of Object.keys(su.renk)) if (su.renk[ad] !== ilk.renk[ad]) koy(T.role[ad] ? 'role' : 'brand', ad, { value: su.renk[ad] });
  if (su.koyu !== ilk.koyu) out.meta = { dark: su.koyu };
  if (su.yazi.carpan !== ilk.yazi.carpan)
    for (let n = 1; n <= 5; n++) koy('size', 'fs-' + n, { value: Math.round(T.size['fs-' + n].value * su.yazi.carpan), unit: 'px' });
  if (su.yazi.govde !== ilk.yazi.govde) koy('size', 'fw-body', { value: su.yazi.govde });
  if (su.yazi.yari !== ilk.yazi.yari) koy('size', 'fw-semi', { value: su.yazi.yari });
  if (su.yazi.kahraman !== ilk.yazi.kahraman) koy('size', 'fw-hero', { value: su.yazi.kahraman });
  if (su.yazi.aile !== ilk.yazi.aile) koy('font', 'sans', { chain: aileler(T)[su.yazi.aile][2].slice() });
  if (su.sekil.r !== ilk.sekil.r) koy('shape', 'r', { value: su.sekil.r, unit: 'px' });
  if (su.sekil.rPencere !== ilk.sekil.rPencere) koy('shape', 'r-window', { value: su.sekil.rPencere, unit: 'px' });
  if (su.kenar !== ilk.kenar) koy('shape', 'border-w', { value: su.kenar, unit: 'px' });
  if (su.pencere.kenar !== ilk.pencere.kenar) koy('shape', 'window-edge', { ref: su.pencere.kenar === 'yok' ? 'none' : su.pencere.kenar });
  if (su.pencere.cubuk !== ilk.pencere.cubuk) {
    koy('metric', 'titlebar-h-min', { value: su.pencere.cubuk, unit: 'px' });
    koy('metric', 'titlebar-h-max', { value: su.pencere.cubuk, unit: 'px' });
  }
  if (su.dugme.h !== ilk.dugme.h) koy('metric', 'btn-h', { value: su.dugme.h, unit: 'px' });
  if (su.dugme.px !== ilk.dugme.px) koy('metric', 'btn-px', { value: su.dugme.px, unit: 'px' });
  if (su.kaydir.kalinlik !== ilk.kaydir.kalinlik) koy('metric', 'scrollbar-w', { value: su.kaydir.kalinlik, unit: 'px' });
  if (su.kaydir.bicim !== ilk.kaydir.bicim) koy('metric', 'scrollbar-style', { value: BICIMLER[su.kaydir.bicim] });
  if (su.kaydir.davranis !== ilk.kaydir.davranis) koy('metric', 'scroll-behavior', { value: su.kaydir.davranis });
  if (su.kaydir.renk !== ilk.kaydir.renk) koy('derived', 'scrollbar-thumb', { ref: su.kaydir.renk, 'hover-ref': thumbHover(su.kaydir.renk) });
  if (su.yogunluk !== ilk.yogunluk) for (let n = 1; n <= 5; n++) koy('space', String(n), { value: Math.round(T.space[n].value * su.yogunluk), unit: 'px' });
  const arka = {};
  if (su.arka.durak !== ilk.arka.durak) arka.stops = su.arka.durak;
  if (su.arka.tur !== ilk.arka.tur) arka.type = ARKALAR[su.arka.tur];
  if (su.arka.aci !== ilk.arka.aci) arka.angle = su.arka.aci;
  if (su.arka.don !== ilk.arka.don) arka.rotate = su.arka.don;
  if (Object.keys(arka).length) koy('derived', 'bg-gradient', arka);
  if (su.cam !== ilk.cam) koy('derived', 'glass', { blur: Math.round(su.cam) });
  if (su.golge !== ilk.golge) {
    const sp = T.derived['shadow-panel'];
    koy('derived', 'shadow-panel', { alpha: Math.min(1, r2(sp.alpha * su.golge)), blur: Math.round(sp.blur * su.golge) });
  }
  const etkin = Object.assign({}, su.egri);
  if (su.egri[su.arayuzEgri]) etkin.out = su.egri[su.arayuzEgri];
  const ilkOut = ilk.egri[ilk.arayuzEgri] || ilk.egri.out;
  for (const [ad, b] of Object.entries(etkin)) {
    if (!T.easing || !T.easing[ad]) continue;
    const once = ad === 'out' ? ilkOut : ilk.egri[ad];
    const y = b.map(r2);
    if (!once || JSON.stringify(y) !== JSON.stringify(once.map(r2))) koy('easing', ad, { bezier: y });
  }
  for (const k of SURELER) if (su.sure[k] !== ilk.sure[k]) koy('duration', k, { ms: Math.max(0, Math.min(2000, Math.round(su.sure[k]))) });
  for (const [ad, e] of Object.entries(su.etiket || {})) {
    const once = (ilk.etiket || {})[ad];
    if (!once) continue;
    const d = {};
    for (const [k, v] of Object.entries(e)) if (k in once && v !== once[k]) d[k] = v;
    if (Object.keys(d).length) koy('label', ad, d);
  }
  for (const g of PARLAMALAR) {
    const a = su.parlama[g];
    const b = ilk.parlama[g];
    const d = {};
    if (r2(a.alpha) !== r2(b.alpha)) d.alpha = Math.max(0, Math.min(1, r2(a.alpha)));
    if (Math.round(a.blur) !== Math.round(b.blur)) d.blur = Math.max(0, Math.min(48, Math.round(a.blur)));
    if (Object.keys(d).length) koy('derived', g, d);
  }
  return out;
}

const SECIMLER = [
  /^renk\.[a-z0-9-]+$/,
  /^koyu$/,
  /^yazi\.(carpan|govde|yari|kahraman|aile)$/,
  /^sekil\.(r|rPencere)$/,
  /^kaydir\.(kalinlik|renk|davranis|bicim)$/,
  /^arka\.(tur|durak|aci|don)$/,
  /^egri\.[a-z-]+$/,
  /^arayuzEgri$/,
  /^sure\.(instant|fast|base|slow)$/,
  /^sureCarpan$/,
  /^parlama\.(glow|glow-button|glow-hero)\.(alpha|blur)$/,
  /^parlamaDuzey$/,
  /^(yogunluk|kenar|cam|golge)$/,
  /^pencere\.(kenar|cubuk)$/,
  /^dugme\.(h|px)$/,
  /^etiket\.[a-z]+\.[a-z-]+$/,
];

function yapraklar(o, on) {
  const out = [];
  for (const [k, v] of Object.entries(o || {})) {
    const yol = (on ? on + '.' : '') + k;
    if (duzNesne(v)) out.push(...yapraklar(v, yol));
    else out.push(yol);
  }
  return out;
}

function eslenmemis(fark) {
  return yapraklar(fark).filter((y) => !SECIMLER.some((re) => re.test(y)));
}

function beklenen(T, fark) {
  const { ilk, su } = durumdan(T, fark);
  return tokenFarki(T, su, ilk);
}

function tokenUyusmaz(B, bek) {
  const out = [];
  for (const [g, adlar] of Object.entries(bek)) {
    if (g === 'meta') {
      if ((B.meta && B.meta.dark) !== adlar.dark) out.push('meta.dark');
      continue;
    }
    for (const [ad, alanlar] of Object.entries(adlar))
      for (const [k, v] of Object.entries(alanlar)) {
        const e = B[g] && B[g][ad];
        if (!e || JSON.stringify(e[k]) !== JSON.stringify(v)) out.push(g + '.' + ad + '.' + k);
      }
  }
  return out;
}

function denetle(secenek) {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const s = secenek || {};
  const ozel = require('./ozel');
  const K = require('./kaydet');
  const farklar = [];
  const oku = (p) => {
    try {
      return fs.readFileSync(p, 'utf8');
    } catch {
      return null;
    }
  };
  const T = JSON.parse(fs.readFileSync(K.TOKENS, 'utf8'));
  const yol = ozel.tokenYollari();
  const benimMetin = yol ? oku(yol.tokenlar) : null;
  const B = benimMetin ? JSON.parse(benimMetin) : null;
  const kayit = ozel.oku();
  if (!kayit.ayar) farklar.push('önizleme ayarı yok: ' + kayit.yol);
  if (!B) farklar.push('benim.tokens.json yok; önizlemede Kaydet ya da esle.js --yaz');
  if (kayit.ayar) {
    for (const y of eslenmemis(kayit.ayar.fark)) farklar.push('token karşılığı olmayan seçim: ' + y);
    if (B) for (const y of tokenUyusmaz(B, beklenen(T, kayit.ayar.fark))) farklar.push('ayar ile token ayrı: ' + y + ' (esle.js --yaz)');
  }
  if (yol && yol.notlar && fs.existsSync(yol.notlar)) farklar.push('not dosyası duruyor: benim.notlar.json (esle.js --yaz siler)');
  if (s.proje && B) {
    const kok = path.resolve(s.proje);
    let cfg = null;
    try {
      cfg = JSON.parse(oku(path.join(kok, '.claude', 'teknesyum-ui.json')));
    } catch {}
    if (!cfg) farklar.push('proje bağlı değil: .claude/teknesyum-ui.json yok');
    else if (cfg.template !== 'benim') farklar.push('proje benim şablonunda değil: ' + cfg.template);
    else {
      const duz = (m) => (m == null ? null : m.replace(/\r\n/g, '\n'));
      const out = path.join(kok, 'teknesyum-ui');
      if (duz(oku(path.join(out, 'theme.tokens.json'))) !== duz(benimMetin)) farklar.push('teknesyum-ui/theme.tokens.json benim.tokens.json ile aynı değil');
      const sahne = fs.mkdtempSync(path.join(os.tmpdir(), 'teknesyum-esle-'));
      try {
        const { spawnSync } = require('child_process');
        const r = spawnSync(process.execPath, [path.join(__dirname, 'generate.js'), yol.tokenlar, sahne], { encoding: 'utf8', windowsHide: true });
        if (r.status !== 0) farklar.push('üretici durdu: ' + String(r.stderr || r.stdout).trim().split('\n')[0]);
        else {
          const ARTIFACTS = s.artifacts || require('./setup').ARTIFACTS;
          for (const t of cfg.targets || []) {
            for (const ad of ARTIFACTS[t] || []) {
              const bek = oku(path.join(sahne, ad));
              if (bek == null) continue;
              const var_ = oku(path.join(out, t, ad));
              if (var_ == null) farklar.push(t + '/' + ad + ' yok');
              else if (duz(var_) !== duz(bek)) farklar.push(t + '/' + ad + ' tokenlardan üretilenle aynı değil');
            }
          }
        }
      } finally {
        fs.rmSync(sahne, { recursive: true, force: true });
      }
    }
  }
  return farklar;
}

function yaz() {
  const fs = require('fs');
  const ozel = require('./ozel');
  const K = require('./kaydet');
  const kayit = ozel.oku();
  if (!kayit.ayar) throw new Error('önizleme ayarı yok: ' + kayit.yol);
  const T = JSON.parse(fs.readFileSync(K.TOKENS, 'utf8'));
  const dosya = ozel.tokenYaz(beklenen(T, kayit.ayar.fark));
  if (!dosya) throw new Error('özel raf yok');
  return dosya;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h') || !args.length) {
    process.stdout.write('Usage: node esle.js --denetle [--project root] | --yaz\n\n--denetle  compare the preview settings, the saved tokens and the project\'s generated theme files\n--yaz      rewrite the saved tokens from the preview settings\n');
    return args.length ? 0 : 2;
  }
  if (args.includes('--yaz')) {
    yaz();
    process.stdout.write('benim.tokens.json önizleme ayarından yeniden yazıldı\n');
  }
  if (args.includes('--denetle')) {
    const i = args.indexOf('--project');
    const farklar = denetle({ proje: i >= 0 ? args[i + 1] : null });
    process.stdout.write('düzen eşleşmesi ' + farklar.length + ' fark\n' + farklar.map((f) => '  - ' + f + '\n').join(''));
    return farklar.length ? 1 : 0;
  }
  return 0;
}

module.exports = { EGRILER, ARKALAR, BICIMLER, SURELER, PARLAMALAR, aileler, ilkDurum, birlestir, durumdan, tokenFarki, thumbHover, eslenmemis, yapraklar, beklenen, tokenUyusmaz, denetle, yaz };

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) process.exitCode = main(process.argv);
