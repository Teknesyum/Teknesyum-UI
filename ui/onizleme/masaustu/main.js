'use strict';

const path = require('path');
const { app, BrowserWindow, protocol, shell } = require('electron');
const { yanit, TOKENS } = require(path.join(__dirname, '..', '..', 'scripts', 'onizleme.js'));

const SEMA = 'onizleme';
const KOK = SEMA + '://sayfa/';

protocol.registerSchemesAsPrivileged([
  { scheme: SEMA, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

function yuzey() {
  try {
    return require(TOKENS).brand.surface.value;
  } catch {
    return '#000000';
  }
}

function pencere() {
  const w = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 720,
    minHeight: 480,
    title: 'Teknesyum Renk Önizleme',
    backgroundColor: yuzey(),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  w.once('ready-to-show', () => w.show());
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  w.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(KOK)) e.preventDefault();
  });
  w.loadURL(KOK);
}

app.whenReady().then(() => {
  protocol.handle(SEMA, (req) => {
    const r = yanit(new URL(req.url).pathname);
    return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.type, 'Cache-Control': 'no-store' } });
  });
  pencere();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) pencere();
  });
});

app.on('window-all-closed', () => app.quit());
