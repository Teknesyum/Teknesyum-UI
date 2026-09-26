'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const K = require('./kontrast');
const SKOR = require('./skor');

const UI = path.resolve(__dirname, '..');
const KOK = path.resolve(UI, '..');
const TOKENS = path.join(UI, 'templates', 'neon.tokens.json');
const VARLIK = path.join(UI, 'skills', 'teknesyum-ui', 'assets');
const KOPYA = path.join(VARLIK, 'theme.tokens.json');
const KUR = path.join(UI, 'templates', 'kur', 'kur.ps1');
const FIXTURE = path.join(UI, 'scripts', 'rules', '__fixtures__');
const CHANGELOG = path.join(KOK, 'CHANGELOG.md');
const SURUMLER = [
  path.join(KOK, 'package.json'),
  path.join(UI, '.claude-plugin', 'plugin.json'),
  path.join(UI, 'onizleme', 'masaustu', 'package.json'),
  path.join(UI, 'onizleme', 'masaustu', 'package-lock.json'),
];

const RENKLER = ['blue', 'pink', 'purple', 'pink-text', 'purple-text', 'surface', 'black', 'glass-base', 'text', 'disabled', 'success', 'warning'];
const HEX = /^#[0-9a-f]{6}$/;
const AGIRLIK = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Normal', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const TAMSAYI = {
  'size.fs-1': [10, 64],
  'size.fs-2': [10, 64],
  'size.fs-3': [10, 64],
  'size.fs-4': [10, 64],
  'size.fs-5': [10, 96],
  'shape.r': [0, 24],
  'shape.r-window': [0, 32],
  'metric.scrollbar-w': [2, 24],
  'derived.bg-gradient': [2, 64],
};
const SURELER = ['instant', 'fast', 'base', 'slow'];
const PARLAMALAR = ['glow', 'glow-button', 'glow-hero'];

function grupBul(T, anahtar) {
  if (T.brand && T.brand[anahtar] && T.brand[anahtar].value !== undefined) return 'brand';
  if (T.role && T.role[anahtar] && T.role[anahtar].value !== undefined) return 'role';
  return null;
}

