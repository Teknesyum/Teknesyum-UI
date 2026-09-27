#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const URETILEN = new Set(['bin', 'obj', 'dist', 'build', 'out', 'target', '.next', '.nuxt', '.svelte-kit', '.vite', '.turbo', '.parcel-cache', '.angular', 'coverage', 'TestResults', 'publish', '__pycache__', '.pytest_cache', '.mypy_cache', 'tmp', 'temp', '.vs']);
const GIRME = new Set(['.git', 'node_modules', 'trash']);
const DOSYA = /\.(log|tmp|dmp|bak|orig)$/i;
const YALNIZ_RAPOR = new Set(['node_modules', 'trash']);

function boyut(p) {
  let st;
  try {
    st = fs.lstatSync(p);
  } catch {
    return 0;
  }
  if (st.isSymbolicLink()) return 0;
  if (!st.isDirectory()) return st.size;
  let toplam = 0;
  let adlar = [];
  try {
    adlar = fs.readdirSync(p);
  } catch {
    return 0;
  }
  for (const a of adlar) toplam += boyut(path.join(p, a));
  return toplam;
}

function git(kok, args) {
  return spawnSync('git', ['-C', kok].concat(args), { encoding: 'utf8', windowsHide: true });
}

function silinebilir(kok, rel) {
  if (!fs.existsSync(path.join(kok, '.git'))) return false;
  if (git(kok, ['check-ignore', '-q', rel]).status !== 0) return false;
  const izli = git(kok, ['ls-files', '--', rel]);
  return izli.status === 0 && !String(izli.stdout).trim();
}

function tara(kok) {
  const out = [];
  const yigin = [kok];
  while (yigin.length) {
    const dir = yigin.pop();
    let girdiler;
    try {
      girdiler = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of girdiler) {
      const tam = path.join(dir, e.name);
      const rel = path.relative(kok, tam).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (YALNIZ_RAPOR.has(e.name)) out.push({ rel, bayt: boyut(tam), tur: e.name, sil: false });
        else if (URETILEN.has(e.name)) out.push({ rel, bayt: boyut(tam), tur: 'üretilen', sil: silinebilir(kok, rel) });
        else if (!GIRME.has(e.name)) yigin.push(tam);
      } else if (e.isFile() && DOSYA.test(e.name)) {
        out.push({ rel, bayt: boyut(tam), tur: 'artık dosya', sil: silinebilir(kok, rel) });
      }
    }
  }
  return out.sort((a, b) => b.bayt - a.bayt);
}

function mb(b) {
  return (b / 1048576).toFixed(1) + ' MB';
}

function temizle(kok, liste) {
  let bayt = 0;
  for (const x of liste) {
    if (!x.sil) continue;
    try {
      fs.rmSync(path.join(kok, x.rel), { recursive: true, force: true });
      bayt += x.bayt;
      x.silindi = true;
    } catch {}
  }
  return bayt;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node artik.js [root] [--sil]\n\nMeasures build output, caches, logs and temp files under root. --sil deletes\nonly what git ignores and does not track, so it can be rebuilt. node_modules\nand trash/ are measured but never deleted here.\n');
    return 0;
  }
  const kok = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
  const liste = tara(kok);
  const toplam = liste.reduce((t, x) => t + x.bayt, 0);
  const gorunen = liste.filter((x) => x.bayt >= 1048576);
  for (const x of gorunen.slice(0, 20)) process.stdout.write(mb(x.bayt).padStart(10) + '  ' + x.rel + '  (' + x.tur + (x.sil ? ', silinebilir' : '') + ')\n');
  if (gorunen.length > 20) process.stdout.write('  … ' + (gorunen.length - 20) + ' kalem daha\n');
  process.stdout.write('Toplam ' + mb(toplam) + ', silinebilir ' + mb(liste.filter((x) => x.sil).reduce((t, x) => t + x.bayt, 0)) + '\n');
  if (args.includes('--sil')) process.stdout.write('Silindi ' + mb(temizle(kok, liste)) + '\n');
  return 0;
}

module.exports = { tara, temizle };

if (require.main === module) process.exitCode = main(process.argv);
