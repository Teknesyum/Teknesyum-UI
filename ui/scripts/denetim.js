#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const K = require('./kontrast');

const HELP = [
  'Usage: node denetim.js [url] [--snippet <file>] [--esik <ratio>] [--hedef <px>]',
  '',
  '  Prints a standalone script that audits the page it runs in: every visible',
  '  text node against its effective background (transparency composited up the',
  '  parent chain), and every clickable target smaller than the target size.',
  '  Run it in the embedded browser with javascript_tool; it returns JSON.',
  '',
  '  url               the page the audit is meant for; a different page is flagged',
  '  --snippet <file>  write the script to a file instead of stdout',
  '  --esik <ratio>    contrast threshold (default ' + K.THRESHOLD + ')',
  '  --hedef <px>      smallest target side in px (default 24)',
  '',
  'Exit: 0 done · 2 usage error',
].join('\n');

function flag(args, name) {
  const i = args.indexOf('--' + name);
  if (i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith('--')) return args[i + 1];
  const inline = args.find((a) => a.startsWith('--' + name + '='));
  return inline ? inline.slice(name.length + 3) : null;
}

function positional(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      if (!args[i].includes('=') && args[i + 1] !== undefined && !args[i + 1].startsWith('--')) i++;
      continue;
    }
    out.push(args[i]);
  }
  return out;
}

function audit(options) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const paint = canvas.getContext('2d', { willReadFrequently: true });
  const memo = new Map();
  const colour = (value) => {
    if (memo.has(value)) return memo.get(value);
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = '#000';
    paint.fillStyle = value;
    paint.fillRect(0, 0, 1, 1);
    const d = paint.getImageData(0, 0, 1, 1).data;
    const c = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    memo.set(value, c);
    return c;
  };
  const over = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (x, y) => (x * top.a + y * bottom.a * (1 - top.a)) / a;
    return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
  };
  const linear = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
  const ratio = (x, y) => {
    const a = lum(x);
    const b = lum(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  const selector = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) {
        parts.unshift(s + '#' + n.id);
        break;
      }
      const cls = Array.from(n.classList).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const visible = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const disabled = (el) => !!el.closest(':disabled, [aria-disabled="true"], [inert]');
  const ground = (el) => {
    const layers = [];
    let image = false;
    let opaque = false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true;
      const c = colour(cs.backgroundColor);
      const o = parseFloat(cs.opacity);
      const layer = { r: c.r, g: c.g, b: c.b, a: c.a * (Number.isFinite(o) ? o : 1) };
      if (layer.a > 0) layers.push(layer);
      if (layer.a >= 1) {
        opaque = true;
        break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { c: { r: base.r, g: base.g, b: base.b, a: 1 }, image, opaque };
  };

  const pairs = [];
  const seen = new Set();
  let checked = 0;
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const text = t.nodeValue.replace(/\s+/g, ' ').trim();
    const el = t.parentElement;
    if (!text || !el || seen.has(el)) continue;
    if (/^(script|style|noscript|template|title)$/i.test(el.tagName)) continue;
    seen.add(el);
    if (!visible(el) || disabled(el)) continue;
    checked++;
    const cs = getComputedStyle(el);
    const g = ground(el);
    const fgRaw = colour(cs.color);
    const fg = over(fgRaw, g.c);
    const r = ratio(fg, g.c);
    if (r < options.esik)
      pairs.push({
        text: text.slice(0, 60),
        selector: selector(el),
        fg: hex(fgRaw) + (fgRaw.a < 1 ? ' ' + Math.round(fgRaw.a * 100) + '%' : ''),
        bg: hex(g.c),
        ratio: Math.round(r * 100) / 100,
        uncertain: g.image || !g.opaque,
      });
  }

  const targets = [];
  const clickable =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [onclick], [tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(clickable)) {
    if (!visible(el) || disabled(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < options.hedef || r.height < options.hedef)
      targets.push({
        selector: selector(el),
        text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 40),
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      });
  }

  const out = {
    url: location.href,
    esik: options.esik,
    hedef: options.hedef,
    checked,
    pairs: pairs.sort((a, b) => a.ratio - b.ratio),
    targets,
  };
  if (options.url && location.href.replace(/\/$/, '') !== options.url.replace(/\/$/, '')) out.expected = options.url;
  return out;
}

function snippet(options) {
  return '(' + audit.toString() + ')(' + JSON.stringify(options) + ');\n';
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP + '\n');
    return 0;
  }
  const [url] = positional(args);
  const esik = flag(args, 'esik') === null ? K.THRESHOLD : Number(flag(args, 'esik'));
  const hedef = flag(args, 'hedef') === null ? 24 : Number(flag(args, 'hedef'));
  if (!Number.isFinite(esik) || esik < 1 || !Number.isFinite(hedef) || hedef <= 0) {
    process.stderr.write('--esik takes a ratio of 1 or more, --hedef a positive size in px\n');
    return 2;
  }
  if (url && !/^(https?|file):\/\//i.test(url)) {
    process.stderr.write('url must start with http://, https:// or file://: ' + url + '\n');
    return 2;
  }
  const text = snippet({ url: url || null, esik, hedef });
  const file = flag(args, 'snippet');
  if (args.includes('--snippet') && !file) {
    process.stderr.write('--snippet needs a file path\n');
    return 2;
  }
  if (file) {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, text, 'utf8');
    process.stdout.write('wrote  ' + file + '\n');
  } else process.stdout.write(text);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv);

module.exports = { audit, snippet };