function dogrula(degisen, T) {
  if (!degisen || typeof degisen !== 'object' || Array.isArray(degisen)) throw new Error('Gövde bir nesne olmalı.');
  const out = [];
  for (const [bolum, alanlar] of Object.entries(degisen)) {
    if (bolum === '_') continue;
    if (!alanlar || typeof alanlar !== 'object') throw new Error(bolum + ': alanlar nesne olmalı.');
    for (const [ad, v] of Object.entries(alanlar)) {
      const yer = bolum + '.' + ad;
      if (yer === 'meta.dark') {
        if (typeof v !== 'boolean') throw new Error(yer + ': true ya da false bekleniyor.');
        out.push({ grup: 'meta', ad, alan: 'dark', deger: v });
      } else if (RENKLER.includes(ad) && (bolum === 'brand' || bolum === 'role')) {
        const deger = String(v && v.value).toLocaleLowerCase('en');
        if (!HEX.test(deger)) throw new Error(yer + ': #rrggbb bekleniyor.');
        const grup = grupBul(T, ad);
        if (!grup) throw new Error(yer + ': token bulunamadı.');
        out.push({ grup, ad, alan: 'value', deger });
      } else if (/^size\.fw-(body|semi|hero)$/.test(yer)) {
        const n = Number(v && v.value);
        if (!AGIRLIK[n]) throw new Error(yer + ': 100–900 arası yüzlük bekleniyor.');
        out.push({ grup: 'size', ad, alan: 'value', deger: n });
        out.push({ grup: 'size', ad, alan: 'xaml', deger: AGIRLIK[n] });
      } else if (TAMSAYI[yer]) {
        const n = Number(bolum === 'derived' ? v && v.stops : v && v.value);
        const [alt, ust] = TAMSAYI[yer];
        if (!Number.isInteger(n) || n < alt || n > ust) throw new Error(yer + ': ' + alt + '–' + ust + ' arası tamsayı bekleniyor.');
        out.push({ grup: bolum, ad, alan: bolum === 'derived' ? 'stops' : 'value', deger: n });
      } else if (bolum === 'easing') {
        const b = v && v.bezier;
        if (!T.easing || !T.easing[ad]) throw new Error(yer + ': token bulunamadı.');
        if (!Array.isArray(b) || b.length !== 4 || !b.every((n) => typeof n === 'number' && Number.isFinite(n)) || b[0] < 0 || b[0] > 1 || b[2] < 0 || b[2] > 1 || Math.abs(b[1]) > 2 || Math.abs(b[3]) > 2)
          throw new Error(yer + ': dört sayı bekleniyor; x değerleri 0–1, y değerleri −2–2.');
        out.push({ grup: 'easing', ad, alan: 'bezier', deger: b.map((n) => Math.round(n * 1000) / 1000) });
      } else if (bolum === 'duration' && SURELER.includes(ad)) {
        const n = Number(v && v.ms);
        if (!Number.isInteger(n) || n < 0 || n > 2000) throw new Error(yer + ': 0–2000 arası tamsayı milisaniye bekleniyor.');
        out.push({ grup: 'duration', ad, alan: 'ms', deger: n });
      } else if (bolum === 'derived' && PARLAMALAR.includes(ad)) {
        const e = v || {};
        if (e.alpha === undefined && e.blur === undefined) throw new Error(yer + ': alpha ya da blur bekleniyor.');
        if (e.alpha !== undefined) {
          const a = Number(e.alpha);
          if (!Number.isFinite(a) || a < 0 || a > 1) throw new Error(yer + '.alpha: 0–1 arası sayı bekleniyor.');
          out.push({ grup: 'derived', ad, alan: 'alpha', deger: Math.round(a * 100) / 100 });
        }
        if (e.blur !== undefined) {
          const n = Number(e.blur);
          if (!Number.isInteger(n) || n < 0 || n > 48) throw new Error(yer + '.blur: 0–48 arası tamsayı bekleniyor.');
          out.push({ grup: 'derived', ad, alan: 'blur', deger: n });
        }
      } else if (yer === 'font.sans') {
        const z = v && v.chain;
        if (!Array.isArray(z) || !z.length || z.length > 6 || !z.every((s) => typeof s === 'string' && /^[A-Za-z0-9 -]{1,48}$/.test(s)))
          throw new Error(yer + ': en çok altı yazı ailesi adı bekleniyor.');
        out.push({ grup: 'font', ad, alan: 'chain', deger: z });
      } else {
        throw new Error(yer + ': bu alan kaydedilemez.');
      }
    }
  }
  return out;
}

function literal(v) {
  if (Array.isArray(v)) return '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']';
  return JSON.stringify(v);
}

function aralik(metin, grup, ad) {
  const g = metin.indexOf('\n  "' + grup + '": {');
  if (g < 0) throw new Error('Token grubu yok: ' + grup);
  const gSon = metin.indexOf('\n  }', g + 1);
  const e = metin.indexOf('\n    "' + ad + '": {', g);
  if (e < 0 || e > gSon) throw new Error('Token yok: ' + grup + '.' + ad);
  let son = metin.indexOf('\n    "', e + 1);
  if (son < 0 || son > gSon) son = gSon;
  return [e, son];
}

function alanYaz(metin, grup, ad, alan, deger) {
  const [bas, son] = aralik(metin, grup, ad);
  const parca = metin.slice(bas, son);
  const re = new RegExp('("' + alan + '":\\s*)(\\[[^\\]]*\\]|"(?:[^"\\\\]|\\\\.)*"|-?\\d+(?:\\.\\d+)?|true|false|null)');
  if (!re.test(parca)) throw new Error('Alan yok: ' + grup + '.' + ad + '.' + alan);
  return metin.slice(0, bas) + parca.replace(re, (m, on) => on + literal(deger)) + metin.slice(son);
}

