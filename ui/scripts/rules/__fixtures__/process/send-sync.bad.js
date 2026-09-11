const { ipcRenderer } = require('electron');

const settings = ipcRenderer.sendSync('settings:read');
