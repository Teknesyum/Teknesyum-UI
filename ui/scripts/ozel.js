'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const YEREL = path.resolve(__dirname, '..', 'onizleme', 'ozel-ayar.json');
const ALT = path.join('teknesyum-ui', 'onizleme', 'ayarlar.json');

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
  return { var: !!ayar, tur: y.tur, yol: y.dosya, ayar };
}

function dogrula(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Ayar bir nesne olmalı.');
  if (!v.fark || typeof v.fark !== 'object' || Array.isArray(v.fark)) throw new Error('fark alanı eksik.');
  const renk = v.fark.renk || {};
  for (const [k, h] of Object.entries(renk)) if (!/^[a-z-]+$/.test(k) || !/^#[0-9a-f]{6}$/i.test(String(h))) throw new Error('Geçersiz renk: ' + k);
}

function gonder(kok, dosya) {
  const bagil = path.relative(kok, dosya).split(path.sep).join('/');
  const git = (args) => new Promise((r) => {
    const c = spawn('git', args, { cwd: kok, windowsHide: true, stdio: 'ignore' });
    c.on('error', () => r(1));
    c.on('exit', (k) => r(k));
  });
  const is = { durum: 'gonderiliyor' };
  (async () => {
    if (!fs.existsSync(path.join(kok, '.git'))) return (is.durum = 'git-yok');
    if ((await git(['add', '--sparse', '--', bagil])) !== 0 && (await git(['add', '--', bagil])) !== 0) return (is.durum = 'add-durdu');
    const degisti = (await git(['diff', '--cached', '--quiet', '--', bagil])) !== 0;
    if (degisti && (await git(['commit', '-q', '-m', 'teknesyum-ui: önizleme ayarı', '--', bagil])) !== 0) return (is.durum = 'commit-durdu');
    is.durum = (await git(['push', '-q'])) === 0 ? 'gonderildi' : 'push-durdu';
  })();
  return is;
}

let son = null;

function yaz(v) {
  dogrula(v);
  const y = yer();
  fs.mkdirSync(path.dirname(y.dosya), { recursive: true });
  fs.writeFileSync(y.dosya, JSON.stringify(v, null, 2) + '\n');
  son = y.tur === 'raf' && !process.env.TEKNESYUM_OZEL_GITSIZ ? gonder(y.kok, y.dosya) : null;
  return { tur: y.tur, yol: y.dosya, gonderim: son ? son.durum : null };
}

function gonderim() {
  return son ? son.durum : null;
}

module.exports = { yer, oku, yaz, dogrula, gonderim, YEREL };
