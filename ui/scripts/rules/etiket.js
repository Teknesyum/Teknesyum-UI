'use strict';

const fs = require('fs');
const path = require('path');

const UI = new Set(['.css', '.tsx', '.jsx', '.vue', '.svelte', '.xaml', '.axaml']);
const CODE = new Set(['.cs', '.ts', '.js', '.mjs', '.cjs']);
const LOCALE_DIR = /(^|\/)(locales?|i18n|lang|languages|translations)(\/|$)/i;
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'bin', 'obj', 'coverage', 'target', 'vendor', '.next', '.claude', 'teknesyum-ui', 'trash', 'tmp', 'docs', 'graphify-out', '__fixtures__']);
const LITERAL = /"([^"\r\n]{2,80})"|'([^'\r\n]{2,80})'|>([^<>\r\n]{2,80})</g;
const ASSET_TOKENS = path.resolve(__dirname, '..', '..', 'skills', 'teknesyum-ui', 'assets', 'theme.tokens.json');

function labels(ctx) {
  let group = ctx.tokens && ctx.tokens.label;
  if (!group) {
    try {
      group = JSON.parse(fs.readFileSync(ASSET_TOKENS, 'utf8')).label;
    } catch {
      return null;
    }
  }
  if (!group) return null;
  const every = new Map();
  const loose = new Map();
  for (const [name, key] of [['brand', 'sig.brand'], ['support', 'sig.support'], ['site', 'sig.site']]) {
    const l = group[name];
    if (!l) continue;
    for (const lang of ['tr', 'en']) {
      const text = l[lang];
      if (!text) continue;
      (name === 'brand' ? loose : every).set(text, key);
      if (name === 'brand') every.set('by ' + text, key);
      const hint = l['hint-' + lang];
      if (hint) every.set(hint, key + 'Title');
    }
  }
  return { every, loose };
}

function localeFiles(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name.endsWith('.json') && !/^labels\./.test(e.name) && LOCALE_DIR.test(path.relative(root, full).split(path.sep).join('/'))) out.push(full);
    }
  }
  return out;
}

function hits(text, table, strictBrand) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    LITERAL.lastIndex = 0;
    let m;
    while ((m = LITERAL.exec(lines[i]))) {
      const s = (m[1] || m[2] || m[3] || '').trim();
      const raw = m[1] || m[2] || m[3] || '';
      const key = table.every.get(s) || (strictBrand && table.loose.get(raw));
      if (key) {
        out.push({ line: i + 1, text: s, key });
        break;
      }
    }
  }
  return out;
}

function message(h) {
  return '"' + h.text + '" — signature text written by hand; read ' + h.key + ' from teknesyum-ui/<target>/labels.<lang>.json so every app shows the same text';
}

module.exports = {
  id: 'etiket',

  projectRules: [
    {
      id: 'signature-text',
      severity: 'warn',
      check(ctx) {
        const table = labels(ctx);
        if (!table) return [];
        const out = [];
        for (const f of ctx.picked || ctx.files) {
          if (!UI.has(f.ext) && !CODE.has(f.ext)) continue;
          if (/(^|\/)(teknesyum-ui|docs|tmp|tests?|__tests__)\//.test(f.rel)) continue;
          if (/teknesyum-ui template [\w./-]+/.test(f.text.slice(0, 300))) continue;
          for (const h of hits(f.text, table, UI.has(f.ext))) out.push({ file: f.rel, line: h.line, message: message(h) });
        }
        if (ctx.picked && ctx.picked !== ctx.files) return out;
        for (const full of localeFiles(ctx.root)) {
          let text;
          try {
            text = fs.readFileSync(full, 'utf8');
          } catch {
            continue;
          }
          const rel = path.relative(ctx.root, full).split(path.sep).join('/');
          for (const h of hits(text, table, true)) out.push({ file: rel, line: h.line, message: message(h) });
        }
        return out;
      },
    },
  ],
};
