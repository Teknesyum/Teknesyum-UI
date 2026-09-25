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
const KAYDET = require('./kaydet');
const PORT = 4317;
const VARLIK = path.join(UI, 'skills', 'teknesyum-ui', 'assets');
const SABLON = path.join(UI, 'templates');
const STANDART = [
  path.join(VARLIK, 'theme.css'),
  path.join(VARLIK, 'forms.css'),
  path.join(VARLIK, 'states.css'),
  path.join(SABLON, 'ustcubuk', 'react', 'titlebar.css'),
  path.join(SABLON, 'ilerleme', 'react', 'progressbar.css'),
  path.join(SABLON, 'durum', 'electron', 'badge.css'),
  path.join(SABLON, 'kur', 'panel.css'),
];

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

function standartCss() {
  return STANDART.map((d) => {
    let c = fs.readFileSync(d, 'utf8').replace(/\r\n/g, '\n');
    if (d.endsWith('theme.css')) c = c.replace(/^body \{[\s\S]*?^\}\n/m, '');
    return '/* ' + path.relative(UI, d).replace(/\\/g, '/') + ' */\n' + c;
  }).join('\n');
}

function yanit(yol) {
  const temiz = String(yol || '/').split('?')[0];
  try {
    if (temiz === '/kontrast.js') return { status: 200, type: TUR['.js'], body: kontrastTarayici() };
    if (temiz === '/standart.css') return { status: 200, type: TUR['.css'], body: standartCss() };
    const dosya = YOL[temiz];
    if (!dosya) return { status: 404, type: 'text/plain; charset=utf-8', body: 'Bulunamadı' };
    return { status: 200, type: TUR[path.extname(dosya)], body: fs.readFileSync(dosya, 'utf8') };
  } catch (e) {
    return { status: 500, type: 'text/plain; charset=utf-8', body: String(e && e.message ? e.message : e) };
  }
}

function json(status, nesne) {
  return { status, type: TUR['.json'], body: JSON.stringify(nesne) };
}

function istek(yontem, yol, govde, basliklar) {
  const temiz = String(yol || '/').split('?')[0];
  const b = basliklar || {};
  if (temiz === '/surum') return json(200, { surum: KAYDET.surum() });
  if (temiz === '/kaydet/durum') return json(200, KAYDET.durum());
  if (temiz === '/kaydet') {
    if (yontem !== 'POST') return json(405, { hata: 'Yalnız POST.' });
    if (b['x-onizleme'] !== '1' || !/^application\/json/.test(b['content-type'] || '')) return json(403, { hata: 'İstek önizlemeden gelmedi.' });
    if (b.origin && !/^(onizleme:\/\/sayfa|http:\/\/127\.0\.0\.1:\d+)$/.test(b.origin)) return json(403, { hata: 'Yabancı köken.' });
    let veri;
    try {
      veri = JSON.parse(govde || '');
    } catch {
      return json(400, { hata: 'Gövde JSON değil.' });
    }
    try {
      KAYDET.dogrula(veri, JSON.parse(fs.readFileSync(TOKENS, 'utf8')));
    } catch (e) {
      return json(400, { hata: e.message });
    }
    const r = KAYDET.baslat(veri);
    return json(r.status, r.body);
  }
  if (yontem !== 'GET' && yontem !== 'HEAD') return json(405, { hata: 'Yalnız GET.' });
  return yanit(temiz);
}

function sunucu() {
  return http.createServer((req, res) => {
    const parca = [];
    let boy = 0;
    req.on('data', (c) => {
      boy += c.length;
      if (boy <= 65536) parca.push(c);
    });
    req.on('end', () => {
      const r =
        boy > 65536
          ? json(413, { hata: 'Gövde çok büyük.' })
          : istek(req.method, req.url, Buffer.concat(parca).toString('utf8'), req.headers);
      res.writeHead(r.status, { 'Content-Type': r.type, 'Cache-Control': 'no-store' });
      res.end(r.body);
    });
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

module.exports = { yanit, istek, sunucu, baslat, kontrastTarayici, TOKENS, KONTRAST };
