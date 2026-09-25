#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const UI = path.resolve(__dirname, '..');
const SAYFA = path.join(UI, 'onizleme');
const TOKENS = path.join(UI, 'templates', 'neon.tokens.json');
const KONTRAST = path.join(__dirname, 'kontrast.js');
const PORT = 4317;

const TUR = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const YOL = {
  '/': path.join(SAYFA, 'index.html'),
  '/index.html': path.join(SAYFA, 'index.html'),
  '/stil.css': path.join(SAYFA, 'stil.css'),
  '/uygulama.js': path.join(SAYFA, 'uygulama.js'),
  '/tokens.json': TOKENS,
};

function kontrastTarayici() {
  const kaynak = fs.readFileSync(KONTRAST, 'utf8');
  return (
    '(function () {\nvar module = { exports: {} };\nvar exports = module.exports;\n' +
    kaynak +
    '\nwindow.Kontrast = module.exports;\n})();\n'
  );
}

function yanit(yol) {
  const temiz = String(yol || '/').split('?')[0];
  try {
    if (temiz === '/kontrast.js') return { status: 200, type: TUR['.js'], body: kontrastTarayici() };
    const dosya = YOL[temiz];
    if (!dosya) return { status: 404, type: 'text/plain; charset=utf-8', body: 'Bulunamadı' };
    return { status: 200, type: TUR[path.extname(dosya)], body: fs.readFileSync(dosya, 'utf8') };
  } catch (e) {
    return { status: 500, type: 'text/plain; charset=utf-8', body: String(e && e.message ? e.message : e) };
  }
}

function sunucu() {
  return http.createServer((req, res) => {
    const r = yanit(req.url);
    res.writeHead(r.status, { 'Content-Type': r.type, 'Cache-Control': 'no-store' });
    res.end(r.body);
  });
}

function baslat(port) {
  return new Promise((resolve, reject) => {
    const s = sunucu();
    s.once('error', (e) => {
      if (e.code === 'EADDRINUSE' && port !== 0) resolve(baslat(0));
      else reject(e);
    });
    s.listen(port, '127.0.0.1', () => resolve(s));
  });
}

function ac(url) {
  const secenek = { detached: true, stdio: 'ignore', windowsHide: true };
  let c;
  if (process.platform === 'win32') c = spawn('cmd.exe', ['/c', 'start', '', url], secenek);
  else if (process.platform === 'darwin') c = spawn('open', [url], secenek);
  else c = spawn('xdg-open', [url], secenek);
  c.on('error', () => process.stdout.write('Tarayıcı açılamadı; adresi elle açın.\n'));
  c.unref();
}

function masaustu(argv) {
  const kok = path.join(SAYFA, 'masaustu');
  let exe;
  try {
    exe = require(path.join(kok, 'node_modules', 'electron'));
  } catch {
    process.stdout.write('Electron kuruluyor (ilk açılış, bir kez)…\n');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const k = require('child_process').spawnSync(npm, ['install', '--no-audit', '--no-fund'], { cwd: kok, stdio: 'inherit', shell: true });
    if (k.status !== 0) throw new Error('Electron kurulamadı; --tarayici ile açın.');
    delete require.cache[require.resolve(path.join(kok, 'node_modules', 'electron'))];
    exe = require(path.join(kok, 'node_modules', 'electron'));
  }
  const bekle = argv.includes('--bekle');
  const c = spawn(exe, [kok], { detached: !bekle, stdio: bekle ? 'inherit' : 'ignore', windowsHide: false });
  if (bekle) c.on('exit', (kod) => (process.exitCode = kod || 0));
  else c.unref();
  process.stdout.write('Önizleme penceresi açıldı.\n');
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.includes('--tarayici')) return masaustu(argv);
  const i = argv.indexOf('--port');
  const port = i >= 0 ? Number(argv[i + 1]) : PORT;
  const s = await baslat(Number.isFinite(port) ? port : PORT);
  const url = 'http://127.0.0.1:' + s.address().port + '/';
  process.stdout.write('Önizleme: ' + url + '\nDurdurmak için Ctrl+C.\n');
  if (!argv.includes('--no-open')) ac(url);
}

if (require.main === module)
  main().catch((e) => {
    process.stderr.write(String(e && e.message ? e.message : e) + '\n');
    process.exitCode = 1;
  });

module.exports = { yanit, sunucu, baslat, kontrastTarayici, TOKENS, KONTRAST };
