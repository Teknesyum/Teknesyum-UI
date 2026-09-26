#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const KAYDET = require('./kaydet');
const SKOR = require('./skor');

const DIZIN = path.resolve(__dirname, '..', 'templates', 'temalar');
const ALANLAR = ['blue', 'pink', 'purple', 'pink-text', 'purple-text', 'surface', 'black', 'glass-base', 'text', 'disabled', 'success', 'warning'];
const HEX = /^#[0-9a-f]{6}$/;

function oku(dosya) {
  const t = JSON.parse(fs.readFileSync(dosya, 'utf8'));
  if (!/^[a-z-]+$/.test(t.ad || '')) throw new Error(dosya + ': ad küçük harf ve tire olmalı.');
  if (t.tur !== 'acik' && t.tur !== 'koyu') throw new Error(t.ad + ': tur "acik" ya da "koyu" olmalı.');
  for (const k of ALANLAR) {
    const v = String((t.renk || {})[k] || '').toLocaleLowerCase('en');
    if (!HEX.test(v)) throw new Error(t.ad + ': renk.' + k + ' #rrggbb olmalı.');
    t.renk[k] = v;
  }
  for (const k of Object.keys(t.renk)) if (!ALANLAR.includes(k)) throw new Error(t.ad + ': bilinmeyen renk alanı ' + k + '.');
  return t;
}

function dizinOku(dizin) {
  if (!dizin || !fs.existsSync(dizin)) return [];
  return fs
    .readdirSync(dizin)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => oku(path.join(dizin, f)));
}

function liste() {
  return dizinOku(DIZIN);
}

function ozelDizin() {
  const y = require('./ozel').yer();
  return y.kok ? path.join(y.kok, 'teknesyum-ui', 'temalar') : null;
}

function ozelListe() {
  try {
    return dizinOku(ozelDizin());
  } catch {
    return [];
  }
}

function degisim(T, renk, tur) {
  const d = tur ? { meta: { dark: tur === 'koyu' } } : {};
  for (const [k, v] of Object.entries(renk)) {
    const grup = T.brand[k] ? 'brand' : 'role';
    d[grup] = d[grup] || {};
    d[grup][k] = { value: v };
  }
  return d;
}

function tokenlar(tema, taban) {
  const metin = taban || fs.readFileSync(KAYDET.TOKENS, 'utf8');
  return KAYDET.tokenMetni(metin, degisim(JSON.parse(metin), tema.renk, tema.tur)).metin;
}

function denetle(tema, taban) {
  const metin = tokenlar(tema, taban);
  const T = JSON.parse(metin);
  const gecici = fs.mkdtempSync(path.join(os.tmpdir(), 'tema-'));
  try {
    const dosya = path.join(gecici, 'theme.tokens.json');
    fs.writeFileSync(dosya, metin);
    const g = spawnSync(process.execPath, [path.join(__dirname, 'generate.js'), dosya, gecici], { encoding: 'utf8' });
    const skor = SKOR.skorla(T, {});
    return { ad: tema.ad, tur: tema.tur, uretim: g.status === 0, hata: g.status === 0 ? '' : (g.stderr || g.stdout).trim().split('\n').pop(), skor };
  } finally {
    fs.rmSync(gecici, { recursive: true, force: true });
  }
}

function sayfaVerisi() {
  const ozel = ozelListe();
  const ad = new Set(ozel.map((t) => t.ad));
  const kart = (t, o) => ({ ad: t.ad, baslik: t.baslik, tur: t.tur, esin: t.esin, renk: t.renk, ozel: o });
  return [...liste().filter((t) => !ad.has(t.ad)).map((t) => kart(t, false)), ...ozel.map((t) => kart(t, true))];
}

function main() {
  const [komut, ad] = process.argv.slice(2);
  const hepsi = liste();
  if (komut === 'liste' || !komut) {
    for (const t of hepsi) process.stdout.write(t.ad.padEnd(14) + (t.tur === 'koyu' ? 'Koyu ' : 'Açık ') + ' ' + t.baslik + '\n');
    return;
  }
  if (komut === 'denetle') {
    const secim = ad ? hepsi.filter((t) => t.ad === ad) : hepsi;
    if (!secim.length) throw new Error('Tema bulunamadı: ' + ad);
    let kotu = 0;
    for (const t of secim) {
      const r = denetle(t);
      if (!r.uretim) kotu++;
      const zayif = r.skor.paneller.map((p) => p.ad + ' ' + Math.round(p.puan)).join(', ');
      process.stdout.write(
        t.ad.padEnd(14) + (r.uretim ? '7:1 geçti  ' : '7:1 KALDI  ') + 'Okunurluk ' + r.skor.genel.toFixed(1) + '  ' + zayif + (r.hata ? '\n   ' + r.hata : '') + '\n'
      );
    }
    if (kotu) process.exitCode = 1;
    return;
  }
  throw new Error('Kullanım: node ui/scripts/tema.js [liste | denetle [ad]]');
}

if (require.main === module)
  try {
    main();
  } catch (e) {
    process.stderr.write(e.message + '\n');
    process.exitCode = 1;
  }

module.exports = { DIZIN, ALANLAR, oku, liste, ozelDizin, ozelListe, degisim, tokenlar, denetle, sayfaVerisi };