function renk(T, ad, iz) {
  const yol = iz || [];
  if (yol.includes(ad)) return null;
  for (const g of ['brand', 'role', 'derived']) {
    const e = T[g] && T[g][ad];
    if (!e) continue;
    const taban = e.value !== undefined ? K.parse(e.value) : e.ref ? renk(T, e.ref, yol.concat(ad)) : null;
    if (!taban) return null;
    return e.alpha !== undefined ? { r: taban.r, g: taban.g, b: taban.b, a: e.alpha } : taban;
  }
  return null;
}

function dolgu(T, ad) {
  const ton = T.derived && T.derived['tone-scale'];
  const m = /^(.+)-(\d+)$/.exec(ad);
  if (m && ton && ton.bases.includes(m[1]) && ton.steps.includes(Number(m[2]))) {
    const c = renk(T, m[1]);
    return c && { r: c.r, g: c.g, b: c.b, a: Number(m[2]) / 100 };
  }
  return renk(T, ad);
}

function zemin(T) {
  const g = renk(T, 'surface');
  return { r: g.r, g: g.g, b: g.b, a: 1 };
}

function olc(T, dolguRenk, yazi) {
  return K.pair(dolguRenk, typeof yazi === 'string' ? renk(T, yazi) : yazi, zemin(T)).ratio;
}

function onGerekce(T, ad, eski) {
  const f = dolgu(T, ad);
  if (!f) return null;
  const etiket = ad.replace(/-(\d+)$/, ' $1%') + (f.a < 1 ? ' over surface' : '');
  const aday = ['black', 'text', 'surface']
    .filter((o) => renk(T, o))
    .map((o) => ({ on: o, r: olc(T, f, o) }))
    .sort((a, b) => b.r - a.r);
  const simdiki = eski.on && aday.find((a) => a.on === eski.on);
  if (simdiki && simdiki.r >= K.THRESHOLD) return { on: simdiki.on, rationale: simdiki.on + ' on ' + etiket + ': ' + simdiki.r.toFixed(2) + ':1.' };
  const en = aday[0];
  if (en.r >= K.THRESHOLD) return { on: en.on, rationale: en.on + ' on ' + etiket + ': ' + en.r.toFixed(2) + ':1.' };
  const ek = eski.on === null ? (/below 7:1\.(.*)$/.exec(eski.rationale || '') || [, ''])[1] : '';
  return { on: null, rationale: 'Carries no text: the best pair, ' + en.on + ' on ' + etiket + ', is ' + en.r.toFixed(2) + ':1, below ' + K.THRESHOLD + ':1.' + ek };
}

