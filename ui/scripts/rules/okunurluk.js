'use strict';

const fs = require('fs');
const path = require('path');
const K = require('../kontrast');

const MARKUP = ['.tsx', '.jsx', '.vue', '.svelte'];
const STYLE = ['.css', '.vue', '.svelte'];
const XAML = ['.xaml', '.axaml'];
const EXTS = ['.css', '.tsx', '.jsx', '.vue', '.svelte', '.xaml', '.axaml', '.cs'];
const WALK_SKIP = new Set(['node_modules', '.git', 'bin', 'obj', 'dist', 'build', 'out', '__fixtures__', 'coverage', '.vs']);
const TAILWIND_CONFIG = ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs', 'tailwind.config.ts'];
const DISABLED_SELECTOR = /:disabled\b|\[disabled\b|\[aria-disabled\s*=\s*['"]?true['"]?\]|:not\(\s*:enabled\s*\)/i;
const UNKNOWN = 'unknown';
const SCOPED = Symbol('scoped');

const TW_SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const TW_PALETTE = {
  slate: 'f8fafc f1f5f9 e2e8f0 cbd5e1 94a3b8 64748b 475569 334155 1e293b 0f172a 020617',
  gray: 'f9fafb f3f4f6 e5e7eb d1d5db 9ca3af 6b7280 4b5563 374151 1f2937 111827 030712',
  zinc: 'fafafa f4f4f5 e4e4e7 d4d4d8 a1a1aa 71717a 52525b 3f3f46 27272a 18181b 09090b',
  neutral: 'fafafa f5f5f5 e5e5e5 d4d4d4 a3a3a3 737373 525252 404040 262626 171717 0a0a0a',
  stone: 'fafaf9 f5f5f4 e7e5e4 d6d3d1 a8a29e 78716c 57534e 44403c 292524 1c1917 0c0a09',
  red: 'fef2f2 fee2e2 fecaca fca5a5 f87171 ef4444 dc2626 b91c1c 991b1b 7f1d1d 450a0a',
  orange: 'fff7ed ffedd5 fed7aa fdba74 fb923c f97316 ea580c c2410c 9a3412 7c2d12 431407',
  amber: 'fffbeb fef3c7 fde68a fcd34d fbbf24 f59e0b d97706 b45309 92400e 78350f 451a03',
  yellow: 'fefce8 fef9c3 fef08a fde047 facc15 eab308 ca8a04 a16207 854d0e 713f12 422006',
  lime: 'f7fee7 ecfccb d9f99d bef264 a3e635 84cc16 65a30d 4d7c0f 3f6212 365314 1a2e05',
  green: 'f0fdf4 dcfce7 bbf7d0 86efac 4ade80 22c55e 16a34a 15803d 166534 14532d 052e16',
  emerald: 'ecfdf5 d1fae5 a7f3d0 6ee7b7 34d399 10b981 059669 047857 065f46 064e3b 022c22',
  teal: 'f0fdfa ccfbf1 99f6e4 5eead4 2dd4bf 14b8a6 0d9488 0f766e 115e59 134e4a 042f2e',
  cyan: 'ecfeff cffafe a5f3fc 67e8f9 22d3ee 06b6d4 0891b2 0e7490 155e75 164e63 083344',
  sky: 'f0f9ff e0f2fe bae6fd 7dd3fc 38bdf8 0ea5e9 0284c7 0369a1 075985 0c4a6e 082f49',
  blue: 'eff6ff dbeafe bfdbfe 93c5fd 60a5fa 3b82f6 2563eb 1d4ed8 1e40af 1e3a8a 172554',
  indigo: 'eef2ff e0e7ff c7d2fe a5b4fc 818cf8 6366f1 4f46e5 4338ca 3730a3 312e81 1e1b4b',
  violet: 'f5f3ff ede9fe ddd6fe c4b5fd a78bfa 8b5cf6 7c3aed 6d28d9 5b21b6 4c1d95 2e1065',
  purple: 'faf5ff f3e8ff e9d5ff d8b4fe c084fc a855f7 9333ea 7e22ce 6b21a8 581c87 3b0764',
  fuchsia: 'fdf4ff fae8ff f5d0fe f0abfc e879f9 d946ef c026d3 a21caf 86198f 701a75 4a044e',
  pink: 'fdf2f8 fce7f3 fbcfe8 f9a8d4 f472b6 ec4899 db2777 be185d 9d174d 831843 500724',
  rose: 'fff1f2 ffe4e6 fecdd3 fda4af fb7185 f43f5e e11d48 be123c 9f1239 881337 4c0519',
};
const TW_NOT_COLOUR = {
  bg: /^(auto|cover|contain|center|top|bottom|left|right|left-top|left-bottom|right-top|right-bottom|fixed|local|scroll|repeat|no-repeat|repeat-x|repeat-y|repeat-round|repeat-space|none|clip-.*|origin-.*|blend-.*|gradient-.*|linear-.*|radial.*|conic.*|opacity-.*|size-.*|position-.*|\[url.*|\[length.*|\[position.*|\[size.*)$/,
  text: /^(xs|sm|base|lg|xl|[2-9]xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|opacity-.*|\[length.*|\[\d.*(px|rem|em|%|vw|vh|pt)\])$/,
};

const cache = new WeakMap();

function lineAt(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

function tokenHex(tokens, name, depth) {
  if (!tokens || (depth || 0) > 8) return null;
  for (const group of ['brand', 'role', 'derived']) {
    const e = tokens[group] && tokens[group][name];
    if (!e) continue;
    if (typeof e.value === 'string') return e.value;
    if (typeof e.ref === 'string') return tokenHex(tokens, e.ref, (depth || 0) + 1);
  }
  return null;
}

function cssVars(ctx) {
  const out = Object.assign({}, ctx.theme || {});
  const rank = {};
  out[SCOPED] = {};
  for (const f of ctx.files) {
    if (STYLE.indexOf(f.ext) < 0) continue;
    const body = f.text.replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const rule of body.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      const sel = rule[1].replace(/@[^;{}]*;/g, '').trim();
      const r = /light/i.test(sel) ? 3 : /^(?::root|html|body)(?:\s*,\s*(?::root|html|body)[^,]*)*$/i.test(sel) ? 0 : /:root|html|body|\.dark\b|dark/i.test(sel) ? 1 : 2;
      for (const m of rule[2].matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) {
        if (/^--tk-/.test(m[1]) && ctx.theme && m[1] in ctx.theme) continue;
        if (m[1] in rank && rank[m[1]] <= r) continue;
        rank[m[1]] = r;
        if (r === 2) out[SCOPED][m[1]] = m[2].trim();
        else {
          delete out[SCOPED][m[1]];
          out[m[1]] = m[2].trim();
        }
      }
    }
  }
  return out;
}

function substitute(value, vars, depth) {
  let v = String(value);
  for (let round = 0; round < 8 && /var\(/.test(v); round++) {
    const next = v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (all, name, fb) =>
      name in vars ? vars[name] : fb !== undefined ? fb : vars[SCOPED] && name in vars[SCOPED] ? vars[SCOPED][name] : 'unresolved'
    );
    if (next === v) break;
    v = next;
  }
  return depth > 8 ? v : v;
}

function firstColour(value) {
  const v = String(value).replace(/!important/i, '').trim();
  if (!v || /gradient\(|url\(|unresolved/i.test(v)) return null;
  const direct = K.parse(v);
  if (direct) return direct;
  const fn = /(rgba?|hsla?)\([^()]*\)/i.exec(v);
  if (fn) return K.parse(fn[0]);
  const hex = /#[0-9a-fA-F]{3,8}\b/.exec(v);
  if (hex) return K.parse(hex[0]);
  for (const word of v.split(/\s+/)) {
    const c = K.parse(word);
    if (c) return c;
  }
  return null;
}

function resolveCss(value, st) {
  const raw = String(value).trim();
  if (!raw || /^(inherit|initial|unset|revert|currentcolor|none)$/i.test(raw)) return null;
  const c = firstColour(substitute(raw, st.vars, 0));
  if (!c) return UNKNOWN;
  return { c, label: raw };
}

function objectText(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return text.slice(open + 1, i);
  }
  return null;
}

function flattenColours(body, prefix, out) {
  let i = 0;
  const key = /\s*(?:(['"])([^'"]+)\1|([\w$-]+))\s*:\s*/y;
  while (i < body.length) {
    key.lastIndex = i;
    const m = key.exec(body);
    if (!m) {
      const comma = body.indexOf(',', i);
      if (comma < 0) break;
      i = comma + 1;
      continue;
    }
    const name = m[2] || m[3];
    const full = name === 'DEFAULT' ? prefix : prefix ? prefix + '-' + name : name;
    i = key.lastIndex;
    const c = body[i];
    if (c === '{') {
      const inner = objectText(body, i);
      if (inner === null) break;
      flattenColours(inner, full, out);
      i += inner.length + 2;
    } else if (c === '"' || c === "'" || c === '`') {
      const end = body.indexOf(c, i + 1);
      if (end < 0) break;
      if (full) out[full] = body.slice(i + 1, end);
      i = end + 1;
    } else {
      const comma = body.indexOf(',', i);
      if (comma < 0) break;
      i = comma + 1;
      continue;
    }
    const comma = body.indexOf(',', i);
    if (comma < 0) break;
    i = comma + 1;
  }
  return out;
}

function tailwindColours(ctx, vars) {
  const out = { white: '#ffffff', black: '#000000', transparent: 'transparent' };
  for (const [hue, list] of Object.entries(TW_PALETTE))
    list.split(' ').forEach((hex, i) => (out[hue + '-' + TW_SCALE[i]] = '#' + hex));
  for (const [name, value] of Object.entries(vars)) {
    const m = /^--color-([\w-]+)$/.exec(name);
    if (m) out[m[1]] = value;
  }
  for (const file of TAILWIND_CONFIG) {
    const text = ctx.read(file);
    if (!text) continue;
    for (const m of text.matchAll(/\bcolors\s*:\s*\{/g)) {
      const inner = objectText(text, m.index + m[0].length - 1);
      if (inner) flattenColours(inner, '', out);
    }
  }
  return out;
}

function walkXaml(root, exts) {
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
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!WALK_SKIP.has(e.name)) stack.push(full);
      } else if ((exts || XAML).indexOf(path.extname(e.name).toLowerCase()) >= 0) out.push(full);
    }
  }
  return out;
}

function xamlTexts(ctx, exts) {
  const seen = new Set();
  const out = [];
  for (const f of ctx.files)
    if ((exts || XAML).indexOf(f.ext) >= 0) {
      seen.add(path.resolve(f.path));
      out.push({ rel: f.rel, text: f.text });
    }
  if (ctx.root)
    for (const full of walkXaml(ctx.root, exts)) {
      if (seen.has(path.resolve(full))) continue;
      try {
        out.push({ rel: path.relative(ctx.root, full), text: fs.readFileSync(full, 'utf8') });
      } catch {}
    }
  return out;
}

function state(ctx) {
  if (cache.has(ctx)) return cache.get(ctx);
  const vars = cssVars(ctx);
  const surfaceRaw = tokenHex(ctx.tokens, 'surface') || vars['--tk-surface'] || '#101115';
  const surface = K.parse(surfaceRaw) || K.parse('#101115');
  const disabledRaw = tokenHex(ctx.tokens, 'disabled') || vars['--tk-disabled'] || null;
  const st = {
    vars,
    surface: { r: surface.r, g: surface.g, b: surface.b, a: 1 },
    disabled: disabledRaw ? K.hex(K.parse(disabledRaw)) : null,
    tw: null,
    xaml: null,
    trees: new Map(),
  };
  st.tw = tailwindColours(ctx, vars);
  cache.set(ctx, st);
  return st;
}

function describe(v) {
  if (!v || v === UNKNOWN) return '';
  const hex = K.hex(v.c);
  const alpha = v.c.a < 1 ? ' ' + Math.round(v.c.a * 100) + '%' : '';
  const label = String(v.label || '').trim();
  if (/^#[0-9a-f]{3,8}$/i.test(label)) return label + (alpha && label.length > 7 ? '' : alpha);
  return label ? label + ' (' + hex + alpha + ')' : hex + alpha;
}

function measure(bg, fg, ground, st) {
  if (!bg || !fg || bg === UNKNOWN || fg === UNKNOWN) return null;
  if (bg.c.a <= 0) return null;
  if (st.disabled && K.hex(fg.c) === st.disabled) return null;
  const base = over(bg.c, ground || st.surface);
  const text = K.over(fg.c, base);
  const r = K.ratio(text, base);
  if (r >= K.THRESHOLD) return null;
  return 'bg ' + describe(bg) + ' on fg ' + describe(fg) + ' — ' + K.fmt(r) + ':1, below ' + K.THRESHOLD + ':1';
}

function over(top, ground) {
  const c = K.over(top, ground);
  return { r: c.r, g: c.g, b: c.b, a: 1 };
}

function decls(body) {
  const out = [];
  for (const part of body.split(';')) {
    const m = /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(part);
    if (m) out.push({ prop: m[1].toLowerCase(), value: m[2] });
  }
  return out;
}

function styleSections(ext, text) {
  if (ext === '.css') return [{ text, offset: 0 }];
  if (ext !== '.vue' && ext !== '.svelte') return [];
  const out = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[0].indexOf(m[1]);
    out.push({ text: m[1], offset: lineAt(text, start) - 1 });
  }
  return out;
}

function cssRules(text, offset) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const at = lineIndex(clean);
  const out = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '{') {
      const raw = clean.slice(start, i);
      const lead = raw.length - raw.replace(/^\s+/, '').length;
      stack.push({ selector: raw.trim(), line: offset + at(start + lead), bodyStart: i + 1 });
      start = i + 1;
    } else if (c === '}') {
      const rule = stack.pop();
      if (rule) {
        rule.body = clean.slice(rule.bodyStart, i);
        if (!rule.body.includes('{')) out.push(rule);
      }
      start = i + 1;
    } else if (c === ';' && !stack.length) start = i + 1;
  }
  return out;
}

function twClass(cls, prefix, st) {
  let c = cls.replace(/^!/, '');
  if (c.includes(':') && !/^[\w-]+-\[/.test(c)) return undefined;
  if (!c.startsWith(prefix + '-')) return undefined;
  let rest = c.slice(prefix.length + 1);
  if (TW_NOT_COLOUR[prefix].test(rest)) return undefined;
  let alpha = 1;
  const slash = /\/(\d+(?:\.\d+)?|\[[^\]]+\])$/.exec(rest);
  if (slash) {
    const a = slash[1].startsWith('[') ? slash[1].slice(1, -1) : String(Number(slash[1]) / 100);
    alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
    rest = rest.slice(0, slash.index);
  }
  let colour = null;
  if (rest.startsWith('[') && rest.endsWith(']')) {
    const v = rest.slice(1, -1).replace(/_/g, ' ').replace(/^color:/, '');
    if (/^(length|size|position|url):/.test(v) || /^\d/.test(v)) return undefined;
    const r = resolveCss(v, st);
    if (!r) return undefined;
    if (r === UNKNOWN) return UNKNOWN;
    colour = r.c;
  } else if (rest in st.tw) {
    colour = firstColour(substitute(st.tw[rest], st.vars, 0));
    if (!colour) return UNKNOWN;
  } else return UNKNOWN;
  if (!Number.isFinite(alpha)) alpha = 1;
  return { c: K.withAlpha(colour, alpha), label: cls };
}

function classLists(value) {
  const v = value.trim();
  if (v[0] === '"' || v[0] === "'") return [v.slice(1, -1)];
  const out = [];
  for (const m of v.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) out.push(m[2].replace(/\$\{[^}]*\}/g, ' '));
  return out;
}

function fromClasses(list, st) {
  let bg = null;
  let fg = null;
  let bgAlpha = null;
  let fgAlpha = null;
  for (const cls of list.split(/\s+/).filter(Boolean)) {
    const o = /^(bg|text)-opacity-(\d+)$/.exec(cls);
    if (o) {
      if (o[1] === 'bg') bgAlpha = Number(o[2]) / 100;
      else fgAlpha = Number(o[2]) / 100;
      continue;
    }
    const b = twClass(cls, 'bg', st);
    if (b !== undefined) bg = b;
    const t = twClass(cls, 'text', st);
    if (t !== undefined) fg = t;
  }
  if (bg && bg !== UNKNOWN && bgAlpha !== null) bg = { c: K.withAlpha(bg.c, bgAlpha), label: bg.label };
  if (fg && fg !== UNKNOWN && fgAlpha !== null) fg = { c: K.withAlpha(fg.c, fgAlpha), label: fg.label };
  return { bg, fg };
}

function unique(values) {
  const known = values.filter((v) => v && v !== UNKNOWN);
  if (values.some((v) => v === UNKNOWN)) return UNKNOWN;
  if (!known.length) return null;
  const hexes = new Set(known.map((v) => K.hex(v.c) + ':' + v.c.a.toFixed(3)));
  return hexes.size === 1 ? known[0] : UNKNOWN;
}

function attrValue(attrs, names) {
  const re = new RegExp('(?:^|\\s)(' + names + ')\\s*=\\s*', 'g');
  const out = [];
  let m;
  while ((m = re.exec(attrs))) {
    let i = re.lastIndex;
    const c = attrs[i];
    if (c === '"' || c === "'") {
      const end = attrs.indexOf(c, i + 1);
      if (end < 0) break;
      out.push({ name: m[1], value: attrs.slice(i, end + 1) });
      re.lastIndex = end + 1;
    } else if (c === '{') {
      let depth = 0;
      let j = i;
      for (; j < attrs.length; j++) {
        if (attrs[j] === '{') depth++;
        else if (attrs[j] === '}' && --depth === 0) break;
      }
      out.push({ name: m[1], value: attrs.slice(i, j + 1) });
      re.lastIndex = j + 1;
    }
  }
  return out;
}

function inlineStyle(value, st) {
  const out = { bg: null, fg: null };
  const v = value.trim();
  if (v[0] === '"' || v[0] === "'") {
    for (const d of decls(v.slice(1, -1))) {
      if (d.prop === 'background' || d.prop === 'background-color') out.bg = resolveCss(d.value, st);
      if (d.prop === 'color') out.fg = resolveCss(d.value, st);
    }
    return out;
  }
  for (const m of v.matchAll(/\b(backgroundColor|background|color)\s*:\s*(['"`])([^'"`]*)\2/g)) {
    const r = resolveCss(m[3], st);
    if (m[1] === 'color') out.fg = r;
    else out.bg = r;
  }
  if (/\b(backgroundColor|background)\s*:\s*[^'"`\s]/.test(v) && !out.bg) out.bg = UNKNOWN;
  if (/\bcolor\s*:\s*[^'"`\s]/.test(v) && !out.fg) out.fg = UNKNOWN;
  return out;
}

function prevSignificant(text, i) {
  for (let j = i - 1; j >= 0; j--) if (!/\s/.test(text[j])) return text[j];
  return '';
}

function tagEnd(text, i) {
  const stack = [];
  const limit = Math.min(text.length, i + 8000);
  for (; i < limit; i++) {
    const c = text[i];
    const top = stack[stack.length - 1];
    if (top === '"' || top === "'") {
      if (c === '\\' && stack.length > 1) i++;
      else if (c === top) stack.pop();
      continue;
    }
    if (top === '`') {
      if (c === '\\') i++;
      else if (c === '`') stack.pop();
      else if (c === '$' && text[i + 1] === '{') {
        stack.push('{');
        i++;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      stack.push(c);
      continue;
    }
    if (c === '`' && top === '{') {
      stack.push(c);
      continue;
    }
    if (c === '{') {
      stack.push('{');
      continue;
    }
    if (c === '}') {
      if (top === '{') stack.pop();
      continue;
    }
    if (!stack.length && c === '>') return i;
    if (!stack.length && c === '<') return -1;
  }
  return -1;
}

function markupTree(text, ext, st) {
  const at = lineIndex(text);
  const root = { name: '#root', children: [], parent: null, own: { bg: null, fg: null }, line: 0 };
  let cur = root;
  let i = 0;
  const jsx = ext === '.tsx' || ext === '.jsx';
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt < 0) break;
    if (text.startsWith('<!--', lt)) {
      const end = text.indexOf('-->', lt + 4);
      i = end < 0 ? text.length : end + 3;
      continue;
    }
    const close = /^<\/([\w.:-]*)\s*>/.exec(text.slice(lt, lt + 200));
    if (close) {
      const name = close[1];
      let n = cur;
      while (n && n !== root && n.name !== name) n = n.parent;
      if (n && n !== root) cur = n.parent;
      i = lt + close[0].length;
      continue;
    }
    const open = /^<([A-Za-z][\w.:-]*|(?=>))/.exec(text.slice(lt, lt + 200));
    if (!open) {
      i = lt + 1;
      continue;
    }
    if (jsx) {
      const prev = prevSignificant(text, lt);
      if (/[\w$)\].]/.test(prev)) {
        i = lt + 1;
        continue;
      }
    }
    const name = open[1];
    const end = tagEnd(text, lt + 1 + name.length);
    if (end < 0) {
      i = lt + 1;
      continue;
    }
    const attrs = text.slice(lt + 1 + name.length, end);
    const self = text[end - 1] === '/';
    const node = { name, parent: cur, children: [], line: at(lt), own: { bg: null, fg: null }, disabled: false, hasText: false };
    evaluateMarkup(node, attrs, st);
    if (!self) {
      const next = text.indexOf('<', end + 1);
      const between = text.slice(end + 1, next < 0 ? text.length : next).replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
      node.hasText = /\S/.test(between);
    }
    cur.children.push(node);
    i = end + 1;
    if (!self) {
      if (/^(script|style)$/i.test(name)) {
        const stop = text.toLowerCase().indexOf('</' + name.toLowerCase(), end);
        i = stop < 0 ? text.length : stop;
        continue;
      }
      cur = node;
    }
  }
  return root;
}

function evaluateMarkup(node, attrs, st) {
  const lists = [];
  for (const a of attrValue(attrs, '(?::|v-bind:)?(?:className|class)')) lists.push(...classLists(a.value));
  const parsed = lists.map((l) => fromClasses(l, st));
  let bg = unique(parsed.map((p) => p.bg));
  let fg = unique(parsed.map((p) => p.fg));
  node.literalPairs = parsed.filter((p) => p.bg && p.fg && p.bg !== UNKNOWN && p.fg !== UNKNOWN);
  for (const a of attrValue(attrs, '(?::|v-bind:)?style')) {
    const s = inlineStyle(a.value, st);
    if (s.bg) bg = s.bg;
    if (s.fg) fg = s.fg;
  }
  node.own = { bg, fg };
  node.disabled =
    /(?:^|\s)disabled(?![\w-])(?!\s*=\s*\{\s*false\s*\})/.test(attrs) || /aria-disabled\s*=\s*(?:"true"|\{\s*true\s*\})/.test(attrs);
}

function report(root, st, out) {
  const walk = (node, ground, fg, boundary) => {
    for (const child of node.children) {
      if (child.boundary) {
        walk(child, { c: st.surface, src: null }, null, true);
        continue;
      }
      const own = child.own || { bg: null, fg: null };
      let g = ground;
      if (own.bg === UNKNOWN) g = UNKNOWN;
      else if (own.bg && own.bg.c.a > 0) g = ground === UNKNOWN ? (own.bg.c.a >= 1 ? { c: over(own.bg.c, st.surface), src: own.bg } : UNKNOWN) : { c: over(own.bg.c, ground.c), src: own.bg };
      const f = own.fg ? own.fg : fg;
      if (!child.disabled && !child.skip) {
        let message = null;
        const parentGround = ground === UNKNOWN ? null : ground.c;
        if (own.fg && own.fg !== UNKNOWN && own.bg && own.bg !== UNKNOWN) {
          if (!(child.fromStyle && child.fromStyle.bg && child.fromStyle.fg)) message = measure(own.bg, own.fg, parentGround || st.surface, st);
        } else if (own.fg && own.fg !== UNKNOWN && !own.bg && g !== UNKNOWN && g.src) {
          message = measureFlat(g, own.fg, st);
        } else if (own.bg && own.bg !== UNKNOWN && !own.fg && f && f !== UNKNOWN && child.hasText) {
          message = measure(own.bg, f, parentGround || st.surface, st);
        } else if (child.literalPairs && child.literalPairs.length && (own.bg === UNKNOWN || own.fg === UNKNOWN)) {
          for (const p of child.literalPairs) {
            message = measure(p.bg, p.fg, parentGround || st.surface, st);
            if (message) break;
          }
        }
        if (message) out.push({ line: child.line, message });
      }
      walk(child, g, f, boundary);
    }
  };
  walk(root, { c: st.surface, src: null }, null, false);
}

function measureFlat(ground, fg, st) {
  if (st.disabled && K.hex(fg.c) === st.disabled) return null;
  const text = K.over(fg.c, ground.c);
  const r = K.ratio(text, ground.c);
  if (r >= K.THRESHOLD) return null;
  return 'bg ' + describe(ground.src) + ' on fg ' + describe(fg) + ' — ' + K.fmt(r) + ':1, below ' + K.THRESHOLD + ':1';
}

function cssFindings(ext, text, st) {
  const out = [];
  for (const section of styleSections(ext, text))
    for (const rule of cssRules(section.text, section.offset)) {
      if (!rule.selector || rule.selector.startsWith('@') && !/^@media|^@supports|^@layer/.test(rule.selector)) continue;
      if (DISABLED_SELECTOR.test(rule.selector)) continue;
      let bg = null;
      let fg = null;
      for (const d of decls(rule.body)) {
        if (d.prop === 'background' || d.prop === 'background-color') bg = resolveCss(d.value, st);
        else if (d.prop === 'color') fg = resolveCss(d.value, st);
        else if (d.prop.startsWith('@apply')) {
          const p = fromClasses(d.value, st);
          if (p.bg) bg = p.bg;
          if (p.fg) fg = p.fg;
        }
      }
      for (const m of rule.body.matchAll(/@apply\s+([^;]+)/g)) {
        const p = fromClasses(m[1], st);
        if (p.bg) bg = p.bg;
        if (p.fg) fg = p.fg;
      }
      const message = measure(bg, fg, st.surface, st);
      if (message) out.push({ line: rule.line, message });
    }
  return out;
}

function xmlNodes(text) {
  const at = lineIndex(text);
  const root = { name: '#root', attrs: {}, children: [], parent: null, line: 0, text: '' };
  let cur = root;
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt < 0) break;
    if (lt > i && cur !== root) cur.text += text.slice(i, lt);
    if (text.startsWith('<!--', lt)) {
      const end = text.indexOf('-->', lt + 4);
      i = end < 0 ? text.length : end + 3;
      continue;
    }
    if (text.startsWith('<?', lt) || text.startsWith('<!', lt)) {
      const end = text.indexOf('>', lt);
      i = end < 0 ? text.length : end + 1;
      continue;
    }
    if (text[lt + 1] === '/') {
      const end = text.indexOf('>', lt);
      const name = text.slice(lt + 2, end < 0 ? text.length : end).trim();
      let n = cur;
      while (n && n !== root && n.name !== name) n = n.parent;
      if (n && n !== root) cur = n.parent;
      i = end < 0 ? text.length : end + 1;
      continue;
    }
    let j = lt + 1;
    let quote = null;
    for (; j < text.length; j++) {
      const c = text[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
    }
    const inner = text.slice(lt + 1, j);
    const self = inner.endsWith('/');
    const nm = /^([\w.:-]+)/.exec(inner);
    if (!nm) {
      i = j + 1;
      continue;
    }
    const attrs = {};
    const attrLines = {};
    for (const a of inner.slice(nm[1].length).matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      attrs[a[1]] = a[3] !== undefined ? a[3] : a[4];
      attrLines[a[1]] = at(lt + 1 + nm[1].length + a.index);
    }
    const node = { name: nm[1], attrs, attrLines, children: [], parent: cur, line: at(lt), text: '' };
    cur.children.push(node);
    if (!self) cur = node;
    i = j + 1;
  }
  return root;
}

function local(name) {
  const i = name.indexOf(':');
  return i >= 0 ? name.slice(i + 1) : name;
}

function resourceKey(value) {
  const m = /^\{\s*(?:StaticResource|DynamicResource|ThemeResource)\s+(?:ResourceKey\s*=\s*)?([^\s}]+)\s*\}$/.exec(String(value).trim());
  return m ? m[1] : null;
}

function inlineBrush(node) {
  const brush = node.children.find((c) => /SolidColorBrush$/.test(local(c.name)));
  if (!brush) return node.children.some((c) => /Brush$/.test(local(c.name))) ? { raw: null, opacity: 1 } : null;
  const raw = brush.attrs.Color !== undefined ? brush.attrs.Color : brush.text.trim();
  const opacity = brush.attrs.Opacity !== undefined ? parseFloat(brush.attrs.Opacity) : 1;
  return { raw, opacity: Number.isFinite(opacity) ? opacity : 1 };
}

function xamlIndex(ctx) {
  const st = state(ctx);
  if (st.xaml) return st.xaml;
  const colours = new Map();
  const brushes = new Map();
  const styles = new Map();
  const trees = new Map();
  const files = xamlTexts(ctx);
  const included = new Set();
  for (const f of files)
    for (const m of f.text.matchAll(/\bSource\s*=\s*"([^"]+\.a?xaml)"/gi))
      included.add(m[1].replace(/^[a-z]+:\/\/[^/]+\//i, '').replace(/^\/+/, '').replace(/\\/g, '/').toLowerCase());
  const weight = (f) => {
    const rel = f.rel.replace(/\\/g, '/').toLowerCase();
    if ([...included].some((s) => rel.endsWith(s) || rel.endsWith('/' + s.split('/').slice(-3).join('/')))) return 0;
    return /light|latte|dawn/i.test(rel) ? 2 : 1;
  };
  files.sort((a, b) => weight(a) - weight(b));
  for (const f of files) {
    const root = xmlNodes(f.text);
    trees.set(f.rel.replace(/\\/g, '/'), root);
    const visit = (n) => {
      const key = n.attrs && (n.attrs['x:Key'] || n.attrs.Key);
      const nm = local(n.name);
      if (key !== undefined) {
        if (nm === 'Color' && !colours.has(key)) colours.set(key, n.text.trim());
        else if (nm === 'SolidColorBrush' && !brushes.has(key)) {
          const opacity = n.attrs.Opacity !== undefined ? parseFloat(n.attrs.Opacity) : 1;
          brushes.set(key, { raw: n.attrs.Color !== undefined ? n.attrs.Color : n.text.trim(), opacity: Number.isFinite(opacity) ? opacity : 1 });
        } else if (/Brush$/.test(nm) && !brushes.has(key)) brushes.set(key, { raw: null, opacity: 1 });
        else if ((nm === 'Style' || nm === 'ControlTheme') && !styles.has(key)) styles.set(key, n);
      }
      for (const c of n.children) visit(c);
    };
    visit(root);
  }
  st.xaml = { colours, brushes, styles, trees };
  return st.xaml;
}

function xamlColour(raw, idx, depth) {
  if (raw === null || raw === undefined || depth > 8) return UNKNOWN;
  const v = String(raw).trim();
  if (!v) return UNKNOWN;
  const key = resourceKey(v);
  if (key) {
    if (idx.colours.has(key)) return xamlColour(idx.colours.get(key), idx, depth + 1);
    if (idx.brushes.has(key)) {
      const b = idx.brushes.get(key);
      const c = xamlColour(b.raw, idx, depth + 1);
      return c === UNKNOWN ? c : K.withAlpha(c, b.opacity);
    }
    return UNKNOWN;
  }
  if (v.startsWith('{')) return UNKNOWN;
  return K.parse(v, true) || UNKNOWN;
}

function xamlValue(raw, idx) {
  if (raw === null || raw === undefined) return null;
  const v = String(raw).trim();
  if (!v || /^\{x:Null\}$/.test(v)) return null;
  const c = xamlColour(v, idx, 0);
  if (c === UNKNOWN) return UNKNOWN;
  const key = resourceKey(v);
  return { c, label: key || v };
}

function brushValue(brush, idx) {
  if (!brush) return null;
  const c = xamlColour(brush.raw, idx, 0);
  if (c === UNKNOWN) return UNKNOWN;
  return { c: K.withAlpha(c, brush.opacity), label: String(brush.raw) + (brush.opacity < 1 ? ' @' + brush.opacity : '') };
}

const BG_PROPS = new Set(['Background']);
const FG_PROPS = new Set(['Foreground', 'TextElement.Foreground', 'TextBlock.Foreground']);

function propertyOf(node, props, idx) {
  for (const p of props) if (node.attrs[p] !== undefined) return { v: xamlValue(node.attrs[p], idx), line: node.attrLines[p] };
  for (const c of node.children) {
    const nm = local(c.name);
    const dot = nm.indexOf('.');
    if (dot < 0) continue;
    const prop = nm.slice(dot + 1);
    if (props.has(prop) || props.has(nm)) return { v: brushValue(inlineBrush(c), idx), line: c.line };
  }
  return null;
}

function setterRows(node) {
  const out = [];
  for (const c of node.children) {
    const nm = local(c.name);
    if (nm === 'Setter') out.push(c);
    else if (/\.Setters$/.test(nm)) out.push(...c.children.filter((x) => local(x.name) === 'Setter'));
  }
  return out;
}

function setterValue(setter, idx) {
  if (setter.attrs.Value !== undefined) return xamlValue(setter.attrs.Value, idx);
  const holder = setter.children.find((c) => /\.Value$/.test(local(c.name)));
  if (holder) return brushValue(inlineBrush(holder), idx);
  return UNKNOWN;
}

function setterPairs(setters, idx) {
  const out = {};
  for (const s of setters) {
    const prop = s.attrs.Property;
    if (!prop) continue;
    const short = prop.replace(/^.*?\b(TextElement\.Foreground|TextBlock\.Foreground)$/, '$1');
    if (BG_PROPS.has(short) && !s.attrs.TargetName) out.bg = { v: setterValue(s, idx), line: s.line };
    else if (BG_PROPS.has(short)) out.bg = { v: setterValue(s, idx), line: s.line };
    else if (FG_PROPS.has(short)) out.fg = { v: setterValue(s, idx), line: s.line };
  }
  return out;
}

function isStyle(node) {
  const nm = local(node.name);
  return nm === 'Style' || nm === 'ControlTheme';
}

function styleBase(node, idx, seen) {
  const own = setterPairs(setterRows(node), idx);
  let inherited = {};
  const parentStyle = (() => {
    for (let p = node.parent; p; p = p.parent) if (isStyle(p)) return p;
    return null;
  })();
  const basedOn = node.attrs.BasedOn && resourceKey(node.attrs.BasedOn);
  const guard = seen || new Set();
  if (parentStyle && !guard.has(parentStyle)) {
    guard.add(parentStyle);
    inherited = styleBase(parentStyle, idx, guard).merged;
  } else if (basedOn && idx.styles.has(basedOn) && !guard.has(idx.styles.get(basedOn))) {
    guard.add(idx.styles.get(basedOn));
    inherited = styleBase(idx.styles.get(basedOn), idx, guard).merged;
  }
  const state = siblingState(node, idx);
  return { own, state, merged: { bg: own.bg || state.bg || inherited.bg, fg: own.fg || state.fg || inherited.fg } };
}

function siblingState(node, idx) {
  const sel = (node.attrs.Selector || '').trim();
  if (!sel || !node.parent) return {};
  const cut = sel.indexOf('/template/');
  const head = cut >= 0 ? sel.slice(0, cut).trim() : sel;
  const out = {};
  for (const c of node.parent.children) {
    if (c === node || !isStyle(c)) continue;
    const other = (c.attrs.Selector || '').trim();
    const same = cut >= 0 ? other === head : other.startsWith(head + ' /template/');
    if (!same) continue;
    const pair = setterPairs(setterRows(c), idx);
    if (cut >= 0 && pair.fg) out.fg = pair.fg;
    if (cut < 0 && pair.bg) out.bg = pair.bg;
  }
  return out;
}

function disabledCondition(node) {
  const prop = node.attrs.Property || node.attrs.Binding || '';
  if (/IsEnabled/.test(prop) && /^false$/i.test(node.attrs.Value || '')) return true;
  if (/:disabled\b/.test(node.attrs.Selector || '')) return true;
  const conditions = node.children.find((c) => /\.Conditions$/.test(local(c.name)));
  if (conditions)
    return conditions.children.some(
      (c) => /IsEnabled/.test(c.attrs.Property || c.attrs.Binding || '') && /^false$/i.test(c.attrs.Value || '')
    );
  return false;
}

function triggersOf(style) {
  const out = [];
  const visit = (n) => {
    for (const c of n.children) {
      if (isStyle(c)) continue;
      const nm = local(c.name);
      if (/^(Trigger|MultiTrigger|DataTrigger|MultiDataTrigger)$/.test(nm)) out.push(c);
      else visit(c);
    }
  };
  visit(style);
  return out;
}

function styleFindings(root, idx, st) {
  const out = [];
  const visit = (n) => {
    for (const c of n.children) {
      if (isStyle(c)) checkStyle(c);
      visit(c);
    }
  };
  const checkStyle = (s) => {
    if (disabledCondition(s)) return;
    for (let p = s.parent; p; p = p.parent) if (isStyle(p) && disabledCondition(p)) return;
    const base = styleBase(s, idx);
    const pick = (pair) => (pair && pair.v !== undefined ? pair.v : null);
    if ((base.own.bg || base.own.fg) && !(!base.own.bg && base.state.bg) && base.merged.bg && base.merged.fg) {
      const message = measure(pick(base.merged.bg), pick(base.merged.fg), st.surface, st);
      if (message) out.push({ line: (base.own.bg || base.own.fg).line || s.line, message });
    }
    for (const t of triggersOf(s)) {
      if (disabledCondition(t)) continue;
      const over = setterPairs(setterRows(t), idx);
      if (!over.bg && !over.fg) continue;
      const bg = over.bg || base.merged.bg;
      const fg = over.fg || base.merged.fg;
      if (!bg || !fg) continue;
      const message = measure(pick(bg), pick(fg), st.surface, st);
      if (message) out.push({ line: (over.bg || over.fg).line || t.line, message: message + ' (trigger)' });
    }
  };
  visit(root);
  return out;
}

const BOUNDARY = /^(ControlTemplate|DataTemplate|ItemsPanelTemplate|HierarchicalDataTemplate|Style|ControlTheme|ResourceDictionary|Setter)$/;

function xamlTree(root, idx) {
  const convert = (n, parent) => {
    const nm = local(n.name);
    const node = { name: n.name, line: n.line, parent, children: [], own: { bg: null, fg: null }, disabled: false, hasText: false };
    if (BOUNDARY.test(nm) || /\.(Resources|Styles|Triggers)$/.test(nm)) node.boundary = true;
    if (nm.includes('.') || BOUNDARY.test(nm) || /Brush$|^Color$|^GradientStop$/.test(nm)) node.skip = true;
    if (!node.skip) {
      const bg = propertyOf(n, BG_PROPS, idx);
      const fg = propertyOf(n, FG_PROPS, idx);
      node.own = { bg: bg ? bg.v : null, fg: fg ? fg.v : null };
      node.fromStyle = { bg: false, fg: false };
      const styleKey = n.attrs.Style && resourceKey(n.attrs.Style);
      if (styleKey && idx.styles.has(styleKey)) {
        const base = styleBase(idx.styles.get(styleKey), idx).merged;
        if (!bg && base.bg) {
          node.own.bg = base.bg.v;
          node.fromStyle.bg = true;
        }
        if (!fg && base.fg) {
          node.own.fg = base.fg.v;
          node.fromStyle.fg = true;
        }
      }
      if (bg && bg.line) node.line = bg.line;
      else if (fg && fg.line) node.line = fg.line;
      node.disabled = /^false$/i.test(n.attrs.IsEnabled || '');
      const content = n.attrs.Text !== undefined || n.attrs.Content !== undefined || n.attrs.Header !== undefined;
      node.hasText = content || /\S/.test(n.text || '');
    }
    for (const c of n.children) node.children.push(convert(c, node));
    return node;
  };
  const top = { name: '#root', children: [], parent: null, own: { bg: null, fg: null }, line: 0 };
  for (const c of root.children) top.children.push(convert(c, top));
  return top;
}

const CS_TYPES = '(?:var|Color|int|byte|float|double|Brush|SolidBrush|IBrush)';

function csMask(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '/' && n === '/') {
      const end = text.indexOf('\n', i);
      const stop = end < 0 ? text.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
    } else if (c === '/' && n === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (c === '"' || (c === '@' && n === '"') || (c === '$' && n === '"')) {
      const verbatim = c === '@';
      let j = c === '"' ? i + 1 : i + 2;
      for (; j < text.length; j++) {
        if (!verbatim && text[j] === '\\') j++;
        else if (text[j] === '"') {
          if (verbatim && text[j + 1] === '"') j++;
          else break;
        }
      }
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (c === "'" && (text[i + 2] === "'" || (n === '\\' && text[i + 3] === "'"))) {
      const stop = n === '\\' ? i + 4 : i + 3;
      out += ' '.repeat(stop - i);
      i = stop;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function csClose(text, open) {
  const pair = { '(': ')', '{': '}', '[': ']' };
  const want = pair[text[open]];
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (c === text[open]) depth++;
    else if (c === want && --depth === 0) return i;
  }
  return -1;
}

function csSplit(body) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"') {
      i++;
      while (i < body.length && body[i] !== '"') {
        if (body[i] === '\\') i++;
        i++;
      }
    } else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) {
      out.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = body.slice(start).trim();
  if (last || out.length) out.push(last);
  return out;
}

function csTernary(expr) {
  let depth = 0;
  let q = -1;
  let nested = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"') {
      i++;
      while (i < expr.length && expr[i] !== '"') {
        if (expr[i] === '\\') i++;
        i++;
      }
    } else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth === 0 && c === '?') {
      if (expr[i + 1] === '?' || expr[i + 1] === '.' || expr[i - 1] === '?') {
        if (expr[i + 1] === '?') i++;
        continue;
      }
      if (q < 0) q = i;
      else nested++;
    } else if (depth === 0 && c === ':' && q >= 0) {
      if (nested) nested--;
      else return { cond: expr.slice(0, q).trim(), a: expr.slice(q + 1, i).trim(), b: expr.slice(i + 1).trim() };
    }
  }
  return null;
}

function condTags(cond, truth) {
  let c = cond.replace(/\s+/g, '');
  while (/^\(.*\)$/.test(c) && csClose(c, 0) === c.length - 1) c = c.slice(1, -1);
  if (truth) {
    const parts = c.split('&&');
    if (parts.length > 1) return parts.reduce((m, p) => Object.assign(m, condTags(p, true)), {});
  } else if (c.includes('||')) {
    return c.split('||').reduce((m, p) => Object.assign(m, condTags(p, false)), {});
  } else if (c.includes('&&')) return {};
  if (/^!\w[\w.]*$/.test(c)) return { [c.slice(1)]: !truth };
  const eq = /^([\w.]+)(==|!=)(true|false)$/.exec(c);
  if (eq) return { [eq[1]]: (eq[2] === '==') === (eq[3] === 'true') ? truth : !truth };
  return { [c]: truth };
}

function mergeTags(a, b) {
  const out = Object.assign({}, a);
  for (const [k, v] of Object.entries(b)) {
    if (k in out && out[k] !== v) return null;
    out[k] = v;
  }
  return out;
}

function csIndex(ctx) {
  const st = state(ctx);
  if (st.cs) return st.cs;
  const symbols = new Map();
  const bare = new Map();
  for (const f of xamlTexts(ctx, ['.cs'])) {
    const text = csMask(f.text);
    const classes = [];
    for (const m of text.matchAll(/\b(?:class|struct|record)\s+(\w+)/g)) classes.push({ at: m.index, name: m[1] });
    const re = new RegExp('\\b(?:const|static\\s+readonly|readonly\\s+static)\\s+[\\w<>?.]+\\s+(\\w+)\\s*=\\s*([^;]+);', 'g');
    for (const m of text.matchAll(re)) {
      let owner = null;
      for (const c of classes) if (c.at < m.index) owner = c.name;
      const entry = { expr: m[2].trim(), owner };
      if (owner && !symbols.has(owner + '.' + m[1])) symbols.set(owner + '.' + m[1], entry);
      if (!bare.has(m[1])) bare.set(m[1], []);
      bare.get(m[1]).push(entry);
    }
  }
  st.cs = { symbols, bare };
  return st.cs;
}

function csLookup(name, scope, idx) {
  if (scope.locals && scope.locals.has(name)) {
    const before = scope.locals.get(name).filter((e) => scope.pos === undefined || e.pos < scope.pos);
    if (before.length) return { entry: before[before.length - 1], local: true };
  }
  if (idx.symbols.has(name)) return { entry: idx.symbols.get(name) };
  if (scope.owner && idx.symbols.has(scope.owner + '.' + name)) return { entry: idx.symbols.get(scope.owner + '.' + name) };
  const last = name.split('.').pop();
  const list = idx.bare.get(last);
  if (list && list.length === 1 && name.split('.').length <= 2) return { entry: list[0] };
  return null;
}

function csEval(expr, scope, idx, depth) {
  const unknown = [{ v: UNKNOWN, tags: {} }];
  if (depth > 12) return unknown;
  let e = String(expr).trim();
  while (e.startsWith('(') && csClose(e, 0) === e.length - 1) e = e.slice(1, -1).trim();
  if (!e) return unknown;
  const t = csTernary(e);
  if (t) {
    const out = [];
    for (const [branch, truth] of [
      [t.a, true],
      [t.b, false],
    ]) {
      const tags = condTags(t.cond, truth);
      for (const alt of csEval(branch, scope, idx, depth + 1)) {
        const merged = mergeTags(alt.tags, tags);
        if (merged) out.push({ v: alt.v, tags: merged });
      }
    }
    return out;
  }
  const cast = /^\((?:int|byte|float|double)\)\s*(.+)$/.exec(e);
  if (cast) return csEval(cast[1], scope, idx, depth + 1);
  let m = /^"((?:\\.|[^"\\])*)"$/.exec(e);
  if (m) return [{ v: { kind: 'str', s: m[1] }, tags: {} }];
  m = /^0x([0-9a-fA-F]+)[uUlL]*$/.exec(e);
  if (m) return [{ v: { kind: 'num', n: parseInt(m[1], 16) }, tags: {} }];
  m = /^(\d+(?:\.\d+)?)[fFdDmM]?$/.exec(e);
  if (m) return [{ v: { kind: 'num', n: Number(m[1]) }, tags: {} }];
  m = /^(?:System\.Drawing\.)?(?:Color|Colors|Brushes)\.(\w+)$/.exec(e);
  if (m) {
    const c = K.parse(m[1].toLowerCase());
    return c ? [{ v: { kind: 'colour', c, label: e }, tags: {} }] : unknown;
  }
  m = /^(?:new\s+(?:SolidBrush|SolidColorBrush|Pen)|ColorTranslator\.FromHtml|Color\.Parse|Color\.FromArgb|Color\.FromRgb|Color\.FromUInt32)\s*\(([\s\S]*)\)$/.exec(e);
  if (m && csClose(e, e.indexOf('(')) === e.length - 1) {
    const head = e.slice(0, e.indexOf('(')).replace(/\s+/g, ' ');
    const args = csSplit(m[1]).map((a) => csEval(a, scope, idx, depth + 1));
    const out = [];
    const product = (i, acc, tags) => {
      if (out.length > 64) return;
      if (i === args.length) {
        const v = csBuild(head, acc, e);
        if (v) out.push({ v, tags });
        return;
      }
      for (const alt of args[i]) {
        const merged = mergeTags(tags, alt.tags);
        if (merged) product(i + 1, acc.concat(alt.v), merged);
      }
    };
    if (/Pen$/.test(head)) args.splice(1);
    product(0, [], {});
    return out.length ? out : unknown;
  }
  if (/^[A-Za-z_][\w.]*$/.test(e)) {
    const hit = csLookup(e, scope, idx);
    if (!hit) return unknown;
    const inner = hit.local ? Object.assign({}, scope, { pos: hit.entry.pos }) : { owner: hit.entry.owner, locals: null };
    const alts = csEval(hit.entry.expr, inner, idx, depth + 1).map((a) => {
      const tags = mergeTags(a.tags, hit.entry.tags || {});
      return tags ? { v: a.v, tags } : null;
    });
    const label = e.split('.').slice(-2).join('.');
    return alts
      .filter(Boolean)
      .map((a) => (a.v && a.v.kind === 'colour' && !hit.local && !/^Color\./.test(a.v.label) ? { v: Object.assign({}, a.v, { label }), tags: a.tags } : a));
  }
  return unknown;
}

function csBuild(head, args, expr) {
  if (args.some((a) => a === UNKNOWN)) return UNKNOWN;
  const colour = (c) => ({ kind: 'colour', c, label: expr.replace(/\s+/g, ' ') });
  if (/SolidBrush|SolidColorBrush|Pen/.test(head)) return args[0] && args[0].kind === 'colour' ? args[0] : UNKNOWN;
  if (/FromHtml|Color\.Parse/.test(head)) {
    const c = args[0] && args[0].kind === 'str' ? K.parse(args[0].s, true) : null;
    return c ? colour(c) : UNKNOWN;
  }
  const n = args.map((a) => (a.kind === 'num' ? a.n : null));
  if (/FromArgb|FromRgb|FromUInt32/.test(head)) {
    if (args.length === 1 && n[0] !== null) {
      const v = n[0] >>> 0;
      return colour({ r: (v >>> 16) & 255, g: (v >>> 8) & 255, b: v & 255, a: ((v >>> 24) & 255) / 255 });
    }
    if (args.length === 2 && n[0] !== null && args[1].kind === 'colour') return { kind: 'colour', c: K.withAlpha({ r: args[1].c.r, g: args[1].c.g, b: args[1].c.b, a: 1 }, n[0] / 255), label: args[1].label + ' @' + n[0] };
    if (args.length === 3 && n.every((x) => x !== null)) return colour({ r: n[0], g: n[1], b: n[2], a: 1 });
    if (args.length === 4 && n.every((x) => x !== null)) return colour({ r: n[1], g: n[2], b: n[3], a: n[0] / 255 });
  }
  return UNKNOWN;
}

function csTagMap(text, start, end, base) {
  const tags = new Array(end - start).fill(base);
  const assign = (from, to, t) => {
    for (let i = Math.max(from, start); i < Math.min(to, end); i++) tags[i - start] = t;
  };
  const body = (i) => {
    let j = i;
    while (j < end && /\s/.test(text[j])) j++;
    if (text[j] === '{') return [j, csClose(text, j) + 1];
    let depth = 0;
    for (let k = j; k < end; k++) {
      const c = text[k];
      if (c === '(' || c === '{') depth++;
      else if (c === ')' || c === '}') depth--;
      else if (c === ';' && depth <= 0) return [j, k + 1];
    }
    return [j, end];
  };
  const walk = (from, to, current) => {
    const re = /\bif\s*\(/g;
    re.lastIndex = from;
    let m;
    while ((m = re.exec(text)) && m.index < to) {
      if (/\belse\s*$/.test(text.slice(Math.max(from, m.index - 12), m.index))) continue;
      let chain = [];
      let at = m.index;
      let cursor = m.index + m[0].length - 1;
      while (true) {
        const close = csClose(text, cursor);
        if (close < 0 || close > to) return;
        const cond = text.slice(cursor + 1, close);
        let t = current;
        for (const prev of chain) t = t && mergeTags(t, condTags(prev, false));
        t = t && mergeTags(t, condTags(cond, true));
        const [bs, be] = body(close + 1);
        if (t) {
          assign(bs, be, t);
          walk(bs + 1, be, t);
        }
        chain.push(cond);
        const rest = /^\s*else\b\s*/.exec(text.slice(be, be + 40));
        if (!rest) {
          re.lastIndex = be;
          break;
        }
        const after = be + rest[0].length;
        const elif = /^if\s*\(/.exec(text.slice(after, after + 10));
        if (elif) {
          cursor = after + elif[0].length - 1;
          at = after;
          continue;
        }
        let te = current;
        for (const prev of chain) te = te && mergeTags(te, condTags(prev, false));
        const [es, ee] = body(after);
        if (te) {
          assign(es, ee, te);
          walk(es + 1, ee, te);
        }
        re.lastIndex = ee;
        break;
      }
      if (at < 0) break;
    }
  };
  walk(start, end, base);
  return (i) => tags[i - start] || base;
}

function csMethods(text) {
  const out = [];
  const re = /\b(?:override|void|static|private|public|protected|internal|async)\b[^;{}()=]*\(([^()]|\([^()]*\))*\)\s*(?:where[^{]*)?\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = csClose(text, open);
    if (close < 0) continue;
    const head = text.slice(m.index, open);
    const cls = [...text.slice(0, m.index).matchAll(/\b(?:class|struct|record)\s+(\w+)/g)].pop();
    out.push({ start: open + 1, end: close, head, owner: cls ? cls[1] : null });
    re.lastIndex = open + 1;
  }
  return out;
}

function csLocals(text, method, tagAt) {
  const locals = new Map();
  const re = new RegExp('(?:\\busing\\s*\\(?\\s*)?\\b' + CS_TYPES + '\\s+(\\w+)\\s*=\\s*([^;]+?)\\s*(?:;|\\)\\s*\\{|\\)\\s*$)', 'gm');
  const body = text.slice(method.start, method.end);
  for (const m of body.matchAll(re)) {
    if (!locals.has(m[1])) locals.set(m[1], []);
    locals.get(m[1]).push({ expr: m[2], pos: method.start + m.index, tags: tagAt(method.start + m.index), owner: method.owner });
  }
  return locals;
}

function csThin(args) {
  if (args.length !== 5) return false;
  return [args[3], args[4]].some((a) => {
    const m = /^(?:[\w.]*Px\()?\s*(\d+(?:\.\d+)?)[fF]?\s*\)?$/.exec(a || '');
    return m && Number(m[1]) <= 8;
  });
}

function csPaint(text, st, idx) {
  const out = [];
  const at = lineIndex(text);
  for (const method of csMethods(text)) {
    const body = text.slice(method.start, method.end);
    if (!/DrawText|DrawString/.test(body)) continue;
    const tagAt = csTagMap(text, method.start, method.end, {});
    const scope = { owner: method.owner, locals: csLocals(text, method, tagAt) };
    const events = [];
    const call = (re, kind, pick) => {
      for (const m of body.matchAll(re)) {
        const open = method.start + m.index + m[0].length - 1;
        const close = csClose(text, open);
        if (close < 0) continue;
        const args = csSplit(text.slice(open + 1, close));
        for (const [role, arg] of pick(args)) {
          if (!arg) continue;
          const base = tagAt(method.start + m.index);
          const alts = csEval(arg, Object.assign({}, scope, { pos: method.start + m.index }), idx, 0)
            .map((a) => {
              const tags = mergeTags(a.tags, base);
              return tags && a.v !== UNKNOWN && a.v.kind === 'colour' ? { v: a.v, tags } : null;
            })
            .filter(Boolean);
          if (alts.length) events.push({ pos: method.start + m.index, role, alts });
        }
      }
    };
    call(/\.Fill(?:Path|Rectangle|Rectangles|RoundedRectangle|Ellipse|Polygon|Region|Pie)\s*\(/g, 'fill', (a) => (csThin(a) ? [] : [['bg', a[0]]]));
    call(/\.Clear\s*\(/g, 'fill', (a) => (a.length === 1 ? [['bg', a[0]]] : []));
    call(/\bTextRenderer\.DrawText\s*\(/g, 'text', (a) => [['fg', a[4]], ['bg', a.length >= 7 ? a[5] : null]]);
    call(/\.DrawString\s*\(/g, 'text', (a) => [['fg', a[2]]]);
    events.sort((x, y) => x.pos - y.pos);
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.role !== 'fg') continue;
      const own = events.find((x) => x.pos === ev.pos && x.role === 'bg');
      const fills = own ? [own] : events.slice(0, i).filter((x) => x.role === 'bg');
      for (const f of ev.alts) {
        const fill = fills.filter((x) => x.alts.some((b) => mergeTags(b.tags, f.tags))).pop();
        if (!fill) continue;
        for (const b of fill.alts) {
          if (!mergeTags(b.tags, f.tags)) continue;
          const message = measure(b.v, f.v, st.surface, st);
          if (message) out.push({ line: at(ev.pos), message });
        }
      }
    }
  }
  return out;
}

function csInitialisers(text, st, idx) {
  const out = [];
  const at = lineIndex(text);
  const methods = csMethods(text);
  const scopeAt = (pos) => {
    const m = methods.filter((x) => x.start <= pos && pos < x.end).pop();
    if (!m) return { owner: null, locals: null };
    return { owner: m.owner, locals: csLocals(text, m, () => ({})) };
  };
  const pairOf = (bgExpr, fgExpr, pos) => {
    const scope = scopeAt(pos);
    for (const b of csEval(bgExpr, scope, idx, 0))
      for (const f of csEval(fgExpr, scope, idx, 0)) {
        if (b.v === UNKNOWN || f.v === UNKNOWN || b.v.kind !== 'colour' || f.v.kind !== 'colour') continue;
        if (!mergeTags(b.tags, f.tags)) continue;
        const message = measure(b.v, f.v, st.surface, st);
        if (message) out.push({ line: at(pos), message });
      }
  };
  for (const m of text.matchAll(/\bnew\s+[\w.<>]+\s*(?:\([^()]*\))?\s*\{/g)) {
    const open = m.index + m[0].length - 1;
    const close = csClose(text, open);
    if (close < 0) continue;
    const parts = csSplit(text.slice(open + 1, close));
    let bg = null;
    let fg = null;
    for (const p of parts) {
      const a = /^(BackColor|Background)\s*=\s*([\s\S]+)$/.exec(p);
      const b = /^(ForeColor|Foreground)\s*=\s*([\s\S]+)$/.exec(p);
      if (a) bg = a[2];
      if (b) fg = b[2];
    }
    if (bg && fg) pairOf(bg, fg, m.index);
  }
  for (const method of methods) {
    const body = text.slice(method.start, method.end);
    const seen = new Map();
    for (const m of body.matchAll(/(?:^|[;{}]\s*)((?:this\.|[A-Za-z_]\w*\.)?)(BackColor|ForeColor|Background|Foreground)\s*=\s*([^;=][^;]*);/gm)) {
      const who = m[1].replace(/^this\./, '');
      const row = seen.get(who) || {};
      row[/^(BackColor|Background)$/.test(m[2]) ? 'bg' : 'fg'] = { expr: m[3], pos: method.start + m.index + m[0].indexOf(m[2]) };
      seen.set(who, row);
    }
    for (const row of seen.values()) if (row.bg && row.fg) pairOf(row.bg.expr, row.fg.expr, Math.max(row.bg.pos, row.fg.pos));
  }
  return out;
}

function csFindings(text, ctx, st) {
  if (!/\b(BackColor|ForeColor|Background|Foreground|DrawText|DrawString)\b/.test(text)) return [];
  const idx = csIndex(ctx);
  const masked = csMask(text);
  return csPaint(masked, st, idx).concat(csInitialisers(masked, st, idx));
}

function dedupe(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const k = r.line + '|' + r.message;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const pairContrast = {
  id: 'pair-contrast',
  severity: 'error',
  exts: EXTS,
  check(file, text, ctx) {
    const st = state(ctx);
    const ext = path.extname(file).toLowerCase();
    const out = [];
    if (STYLE.indexOf(ext) >= 0) out.push(...cssFindings(ext, text, st));
    if (MARKUP.indexOf(ext) >= 0) {
      const tree = markupTree(text, ext, st);
      report(tree, st, out);
    }
    if (XAML.indexOf(ext) >= 0) {
      const idx = xamlIndex(ctx);
      const root = xmlNodes(text);
      out.push(...styleFindings(root, idx, st));
      report(xamlTree(root, idx), st, out);
    }
    if (ext === '.cs') out.push(...csFindings(text, ctx, st));
    return dedupe(out).sort((a, b) => a.line - b.line);
  },
};

module.exports = {
  id: 'okunurluk',
  lineRules: [],
  fileRules: [pairContrast],
  projectRules: [],
  _internal: { csEval, csIndex, state, markupTree, xmlNodes, twClass, resolveCss },
};
