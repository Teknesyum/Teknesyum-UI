const { BrowserWindow } = require('electron');

function pencere() {
  const w = new BrowserWindow({ width: 1200, height: 780 });
  w.show();
  return w;
}

module.exports = { pencere };
