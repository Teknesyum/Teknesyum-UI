const { BrowserWindow } = require('electron');

function pencere() {
  const w = new BrowserWindow({ width: 1200, height: 780, show: false });
  w.once('ready-to-show', () => {
    w.maximize();
    w.show();
  });
  return w;
}

module.exports = { pencere };
