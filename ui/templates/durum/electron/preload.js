'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sync', {
  now: () => ipcRenderer.invoke('sync:now'),
  state: () => ipcRenderer.invoke('sync:state'),
  onChange: (cb) => ipcRenderer.on('sync:changed', (_event, s) => cb(s)),
});
