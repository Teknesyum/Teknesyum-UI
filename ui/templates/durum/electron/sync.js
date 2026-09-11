'use strict';

const { execFile } = require('child_process');
const { ipcMain } = require('electron');

function git(cwd, args) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, windowsHide: true, timeout: 60000 }, (error, stdout, stderr) => {
      resolve({ ok: !error, out: String(stdout || '') + String(stderr || '') });
    });
  });
}

function createSync({ cwd, interval = 60000, send }) {
  let queue = Promise.resolve();
  let last = { state: 'syncing', at: null };

  const publish = (state) => {
    last = { state, at: state === 'synced' ? Date.now() : last.at };
    send(last);
  };

  const run = async () => {
    publish('syncing');
    const pull = await git(cwd, ['pull', '--no-rebase', '--no-edit']);
    if (!pull.ok) return publish('offline');
    const push = await git(cwd, ['push']);
    return publish(push.ok ? 'synced' : 'offline');
  };

  const now = () => {
    queue = queue.then(run, run);
    return queue;
  };
  const timer = setInterval(now, interval);
  return { now, state: () => last, stop: () => clearInterval(timer) };
}

function attachSync(win, options) {
  const send = (s) => {
    if (!win.isDestroyed()) win.webContents.send('sync:changed', s);
  };
  const sync = createSync({ ...options, send });
  ipcMain.handle('sync:now', () => sync.now().then(sync.state));
  ipcMain.handle('sync:state', () => sync.state());
  win.webContents.once('did-finish-load', () => sync.now());
  win.on('closed', () => {
    sync.stop();
    ipcMain.removeHandler('sync:now');
    ipcMain.removeHandler('sync:state');
  });
  return sync;
}

module.exports = { createSync, attachSync };
