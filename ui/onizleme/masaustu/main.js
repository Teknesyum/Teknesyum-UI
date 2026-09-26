'use strict';

const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain, protocol, screen, session, shell } = require('electron');
const { istek, TOKENS } = require(path.join(__dirname, '..', '..', 'scripts', 'onizleme.js'));

const SEMA = 'onizleme';
const KOK = SEMA + '://sayfa/';

protocol.registerSchemesAsPrivileged([
  { scheme: SEMA, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-smooth-scrolling');

if (!app.requestSingleInstanceLock()) app.exit(0);

let ana = null;

function yuzey() {
  try {
    return require(TOKENS).brand.surface.value;
  } catch {
    return '#000000';
  }
}

function surum() {
  try {
    return JSON.parse(istek('GET', '/surum').body).surum;
  } catch {
    return '';
  }
}

function durumYolu() {
  return path.join(app.getPath('userData'), 'pencere.json');
}

function durumOku() {
  try {
    const d = JSON.parse(fs.readFileSync(durumYolu(), 'utf8'));
    const s = d && d.sinir;
    if (!s || !(s.width >= 1024 && s.height >= 640)) return { buyuk: !!(d && d.buyuk) };
    const ekran = screen.getDisplayMatching(s).workArea;
    const gorunur = s.x < ekran.x + ekran.width && s.x + s.width > ekran.x && s.y < ekran.y + ekran.height && s.y + s.height > ekran.y;
    return { sinir: gorunur ? s : { width: s.width, height: s.height }, buyuk: !!d.buyuk };
  } catch {
    return {};
  }
}

function durumYaz(w) {
  try {
    fs.writeFileSync(durumYolu(), JSON.stringify({ sinir: w.getNormalBounds(), buyuk: w.isMaximized() || w.isFullScreen() }));
  } catch {}
}

function pencere() {
  const d = durumOku();
  const w = new BrowserWindow({
    width: 1440,
    height: 920,
    ...(d.sinir || {}),
    minWidth: 1024,
    minHeight: 640,
    title: 'TeknesyumUI ' + surum(),
    icon: path.join(__dirname, 'ikon', 'ikon.png'),
    backgroundColor: yuzey(),
    frame: false,
    thickFrame: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false },
  });
  const bildir = () => {
    if (!w.isDestroyed()) w.webContents.send('pencere:durum', w.isFullScreen() ? 'fullscreen' : w.isMaximized() ? 'maximized' : 'normal');
  };
  for (const o of ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen', 'restore']) w.on(o, bildir);
  w.webContents.on('did-finish-load', bildir);
  w.once('ready-to-show', () => {
    if (d.buyuk) w.maximize();
    w.show();
  });
  w.on('close', () => durumYaz(w));
  w.on('page-title-updated', (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  w.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(KOK)) e.preventDefault();
  });
  w.on('closed', () => {
    if (ana === w) ana = null;
  });
  w.loadURL(KOK);
  ana = w;
}

app.on('second-instance', () => {
  if (!ana) return pencere();
  ana.setTitle('TeknesyumUI ' + surum());
  ana.webContents.reloadIgnoringCache();
  if (ana.isMinimized()) ana.restore();
  ana.focus();
});

ipcMain.on('pencere:komut', (e, komut) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  if (komut === 'kucult') w.minimize();
  else if (komut === 'buyut') w.isMaximized() ? w.unmaximize() : w.maximize();
  else if (komut === 'kapat') w.close();
});

app.whenReady().then(async () => {
  await session.defaultSession.clearCache();
  await session.defaultSession.clearCodeCaches({});
  protocol.handle(SEMA, async (req) => {
    const govde = req.method === 'POST' ? await req.text() : '';
    const basliklar = Object.fromEntries(req.headers.entries());
    const r = istek(req.method, new URL(req.url).pathname, govde, basliklar);
    return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.type, 'Cache-Control': 'no-store' } });
  });
  pencere();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) pencere();
  });
});

app.on('window-all-closed', () => app.quit());
