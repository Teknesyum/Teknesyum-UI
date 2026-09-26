#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const DIR = 'tercihler';
const KURAL = path.join('teknesyum-ui', 'kurallar');

function configRoot() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function root() {
  return process.env.TEKNESYUM_PRIVATE || path.join(configRoot(), 'teknesyum-private');
}

function dir() {
  return path.join(root(), 'private', DIR);
}

function dizinler() {
  return [path.join(root(), KURAL), dir()].filter((d) => {
    try {
      return fs.statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
}

function var_() {
  return dizinler().length > 0;
}

function liste() {
  if (!var_()) return [];
  const adlar = new Set();
  for (const d of dizinler()) {
    try {
      for (const f of fs.readdirSync(d)) if (f.toLowerCase().endsWith('.md') && !/^(agents|claude)\.md$/i.test(f)) adlar.add(f.replace(/\.md$/i, ''));
    } catch {}
  }
  return [...adlar].sort();
}

function oku(name) {
  if (!name || !/^[a-z0-9-]+$/i.test(String(name))) return null;
  for (const d of dizinler()) {
    try {
      return fs.readFileSync(path.join(d, String(name) + '.md'), 'utf8');
    } catch {}
  }
  return null;
}

const ATLA = /^(\.git|\.claude|\.vs|\.idea|\.vscode|node_modules|bin|obj|dist|build|out|trash|tmp|vendor|packages|target|coverage)$/i;
const METIN = /\.(css|tsx|jsx|ts|js|mjs|cjs|vue|svelte|xaml|axaml|cs|csproj|json|md|html|ps1|bat|cmd|py|rs|toml|ya?ml|txt)$/i;
const KAYIT = path.join('.claude', 'teknesyum-raf.json');

function rx(k) {
  try {
    return k ? new RegExp(k, 'i') : null;
  } catch {
    return null;
  }
}

function meta(metin) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(metin || '');
  if (!m) return null;
  const o = { tetik: null, icerik: null, her: false, ister: [] };
  for (const satir of m[1].split(/\r?\n/)) {
    const k = /^([a-zçğıöşü]+)\s*:\s*(.*)$/i.exec(satir.trim());
    if (!k) continue;
    const ad = k[1].toLowerCase();
    const v = k[2].trim();
    if (ad === 'tetik') o.tetik = rx(v);
    else if (ad === 'icerik' || ad === 'içerik') o.icerik = rx(v);
    else if (ad === 'her') o.her = /^(evet|true|1)$/i.test(v);
    else if (ad === 'ister')
      try {
        const i = JSON.parse(v);
        if (i && typeof i.dosya === 'string' && rx(i.dosya)) o.ister.push(i);
      } catch {}
  }
  return o.tetik || o.icerik || o.her ? o : null;
}

function ozet(metin) {
  return crypto.createHash('sha256').update(String(metin || '').replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);
}

function dosyaOku(f) {
  try {
    return fs.readFileSync(f, 'utf8');
  } catch {
    return null;
  }
}

function kitaplar() {
  const out = [];
  let adlar = [];
  try {
    adlar = fs.readdirSync(dir()).filter((f) => /\.md$/i.test(f) && !/^(agents|claude)\.md$/i.test(f));
  } catch {
    return out;
  }
  for (const f of adlar.sort()) {
    const pp = dosyaOku(path.join(dir(), f));
    const m = meta(pp);
    if (!m) continue;
    const teknik = dosyaOku(path.join(root(), KURAL, f)) || '';
    out.push({ ad: f.replace(/\.md$/i, ''), meta: m, ozet: ozet(pp + '\n' + teknik) });
  }
  return out;
}

function dosyalar(kok, sinir) {
  const out = [];
  const yigin = [['', 0]];
  const tavan = sinir || 6000;
  while (yigin.length && out.length < tavan) {
    const [rel, derin] = yigin.pop();
    let girdiler;
    try {
      girdiler = fs.readdirSync(path.join(kok, rel), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of girdiler) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) {
        if (derin < 8 && !ATLA.test(e.name)) yigin.push([r, derin + 1]);
      } else if (e.isFile()) out.push(r);
    }
  }
  return out;
}

function metinOku(kok, rel) {
  try {
    const f = path.join(kok, rel);
    if (fs.statSync(f).size > 262144) return null;
    return fs.readFileSync(f, 'utf8');
  } catch {
    return null;
  }
}

function uyan(kok, secenek) {
  const s = secenek || {};
  const hepsi = s.kitaplar || kitaplar();
  if (!hepsi.length) return [];
  const l = s.liste || dosyalar(kok);
  const kalan = [];
  const out = [];
  for (const k of hepsi) {
    if (k.meta.her || (k.meta.tetik && l.some((r) => k.meta.tetik.test(r)))) out.push(k);
    else if (s.icerik !== false && k.meta.icerik) kalan.push(k);
  }
  if (kalan.length)
    for (const r of l) {
      if (!kalan.length) break;
      if (!METIN.test(r)) continue;
      const t = metinOku(kok, r);
      if (t === null) continue;
      for (let i = kalan.length - 1; i >= 0; i--) if (kalan[i].meta.icerik.test(t)) out.push(kalan.splice(i, 1)[0]);
    }
  return out.sort((a, b) => a.ad.localeCompare(b.ad));
}

function denetle(kok, kitap, liste_) {
  const l = liste_ || dosyalar(kok);
  const out = [];
  for (const i of kitap.meta.ister) {
    const d = rx(i.dosya);
    const seviye = i.seviye === 'warn' ? 'warn' : 'error';
    const mesaj = '[' + kitap.ad + '] ' + (i.mesaj || i.dosya);
    const eslesen = l.filter((r) => d.test(r));
    if (i.var === true && !eslesen.length) out.push({ file: '', line: 0, severity: seviye, message: mesaj });
    if (i.var === false) for (const r of eslesen) out.push({ file: r, line: 0, severity: seviye, message: mesaj });
    const icerir = rx(i.icerir);
    const icermez = rx(i.icermez);
    if (!icerir && !icermez) continue;
    for (const r of eslesen) {
      const t = metinOku(kok, r);
      if (t === null) continue;
      if (icerir && !icerir.test(t)) out.push({ file: r, line: 1, severity: seviye, message: mesaj });
      if (icermez)
        t.split(/\r?\n/).forEach((satir, n) => {
          if (icermez.test(satir)) out.push({ file: r, line: n + 1, severity: seviye, message: mesaj });
        });
    }
  }
  return out;
}

function kayit(kok) {
  try {
    return JSON.parse(fs.readFileSync(path.join(kok, KAYIT), 'utf8')) || {};
  } catch {
    return {};
  }
}

function kaydet(kok, ad, oz) {
  const k = kayit(kok);
  k[ad] = { ozet: oz, tarih: new Date().toISOString().slice(0, 10) };
  fs.mkdirSync(path.join(kok, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(kok, KAYIT), JSON.stringify(k, null, 2) + '\n');
}

function bekleyen(kok, secenek) {
  if (!var_()) return [];
  const k = kayit(kok);
  return uyan(kok, secenek)
    .filter((b) => !k[b.ad] || k[b.ad].ozet !== b.ozet)
    .map((b) => ({ ad: b.ad, ozet: b.ozet, meta: b.meta, neden: k[b.ad] ? 'değişti' : 'hiç uygulanmadı' }));
}

function deger(args, ad) {
  const i = args.indexOf(ad);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
}

function uyanCli(args) {
  const kok = path.resolve(deger(args, '--uyan') || process.cwd());
  const k = kayit(kok);
  const u = uyan(kok);
  const durum = (b) => (!k[b.ad] ? 'hiç uygulanmadı' : k[b.ad].ozet !== b.ozet ? 'değişti' : 'uygulandı ' + k[b.ad].tarih);
  process.stdout.write(u.length ? u.map((b) => b.ad + '  ' + durum(b)).join('\n') + '\n' : 'bu projeye uyan kitap yok\n');
  return 0;
}

function uyduCli(args) {
  const ad = deger(args, '--uydu');
  const kok = path.resolve(deger(args, '--project') || process.cwd());
  const b = kitaplar().find((x) => x.ad === ad);
  if (!b) {
    process.stderr.write('no enforceable book: ' + ad + '\n');
    return 2;
  }
  const acik = denetle(kok, b).filter((f) => f.severity === 'error');
  if (acik.length) {
    const satir = (f) => (f.file || '.') + (f.line ? ':' + f.line : '') + '  ' + f.message;
    process.stderr.write(acik.map(satir).join('\n') + '\n' + acik.length + ' open, not recorded\n');
    return 1;
  }
  kaydet(kok, ad, b.ozet);
  process.stdout.write(ad + ' recorded at ' + b.ozet + '\n');
  return 0;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(
      'Usage: node raf.js [name] | --uyan [root] | --uydu <name> [--project root]\n\nReads the private shelf under ' +
        path.join(root(), KURAL) +
        ' first, then ' +
        dir() +
        '\nNo name lists the books. Exit: 0 fine · 1 no shelf · 2 no such book\n'
    );
    return 0;
  }
  if (!var_()) {
    process.stderr.write('no private shelf at ' + dir() + '\n');
    return 1;
  }
  if (args.includes('--uyan')) return uyanCli(args);
  if (args.includes('--uydu')) return uyduCli(args);
  const name = args.find((a) => !a.startsWith('-'));
  if (!name) {
    process.stdout.write(liste().join('\n') + '\n');
    return 0;
  }
  const body = oku(name);
  if (body === null) {
    process.stderr.write('no such book: ' + name + '; pick from ' + liste().join(', ') + '\n');
    return 2;
  }
  process.stdout.write(body.replace(/\s*$/, '') + '\n');
  return 0;
}

module.exports = { root, dir, var: var_, liste, oku, meta, ozet, kitaplar, dosyalar, uyan, denetle, kayit, kaydet, bekleyen };

if (require.main === module) process.exitCode = main(process.argv);