const BEYAZ = { r: 255, g: 255, b: 255, a: 1 };
const f2 = (n) => n.toFixed(2);
const IDDIALAR = [
  ['brand', 'pink', /(as text it gives )(\d+\.\d+)(:1)/, (T) => f2(olc(T, zemin(T), 'pink'))],
  ['brand', 'pink-text', /()(\d+\.\d+)(:1 on )/, (T) => f2(olc(T, zemin(T), 'pink-text'))],
  ['brand', 'pink-text', /(:1 on )(#[0-9a-f]{6})()/, (T) => T.brand.surface.value],
  ['role', 'danger-text', /(\()(\d+\.\d+)(:1\))/, (T) => f2(olc(T, zemin(T), 'danger-text'))],
  ['role', 'warning', /(text \()(\d+\.\d+)(:1\))/, (T) => f2(olc(T, zemin(T), 'warning'))],
  ['role', 'warning', /(amber fill is )(\d+\.\d+)(:1)/, (T) => f2(olc(T, renk(T, 'warning'), BEYAZ))],
  ['role', 'warning-border', /^()(\d+\.\d+)(:1 on )/, (T) => f2(olc(T, zemin(T), renk(T, 'warning-border')))],
  ['role', 'warning-border', /(:1 on )(#[0-9a-f]{6})()/, (T) => T.brand.surface.value],
  ['role', 'warning-border', /(pink \/50 \()(\d+\.\d+)(\))/, (T) => f2(olc(T, zemin(T), { ...renk(T, 'pink'), a: 0.5 }))],
  ['role', 'warning-border', /(purple \/50 \()(\d+\.\d+)(\))/, (T) => f2(olc(T, zemin(T), { ...renk(T, 'purple'), a: 0.5 }))],
];

function yenidenOlc(metin) {
  let T = JSON.parse(metin);
  for (const ad of Object.keys(T.on || {})) {
    if (ad === '_') continue;
    const yeni = onGerekce(T, ad, T.on[ad]);
    if (!yeni) continue;
    metin = alanYaz(metin, 'on', ad, 'on', yeni.on);
    metin = alanYaz(metin, 'on', ad, 'rationale', yeni.rationale);
  }
  T = JSON.parse(metin);
  for (const [g, ad, re, olcu] of IDDIALAR) {
    const e = T[g] && T[g][ad];
    if (!e || !re.test(e.rationale || '')) continue;
    const yeni = e.rationale.replace(re, (m, a, x, b) => a + olcu(T) + b);
    if (yeni !== e.rationale) {
      metin = alanYaz(metin, g, ad, 'rationale', yeni);
      T = JSON.parse(metin);
    }
  }
  return metin;
}

function tokenMetni(metin, degisen) {
  const T = JSON.parse(metin);
  const yazilar = dogrula(degisen, T);
  const eski = {};
  const yeni = {};
  const ozet = [];
  for (const y of yazilar) {
    if (y.grup === 'meta') {
      if (T.meta.dark === y.deger) continue;
      metin = metin.replace(/("meta":\s*\{[^}]*?"dark":\s*)(true|false)/, (m, a) => a + String(y.deger));
      ozet.push('meta.dark: `' + T.meta.dark + '` → `' + y.deger + '`');
      continue;
    }
    const once = T[y.grup][y.ad][y.alan];
    if (JSON.stringify(once) === JSON.stringify(y.deger)) continue;
    metin = alanYaz(metin, y.grup, y.ad, y.alan, y.deger);
    if (y.alan === 'xaml') continue;
    if (y.alan === 'value' && typeof once === 'string') {
      eski[y.ad] = once.toLocaleLowerCase('en');
      yeni[y.ad] = y.deger;
    }
    const goster = (v) => (Array.isArray(v) ? v.join(', ') : String(v));
    ozet.push(y.grup + '.' + y.ad + (y.alan === 'value' ? '' : '.' + y.alan) + ': `' + goster(once) + '` → `' + goster(y.deger) + '`');
  }
  metin = yenidenOlc(metin);
  const Y = JSON.parse(metin);
  if (ozet.length) {
    const once = Math.round(SKOR.skorla(T, {}).genel);
    const sonra = Math.round(SKOR.skorla(Y, {}).genel);
    ozet.push('readability score: `' + once + '` → `' + sonra + '`');
  }
  return { metin, eski, yeni, ozet };
}

function paletDegistir(metin, eski, yeni, uzanti) {
  const harita = new Map();
  for (const ad of Object.keys(eski)) {
    const e = eski[ad].toLocaleLowerCase('en');
    if (harita.has(e) && harita.get(e) !== yeni[ad]) throw new Error('Aynı eski renk iki yeni değere gidiyor: ' + e);
    harita.set(e, yeni[ad]);
  }
  if (!harita.size) return metin;
  const argb = /^\.(xaml|axaml|cs|ps1)$/i.test(uzanti || '');
  const dusuk = (s) => s.toLocaleLowerCase('en');
  const buyuk = (s) => s.toLocaleUpperCase('en');
  metin = metin.replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6})(?![0-9a-fA-F])/g, (m, x) => {
    const b = x.length === 6 ? x : argb ? x.slice(2) : x.slice(0, 6);
    const hedef = harita.get('#' + dusuk(b));
    if (!hedef) return m;
    const y = x === buyuk(x) && /[A-F]/.test(x) ? buyuk(hedef.slice(1)) : hedef.slice(1);
    return '#' + (x.length === 6 ? y : argb ? x.slice(0, 2) + y : y + x.slice(6));
  });
  return metin.replace(/(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})/g, (m, a, r, s1, g, s2, b) => {
    const e = '#' + [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    const hedef = harita.get(e);
    if (!hedef) return m;
    const c = K.parse(hedef);
    return a + c.r + s1 + c.g + s2 + c.b;
  });
}

function surumArtir(s) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(s);
  if (!m) throw new Error('Sürüm okunamadı: ' + s);
  return m[1] + '.' + (Number(m[2]) + 1) + '.0';
}

