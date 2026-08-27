'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const OUTPUTS = ['theme.css', 'Theme.xaml', 'Theme.axaml', 'Palette.cs'];
const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function tokenColours(value, out) {
  const found = out || new Set();
  if (typeof value === 'string') {
    for (const m of value.matchAll(HEX)) found.add(normalise(m[0]));
  } else if (Array.isArray(value)) {
    for (const v of value) tokenColours(v, found);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) tokenColours(v, found);
  }
  return found;
}

function normalise(raw) {
  let h = raw.toLowerCase().slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 8) h = h.slice(2);
  return '#' + h;
}

function rgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function mixOf(target, a, b) {
  const t = rgb(target);
  const x = rgb(a);
  const y = rgb(b);
  let span = 0;
  let axis = 0;
  for (let i = 0; i < 3; i++) {
    const d = Math.abs(y[i] - x[i]);
    if (d > span) {
      span = d;
      axis = i;
    }
  }
  if (span === 0) return false;
  const ratio = (t[axis] - x[axis]) / (y[axis] - x[axis]);
  if (ratio < -0.01 || ratio > 1.01) return false;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(x[i] + (y[i] - x[i]) * ratio - t[i]) > 1) return false;
  }
  return true;
}

function derivable(hex, palette) {
  if (palette.has(hex)) return true;
  const list = [...palette];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) if (mixOf(hex, list[i], list[j])) return true;
  return false;
}

module.exports = function generate() {
  const out = L.tmp('tkui-gen-');
  const tokensFile = path.join(L.ASSETS, 'theme.tokens.json');
  const r = L.node(L.GENERATE, [tokensFile, out], { env: L.cleanEnv() });
  L.ok('generate.js exits 0', r.status === 0, r.stderr || r.stdout);

  const written = fs.readdirSync(out).sort();
  L.ok('generate.js writes four files', written.length === 4, written.join(' '));
  L.ok('generate.js writes the expected four names', OUTPUTS.every((n) => written.includes(n)), written.join(' '));

  const palette = tokenColours(L.readJson(tokensFile));
  L.ok('the token file carries a palette', palette.size > 0, palette.size + ' colours');

  for (const name of OUTPUTS) {
    const file = path.join(out, name);
    if (!fs.existsSync(file)) {
      L.ok(name + ' has no colour outside the token file', false, 'not generated');
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    const stray = new Set();
    for (const m of text.matchAll(HEX)) {
      const hex = normalise(m[0]);
      if (!derivable(hex, palette)) stray.add(m[0]);
    }
    L.ok(name + ' has no colour outside the token file', stray.size === 0, [...stray].slice(0, 5).join(' '));
  }
};
