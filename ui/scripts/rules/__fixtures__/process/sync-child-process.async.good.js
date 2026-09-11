const { ipcMain } = require('electron');
const { execFile } = require('child_process');

ipcMain.handle('pull', () => new Promise((resolve) => execFile('git', ['pull'], (e) => resolve(!e))));
