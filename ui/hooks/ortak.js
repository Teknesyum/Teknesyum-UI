const fs = require('fs');
const path = require('path');

const PLUGIN = path.resolve(__dirname, '..');
const CONFIG_NAME = 'teknesyum-ui.json';
const UI_FILE = /\.(css|tsx|jsx|vue|svelte|xaml|axaml)$/i;
const SKIP = /^(\.|node_modules$|bin$|obj$|dist$|build$|out$|trash$|teknesyum-ui$|vendor$|packages$)/;

function home() {
  return process.env.USERPROFILE || process.env.HOME || '.';
}

function configRoot() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(home(), '.claude');
}

function read(f) {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

function gitRoot(from) {
  let d = path.resolve(from);
  const stop = path.resolve(home());
  while (d && d !== stop) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}

function kendisi(root) {
  const p = read(path.join(root, 'ui', '.claude-plugin', 'plugin.json'));
  return !!(p && p.name === 'teknesyum-ui') || path.resolve(root).startsWith(path.resolve(configRoot()));
}

function ayar(root) {
  const machine = read(path.join(configRoot(), CONFIG_NAME));
  const project = read(path.join(root, '.claude', CONFIG_NAME));
  const kapali = (c) => !!c && (c.off === true || c.kapali === true);
  const off = project && ('off' in project || 'kapali' in project) ? kapali(project) : kapali(machine);
  return { machine, project, var: !!(machine || project), off };
}

function uiVar(root) {
  const stack = [[root, 0]];
  let bakilan = 0;
  while (stack.length && bakilan < 4000) {
    const [dir, derin] = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      bakilan++;
      if (e.isDirectory()) {
        if (derin < 6 && !SKIP.test(e.name)) stack.push([path.join(dir, e.name), derin + 1]);
      } else if (UI_FILE.test(e.name)) return true;
    }
  }
  return false;
}

function duzen() {
  try {
    const b = require(path.join(PLUGIN, 'scripts', 'setup.js')).benim();
    return b ? b.duzen : null;
  } catch {
    return null;
  }
}

function komut(ad, ek) {
  return 'node "' + path.join(PLUGIN, 'scripts', ad) + '"' + (ek ? ' ' + ek : '');
}

function girdi(fn) {
  let raw = '';
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    let out = null;
    try {
      out = fn(JSON.parse(raw || '{}'));
    } catch {}
    if (out) process.stdout.write(JSON.stringify(out));
    process.exit(0);
  });
}

module.exports = { PLUGIN, UI_FILE, read, gitRoot, kendisi, ayar, uiVar, duzen, komut, girdi };
