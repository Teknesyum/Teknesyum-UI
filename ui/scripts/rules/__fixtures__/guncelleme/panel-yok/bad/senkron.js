const { execFile } = require('child_process');

function esitle() {
  return new Promise((coz) => execFile('git', ['pull'], (e) => coz(!e)));
}

module.exports = { esitle };
