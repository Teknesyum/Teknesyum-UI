const { ipcRenderer } = require('electron');

const settings = ipcRenderer.invoke('settings:read');
