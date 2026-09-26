'use strict';

const { contextBridge, ipcRenderer } = require('electron');

let son = null;
const dinleyenler = [];
ipcRenderer.on('pencere:durum', (_e, d) => {
  son = d;
  for (const cb of dinleyenler) cb(d);
});

contextBridge.exposeInMainWorld('pencere', {
  komut: (k) => ipcRenderer.send('pencere:komut', k),
  durum: (cb) => {
    dinleyenler.push(cb);
    if (son) cb(son);
  },
});