function surumYaz(metin, eski, yeni, dosya) {
  if (/package-lock\.json$/.test(dosya))
    return metin.replace(/("name": "teknesyum-onizleme",\s*"version": ")([^"]+)(")/g, (m, a, v, b) => a + yeni + b);
  return metin.replace('"version": "' + eski + '"', '"version": "' + yeni + '"');
}

function changelogYaz(metin, satirlar, surum, tarih) {
  const bas = metin.indexOf('## [Unreleased]');
  if (bas < 0) throw new Error('CHANGELOG içinde [Unreleased] yok.');
  let son = metin.indexOf('\n## [', bas + 1);
  if (son < 0) son = metin.length;
  let bolum = metin.slice(bas, son);
  const madde = satirlar.map((s) => '- Preview save: ' + s + '.').join('\n') + '\n';
  if (bolum.includes('\n### Changed\n')) bolum = bolum.replace('\n### Changed\n', () => '\n### Changed\n' + madde);
  else bolum = bolum.replace('## [Unreleased]\n', () => '## [Unreleased]\n\n### Changed\n' + madde);
  bolum = bolum.replace('## [Unreleased]', '## [' + surum + '] - ' + tarih);
  return metin.slice(0, bas) + bolum + metin.slice(son);
}

function surumNotu(metin, surum) {
  const bas = metin.indexOf('## [' + surum + ']');
  if (bas < 0) return '';
  const govde = metin.indexOf('\n', bas) + 1;
  let son = metin.indexOf('\n## [', govde);
  if (son < 0) son = metin.length;
  return metin.slice(govde, son).trim() + '\n';
}

function dosyalar(dizin) {
  const out = [];
  for (const d of fs.readdirSync(dizin, { withFileTypes: true })) {
    const p = path.join(dizin, d.name);
    if (d.isDirectory()) out.push(...dosyalar(p));
    else out.push(p);
  }
  return out;
}

function oku(p) {
  return fs.readFileSync(p, 'utf8');
}

function yaz(p, metin, crlf) {
  fs.writeFileSync(p, crlf ? metin.replace(/\r?\n/g, '\r\n') : metin);
}

function calistir(is, komut, args, secenek) {
  return new Promise((coz) => {
    is.gunlukEkle('$ ' + [path.basename(komut)].concat(args).join(' '));
    let c;
    try {
      c = spawn(komut, args, { cwd: KOK, windowsHide: true, ...secenek });
    } catch (e) {
      is.gunlukEkle(String(e.message || e));
      return coz(1);
    }
    let artik = '';
    const al = (b) => {
      artik += b.toString('utf8');
      const satir = artik.split(/\r?\n/);
      artik = satir.pop();
      for (const s of satir) if (s.trim()) is.gunlukEkle(s);
    };
    c.stdout.on('data', al);
    c.stderr.on('data', al);
    c.on('error', (e) => is.gunlukEkle(String(e.message || e)));
    c.on('close', (kod) => {
      if (artik.trim()) is.gunlukEkle(artik);
      coz(kod === null ? 1 : kod);
    });
  });
}

function node(is, betik, args) {
  return calistir(is, process.execPath, [betik].concat(args || []), { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });
}

function yeniIs() {
  return {
    calisiyor: false,
    adim: '',
    yuzde: 0,
    gunluk: [],
    bitti: false,
    basarili: false,
    surum: '',
    gunlukEkle(s) {
      this.gunluk.push(String(s).slice(0, 400));
      if (this.gunluk.length > 400) this.gunluk.splice(0, this.gunluk.length - 400);
    },
    durum() {
      return { calisiyor: this.calisiyor, adim: this.adim, yuzde: this.yuzde, gunluk: this.gunluk.slice(-9), bitti: this.bitti, basarili: this.basarili, surum: this.surum };
    },
  };
}

let is = yeniIs();

function surum() {
  return JSON.parse(oku(SURUMLER[0])).version;
}

async function hat(degisen, secenek) {
  const yayinla = !(secenek && secenek.yayinlama);
  const adim = (ad, yuzde) => {
    is.adim = ad;
    is.yuzde = yuzde;
    is.gunlukEkle('— ' + ad);
  };
  const yedek = new Map();
  const dokun = (p, metin, crlf) => {
    if (!yedek.has(p)) yedek.set(p, fs.existsSync(p) ? fs.readFileSync(p) : null);
    yaz(p, metin, crlf);
  };
  const geriAl = () => {
    for (const [p, b] of yedek) if (b) fs.writeFileSync(p, b);
    is.gunlukEkle('Değişen ' + yedek.size + ' dosya eski haline döndü.');
  };

  adim('Değişenler doğrulanıyor', 5);
  const kaynak = oku(TOKENS);
  const crlf = kaynak.includes('\r\n');
  const sonuc = tokenMetni(kaynak.replace(/\r\n/g, '\n'), degisen);
  if (!sonuc.ozet.length) throw new Error('Kaydedilecek değişiklik yok.');
  for (const s of sonuc.ozet) is.gunlukEkle(s);
  if (Array.isArray(degisen._)) for (const n of degisen._) is.gunlukEkle('Token karşılığı yok, kaydedilmedi: ' + n);

  const git = (args) => calistir(is, 'git', args);
  const eskiSurum = surum();
  const yeniSurum = surumArtir(eskiSurum);
  is.surum = yeniSurum;
  const izli = [TOKENS, VARLIK, KUR, FIXTURE, CHANGELOG].concat(SURUMLER).map((p) => path.relative(KOK, p));
  if (yayinla) {
    adim('Çalışma ağacı denetleniyor', 8);
    const kirli = [];
    await new Promise((coz) => {
      const c = spawn('git', ['status', '--porcelain', '--'].concat(izli), { cwd: KOK, windowsHide: true });
      c.stdout.on('data', (b) => kirli.push(...b.toString('utf8').split(/\r?\n/).filter(Boolean)));
      c.on('close', coz);
      c.on('error', coz);
    });
    if (kirli.length) {
      for (const k of kirli) is.gunlukEkle(k);
      throw new Error('Bu dosyalarda kaydedilmemiş değişiklik var; önce onları commit edin.');
    }
  }

  try {
    adim('Token dosyası yazılıyor', 15);
    dokun(TOKENS, sonuc.metin, crlf);
    const kopya = oku(KOPYA);
    dokun(KOPYA, sonuc.metin, kopya.includes('\r\n'));
    for (const p of [KUR].concat(dosyalar(FIXTURE))) {
      const m = oku(p);
      const y = paletDegistir(m, sonuc.eski, sonuc.yeni, path.extname(p));
      if (y !== m) {
        dokun(p, y, false);
        is.gunlukEkle('Palet güncellendi: ' + path.relative(KOK, p).replace(/\\/g, '/'));
      }
    }

    adim('Türevler üretiliyor', 25);
    for (const ad of fs.readdirSync(VARLIK)) {
      const p = path.join(VARLIK, ad);
      if (fs.statSync(p).isFile() && !yedek.has(p)) yedek.set(p, fs.readFileSync(p));
    }
    if ((await node(is, path.join(UI, 'scripts', 'generate.js'))) !== 0) throw new Error('generate.js durdu.');

    adim('Testler ve tarayıcı çalışıyor', 45);
    if ((await node(is, path.join(KOK, 'test', 'all.js'))) !== 0) throw new Error('Testler geçmedi.');

    adim('Sürüm ' + yeniSurum + ' yazılıyor', 72);
    const tarih = new Date().toISOString().slice(0, 10);
    for (const p of SURUMLER) {
      if (!fs.existsSync(p)) continue;
      const m = oku(p);
      dokun(p, surumYaz(m, eskiSurum, yeniSurum, p), false);
    }
    const cl = oku(CHANGELOG);
    dokun(CHANGELOG, changelogYaz(cl.replace(/\r\n/g, '\n'), sonuc.ozet, yeniSurum, tarih), cl.includes('\r\n'));
  } catch (e) {
    geriAl();
    throw e;
  }

  if (!yayinla) return;
  const etiket = 'v' + yeniSurum;
  adim('Commit ve etiket', 80);
  if ((await git(['add', '--'].concat(izli))) !== 0) throw new Error('git add durdu.');
  const mesaj = 'Release ' + yeniSurum + ' from the preview\n\n' + sonuc.ozet.map((s) => '- ' + s.replace(/`/g, '')).join('\n') + '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n';
  if ((await git(['commit', '-m', mesaj, '--'].concat(izli))) !== 0) throw new Error('git commit durdu.');
  if ((await git(['tag', etiket])) !== 0) throw new Error('git tag durdu.');

  adim("GitHub'a gönderiliyor", 88);
  if ((await git(['push'])) !== 0) throw new Error('git push durdu; commit ve etiket yerelde duruyor.');
  if ((await git(['push', 'origin', etiket])) !== 0) throw new Error('Etiket gönderilemedi.');

  adim('Yayın oluşturuluyor', 95);
  const not = path.join(require('os').tmpdir(), 'tkui-surum-' + yeniSurum + '.md');
  fs.writeFileSync(not, surumNotu(oku(CHANGELOG).replace(/\r\n/g, '\n'), yeniSurum));
  const gh = await calistir(is, 'gh', ['release', 'create', etiket, '--title', etiket, '--notes-file', not]);
  try {
    fs.unlinkSync(not);
  } catch {}
  if (gh !== 0) throw new Error('gh release durdu; etiket GitHub’da, yayını elle açın.');
}

function baslat(degisen, secenek) {
  if (is.calisiyor) return { status: 409, body: { hata: 'Bir kayıt zaten sürüyor.' } };
  is = yeniIs();
  is.calisiyor = true;
  hat(degisen, secenek)
    .then(() => {
      is.basarili = true;
      is.adim = secenek && secenek.yayinlama ? 'Kaydedildi' : 'Sürüm ' + is.surum + ' yayında';
      is.yuzde = 100;
    })
    .catch((e) => {
      is.adim = String((e && e.message) || e);
      is.gunlukEkle('Hata: ' + is.adim);
    })
    .finally(() => {
      is.calisiyor = false;
      is.bitti = true;
    });
  return { status: 202, body: is.durum() };
}

function durum() {
  return is.durum();
}

module.exports = { dogrula, tokenMetni, yenidenOlc, paletDegistir, surumArtir, surumYaz, changelogYaz, surumNotu, baslat, durum, surum, TOKENS };
