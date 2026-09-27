'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const YEREL = path.resolve(__dirname, '..', 'onizleme', 'ozel-ayar.json');
const ALT = path.join('teknesyum-ui', 'onizleme', 'ayarlar.json');
const TOKEN_ALT = path.join('teknesyum-ui', 'benim.tokens.json');
const NOT_ALT = path.join('teknesyum-ui', 'benim.notlar.json');
const ESKI_RENK = { blue: 'renk-1', pink: 'renk-2', purple: 'renk-3' };
const ESKI_AD = /^(blue|pink|purple)(-text)?(-\d+)?$/;

function yeniAd(ad) {
  return ESKI_AD.test(ad) ? ad.replace(/^[a-z]+/, (b) => ESKI_RENK[b]) : ad;
}

const DEGERLI = new Set(['renk', 'kenar', 'ref']);

function yeniAdlar(v, anahtar) {
  if (Array.isArray(v)) return v.map((x) => yeniAdlar(x, anahtar));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [yeniAd(k), yeniAdlar(x, k)]));
  return typeof v === 'string' && DEGERLI.has(anahtar) ? yeniAd(v) : v;
}

function raf() {
  const kok = process.env.TEKNESYUM_PRIVATE || path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'teknesyum-private');
  try {
    return fs.statSync(kok).isDirectory() ? kok : null;
  } catch {
    return null;
  }
}

function yer() {
  const kok = raf();
  return kok ? { tur: 'raf', kok, dosya: path.join(kok, ALT) } : { tur: 'yerel', kok: null, dosya: YEREL };
}

function oku() {
  const y = yer();
  let ayar = null;
  try {
    ayar = JSON.parse(fs.readFileSync(y.dosya, 'utf8'));
  } catch {
    ayar = null;
  }
  if (ayar && ayar.fark) ayar.fark = yeniAdlar(ayar.fark);
  return { var: !!ayar, tur: y.tur, yol: y.dosya, ayar };
}

function dogrula(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Ayar bir nesne olmalı.');
  if (!v.fark || typeof v.fark !== 'object' || Array.isArray(v.fark)) throw new Error('fark alanı eksik.');
  const renk = v.fark.renk || {};
  for (const [k, h] of Object.entries(renk)) if (!/^[a-z0-9-]+$/.test(k) || !/^#[0-9a-f]{6}$/i.test(String(h))) throw new Error('Geçersiz renk: ' + k);
}

function gonder(kok, dosyalar) {
  const rel = (d) => path.relative(kok, d).split(path.sep).join('/');
  const bagil = [].concat(dosyalar).filter((d) => fs.existsSync(d)).map(rel);
  const giden = [].concat(dosyalar).filter((d) => !fs.existsSync(d)).map(rel);
  const tum = bagil.concat(giden);
  const git = (args) => new Promise((r) => {
    const c = spawn('git', args, { cwd: kok, windowsHide: true, stdio: 'ignore' });
    c.on('error', () => r(1));
    c.on('exit', (k) => r(k));
  });
  const is = { durum: 'gonderiliyor' };
  (async () => {
    if (!fs.existsSync(path.join(kok, '.git'))) return (is.durum = 'git-yok');
    if (giden.length) await git(['rm', '-q', '--cached', '--ignore-unmatch', '--', ...giden]);
    if ((await git(['add', '--sparse', '--', ...bagil])) !== 0 && (await git(['add', '--', ...bagil])) !== 0) return (is.durum = 'add-durdu');
    const degisti = (await git(['diff', '--cached', '--quiet', '--', ...tum])) !== 0;
    if (degisti && (await git(['commit', '-q', '-m', 'teknesyum-ui: önizleme ayarı', '--', ...tum])) !== 0) return (is.durum = 'commit-durdu');
    is.durum = (await git(['push', '-q'])) === 0 ? 'gonderildi' : 'push-durdu';
  })();
  return is;
}

let son = null;

function tokenYollari() {
  const y = yer();
  return y.kok ? { tokenlar: path.join(y.kok, TOKEN_ALT), notlar: path.join(y.kok, NOT_ALT) } : null;
}

function tokenYaz(degisen) {
  const yol = tokenYollari();
  if (!yol || !degisen || typeof degisen !== 'object' || Array.isArray(degisen)) return null;
  const K = require('./kaydet');
  const d = Object.assign({}, degisen);
  delete d._;
  const metin = K.tokenMetni(fs.readFileSync(K.TOKENS, 'utf8'), d).metin;
  fs.mkdirSync(path.dirname(yol.tokenlar), { recursive: true });
  fs.writeFileSync(yol.tokenlar, metin);
  fs.rmSync(yol.notlar, { force: true });
  return yol.tokenlar;
}

function yaz(v) {
  dogrula(v);
  const y = yer();
  const degisen = v.tokenlar;
  delete v.tokenlar;
  fs.mkdirSync(path.dirname(y.dosya), { recursive: true });
  fs.writeFileSync(y.dosya, JSON.stringify(v, null, 2) + '\n');
  return { tur: y.tur, yol: y.dosya, tokenlar: tokenYaz(degisen) };
}

function yayimla() {
  const y = yer();
  if (y.tur !== 'raf') throw new Error('Özel raf yok; yerel kayıt yayımlanmaz.');
  if (!fs.existsSync(y.dosya)) throw new Error('Önce kaydet.');
  const yol = tokenYollari();
  son = process.env.TEKNESYUM_OZEL_GITSIZ ? { durum: 'gitsiz' } : gonder(y.kok, [y.dosya, yol.tokenlar, yol.notlar]);
  return { tur: y.tur, gonderim: son.durum };
}

function yayinli() {
  const y = yer();
  if (y.tur !== 'raf') return { var: false, ayar: null };
  try {
    const bagil = path.relative(y.kok, y.dosya).split(path.sep).join('/');
    const metin = execFileSync('git', ['show', 'HEAD:' + bagil], { cwd: y.kok, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8');
    const ayar = JSON.parse(metin);
    if (ayar && ayar.fark) ayar.fark = yeniAdlar(ayar.fark);
    return { var: true, ayar };
  } catch {
    return { var: false, ayar: null };
  }
}

function gonderim() {
  return son ? son.durum : null;
}

module.exports = { yer, oku, yaz, yayimla, yayinli, dogrula, gonderim, yeniAdlar, tokenYollari, tokenYaz, YEREL };
