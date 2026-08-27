'use strict';

const path = require('path');

const MOTION_PACKAGE = ['motion', 'framer-motion', 'gsap', 'animejs', '@formkit/auto-animate'];
const LAYOUT_PROPERTY = /transition[^;]*\b(width|height|top|left|margin|box-shadow|filter)\b/i;
const COMPONENT_NAME = /(panel|dialog|modal|drawer|sheet|popover|tooltip|toast|menu|accordion)/i;
const MOTION_TRACE =
  /transition|animate|animation|motion\.|AnimatePresence|@keyframes|Storyboard|useSpring/i;
const LIST_MOTION = /AnimatePresence|autoAnimate|auto-animate|@keyframes|transition|layout[ =}]/i;
const STYLE_NAME = /^(theme|global|globals|index|app|main|style|styles)\.css$/i;
const REDUCED_MOTION_BLOCK = [
  '@media (prefers-reduced-motion: reduce) {',
  '  *, *::before, *::after {',
  '    animation-duration: 0.01ms !important;',
  '    animation-iteration-count: 1 !important;',
  '    transition-duration: var(--tk-t-instant) !important;',
  '  }',
  '}',
].join('\n');

const WEB_UI = new Set(['.css', '.tsx', '.jsx', '.vue', '.svelte']);
const UI = ['.css', '.tsx', '.jsx', '.vue', '.svelte', '.xaml', '.axaml'];
const STORYBOARD = ['.xaml', '.axaml', '.cs'];
const MANIFEST_NAME = /^package(?:-lock)?\.json$/i;
const cache = new WeakMap();

function normHex(value, argb) {
  const v = String(value).toLowerCase();
  if (v.length === 4) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  if (v.length === 9) return argb ? '#' + v.slice(3) : v.endsWith('ff') ? v.slice(0, 7) : v;
  return v;
}

function oneLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function luminance(hex) {
  const k = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}

function contrastOnBlack(hex) {
  return (luminance(hex) + 0.05) / 0.05;
}

function isWeb(ext) {
  return ext !== '.xaml' && ext !== '.axaml';
}

function paletteFromTokens(json) {
  const out = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const v of Object.values(node)) {
      if (typeof v === 'string') {
        if (/^#[0-9a-fA-F]{3,8}$/.test(v)) out.add(normHex(v));
      } else walk(v);
    }
  };
  walk(json);
  return out;
}

function motion(ctx) {
  if (cache.has(ctx)) return cache.get(ctx);
  const palette = new Set();
  const durations = [];
  for (const [name, value] of Object.entries(ctx.theme || {})) {
    for (const c of String(value).match(/#[0-9a-fA-F]{3,8}\b/g) || []) palette.add(normHex(c));
    const d = /^--tk-t-[a-z]+$/.test(name) && /^(\d+(?:\.\d+)?)(ms|s)\b/.exec(String(value));
    if (d) durations.push({ name, ms: d[2] === 's' ? Number(d[1]) * 1000 : Number(d[1]) });
  }
  for (const c of paletteFromTokens(ctx.tokens)) palette.add(c);
  if (!durations.length) {
    const table = (ctx.tokens && (ctx.tokens.sure || ctx.tokens.duration)) || {};
    for (const [key, val] of Object.entries(table)) {
      const ms = Number(val && val.ms);
      if (Number.isFinite(ms)) durations.push({ name: '--tk-t-' + key, ms });
    }
  }
  let state = null;
  if (palette.size && durations.length) {
    durations.sort((a, b) => a.ms - b.ms);
    state = { palette, durations, ceiling: durations[durations.length - 1].ms };
  }
  cache.set(ctx, state);
  return state;
}

function splitTopLevel(value) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && !depth) {
      out.push(value.slice(start, i));
      start = i + 1;
    }
  }
  out.push(value.slice(start));
  return out;
}

function openTransition(line) {
  let y = line.replace(/\btransition-all\b/g, 'transition-[opacity,transform]');
  y = y.replace(
    /(transition-property\s*:\s*)([^;{}]*)/gi,
    (_, head, value) =>
      head +
      splitTopLevel(value)
        .map((p) => (p.trim().toLowerCase() === 'all' ? 'opacity, transform' : p.trim()))
        .join(', ')
  );
  return y.replace(
    /(\btransition\s*:\s*)([^;{}]*)/gi,
    (_, head, value) =>
      head +
      splitTopLevel(value)
        .map((p) => {
          const s = p.trim();
          if (!/^all\b/i.test(s)) return s;
          const tail = s.slice(3).trim();
          return ['opacity', 'transform'].map((a) => (tail ? a + ' ' + tail : a)).join(', ');
        })
        .join(', ')
  );
}

function nearestToken(ms, state) {
  let best = state.durations[0];
  for (const t of state.durations) if (Math.abs(t.ms - ms) < Math.abs(best.ms - ms)) best = t;
  return best.name;
}

function tokenizeDuration(line, state) {
  const y = line.replace(
    /\bduration-(\d+(?:\.\d+)?)\b/g,
    (_, n) => 'duration-[var(' + nearestToken(Number(n), state) + ')]'
  );
  return y.replace(/\b(?:transition|animation)(?:-duration)?\s*:\s*([^;{}]*)/gi, (whole, value) => {
    const next = value.replace(
      /(\d+(?:\.\d+)?)(ms|s)\b/g,
      (_, n, unit) => 'var(' + nearestToken(unit === 's' ? Number(n) * 1000 : Number(n), state) + ')'
    );
    return whole.slice(0, whole.length - value.length) + next;
  });
}

function durationsIn(line) {
  const out = [];
  for (const m of line.matchAll(/\bduration-(\d+(?:\.\d+)?)\b/g))
    out.push({ text: m[0], ms: Number(m[1]) });
  for (const m of line.matchAll(/\b(?:transition|animation)(?:-duration)?\s*:\s*([^;{}]*)/gi))
    for (const d of m[1].matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)) {
      const ms = d[2] === 's' ? Number(d[1]) * 1000 : Number(d[1]);
      if (ms < 1) continue;
      out.push({ text: d[0], ms });
    }
  return out;
}

function styleSections(file, text) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.css') return [{ text, offset: 0 }];
  if (ext !== '.vue' && ext !== '.svelte') return [];
  const out = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[0].indexOf(m[1]);
    out.push({ text: m[1], offset: (text.slice(0, start).match(/\n/g) || []).length });
  }
  return out;
}

function cssRules(text, offset) {
  const out = [];
  const stack = [];
  let line = 1;
  let start = 0;
  let startLine = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      const raw = text.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
      const blank = (/^\s*/.exec(raw)[0].match(/\n/g) || []).length;
      stack.push({ selector: raw.trim(), line: offset + startLine + blank, bodyStart: i + 1 });
      start = i + 1;
      startLine = line;
    } else if (c === '}') {
      const rule = stack.pop();
      if (rule) {
        rule.body = text.slice(rule.bodyStart, i);
        out.push(rule);
      }
      start = i + 1;
      startLine = line;
    } else if (c === '\n') {
      line++;
    }
  }
  return out;
}

function flatRules(file, text) {
  const out = [];
  for (const section of styleSections(file, text))
    for (const r of cssRules(section.text, section.offset)) if (!r.body.includes('{')) out.push(r);
  return out;
}

const DISABLED_SELECTOR = /:disabled\b|\[disabled\b|\[aria-disabled\s*=\s*['"]true['"]\]/i;
const HERO_GLOW = /drop-shadow\(\s*var\(\s*--[\w-]*glow-hero\s*\)\s*\)/i;

function subjectOf(selector) {
  const last = String(selector)
    .trim()
    .split(/\s*[>+~]\s*|\s+/)
    .filter(Boolean)
    .pop();
  if (!last) return '';
  let out = '';
  let depth = 0;
  for (let i = 0; i < last.length; i++) {
    const c = last[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ':' && depth === 0) {
      const rest = last.slice(i);
      if (rest.startsWith('::')) {
        const pe = /^::[\w-]+/.exec(rest);
        if (pe) {
          out += pe[0];
          i += pe[0].length - 1;
          continue;
        }
      }
      const m = /^:[\w-]+/.exec(rest);
      if (m) {
        i += m[0].length - 1;
        if (last[i + 1] === '(') {
          let d = 0;
          let j = i + 1;
          for (; j < last.length; j++) {
            if (last[j] === '(') d++;
            else if (last[j] === ')' && --d === 0) break;
          }
          i = j;
        }
        continue;
      }
    }
    if (depth === 0) out += c;
  }
  return out.trim();
}

function subjectKeys(selector) {
  const s = subjectOf(selector);
  if (!s) return [];
  const keys = [s];
  const m = /(\.[\w-]+)$/.exec(s);
  if (m) {
    const head = s.slice(0, s.length - m[1].length);
    const parts = m[1].split('-');
    for (let n = parts.length - 1; n >= 2; n--) keys.push(head + parts.slice(0, n).join('-'));
  }
  return keys;
}

function motionPackages(ctx) {
  let p;
  try {
    p = JSON.parse(String(ctx.read('package.json')).replace(/^﻿/, ''));
  } catch {
    return [];
  }
  if (!p) return [];
  const all = Object.assign({}, p.dependencies || {}, p.devDependencies || {});
  return MOTION_PACKAGE.filter((n) => all[n]).map((n) => ({ name: n, version: String(all[n]) }));
}

function importPattern(name) {
  return new RegExp('[\'"]' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:/[^\'"]*)?[\'"]');
}

function importedPackages(ctx, packages) {
  const seen = new Set();
  const source = ctx.files.filter((f) => !MANIFEST_NAME.test(path.basename(f.rel || f.path || '')));
  for (const p of packages) {
    const re = importPattern(p.name);
    if (source.some((f) => re.test(f.text))) seen.add(p.name);
  }
  for (const m of ctx.modules || []) {
    if (seen.size === packages.length) break;
    const text = m.text;
    if (text === null || text === undefined) continue;
    for (const p of packages)
      if (!seen.has(p.name) && importPattern(p.name).test(text)) seen.add(p.name);
  }
  return seen;
}

function allText(ctx) {
  return ctx.files.map((f) => f.text).join('\n');
}

function styleTarget(ctx) {
  const css = ctx.files.filter((f) => f.ext === '.css');
  if (!css.length) return null;
  const named = css.filter((f) => STYLE_NAME.test(path.basename(f.rel)));
  const pool = named.length ? named : css;
  return pool
    .slice()
    .sort(
      (a, b) => a.rel.split('/').length - b.rel.split('/').length || a.rel.localeCompare(b.rel)
    )[0].rel;
}

module.exports = {
  id: 'core',

  lineRules: [
    {
      id: 'transition-all',
      severity: 'error',
      exts: UI,
      fix: 'openTransition',
      test(line) {
        if (
          /\btransition-all\b/.test(line) ||
          /transition(?:-property)?\s*:[^;{}]*\ball\b/i.test(line)
        )
          return 'transition-all — animate opacity and transform only';
        return null;
      },
    },
    {
      id: 'layout-animated',
      severity: 'error',
      exts: UI,
      test(line) {
        return LAYOUT_PROPERTY.test(line)
          ? 'layout property animated — resize with transform: scale'
          : null;
      },
    },
    {
      id: 'duration-ceiling',
      severity: 'error',
      exts: UI,
      fix: 'tokenizeDuration',
      test(line, ctx) {
        const state = motion(ctx);
        if (!state) return null;
        const over = durationsIn(line).filter((d) => d.ms > state.ceiling);
        return over.length ? over[0].text + ' — above the ' + state.ceiling + ' ms ceiling' : null;
      },
    },
    {
      id: 'hardcoded-duration',
      severity: 'error',
      exts: UI,
      fix: 'tokenizeDuration',
      test(line, ctx) {
        const state = motion(ctx);
        if (!state) return null;
        const found = durationsIn(line);
        if (found.some((d) => d.ms > state.ceiling)) return null;
        const fixed = found.filter((d) => d.ms <= state.ceiling);
        return fixed.length ? fixed[0].text + ' — literal duration, not a token' : null;
      },
    },
    {
      id: 'off-palette-colour',
      severity: 'error',
      exts: [...WEB_UI],
      test(line, ctx) {
        const state = motion(ctx);
        if (!state) return null;
        for (const m of line.match(/#[0-9a-fA-F]{3,8}\b/g) || []) {
          if (state.palette.has(normHex(m))) continue;
          return m + ' — outside the palette';
        }
        return null;
      },
    },
    {
      id: 'contrast',
      severity: 'error',
      exts: UI,
      test(line, ctx) {
        const fg = line.match(/(?:^|[^-\w])(?:color|Foreground)\s*[:=]\s*"?(#[0-9a-fA-F]{3,8})\b/i);
        if (!fg) return null;
        const state = motion(ctx);
        const h = normHex(fg[1], !isWeb(ctx.ext));
        if (h.length !== 7 || (state && state.palette.has(h))) return null;
        const ratio = contrastOnBlack(h);
        return ratio < 7 ? fg[1] + ' — ' + ratio.toFixed(1) + ':1 on black, below 7:1' : null;
      },
    },
    {
      id: 'wpf-layout-target',
      severity: 'error',
      exts: STORYBOARD,
      test(line) {
        return /Storyboard\.TargetProperty\s*=\s*"[^"]*\bLayoutTransform/.test(line)
          ? 'LayoutTransform animation target — Storyboard drives RenderTransform and Opacity only'
          : null;
      },
    },
    {
      id: 'wpf-effect-target',
      severity: 'error',
      exts: STORYBOARD,
      test(line) {
        const m = line.match(/Storyboard\.TargetProperty\s*=\s*"[^"]*\b(LayoutTransform|Effect)/);
        return m && m[1] === 'Effect'
          ? 'Effect animation target — Storyboard drives RenderTransform and Opacity only'
          : null;
      },
    },
  ],

  fileRules: [
    {
      id: 'text-glow',
      severity: 'error',
      exts: UI,
      check(file, text) {
        const out = [];
        text.split(/\r?\n/).forEach((line, i) => {
          if (/\btext-shadow\s*:/i.test(line) && !/text-shadow\s*:\s*none/i.test(line))
            out.push({ line: i + 1, message: 'text never glows — glow the box' });
        });
        for (const r of flatRules(file, text)) {
          if (
            /drop-shadow\(/i.test(r.body) &&
            !HERO_GLOW.test(r.body) &&
            /(font-size|font-weight|font-family|letter-spacing)/i.test(r.body)
          )
            out.push({ line: r.line, message: 'drop-shadow on a text element' });
        }
        return out;
      },
    },
    {
      id: 'hover-without-transition',
      severity: 'warn',
      exts: UI,
      check(file, text) {
        const ext = path.extname(file).toLowerCase();
        const out = [];
        if (isWeb(ext) && ext !== '.css') {
          text.split(/\r?\n/).forEach((line, i) => {
            if (/\bhover:/.test(line) && !/\btransition\b/.test(line) && !/\bduration-/.test(line))
              out.push({ line: i + 1, message: 'hover, no transition' });
          });
        }
        const rules = flatRules(file, text);
        const transitioned = new Set();
        for (const r of rules) {
          if (!/\btransition\b/i.test(r.body)) continue;
          for (const s of r.selector.split(',')) {
            const t = subjectOf(s);
            if (t) transitioned.add(t);
          }
        }
        for (const r of rules) {
          if (!/:hover\b/.test(r.selector)) continue;
          if (/\btransition\b/i.test(r.body)) continue;
          if (!/\b(color|background|border|opacity|transform|box-shadow|filter|outline)/i.test(r.body))
            continue;
          if (DISABLED_SELECTOR.test(r.selector)) continue;
          const parts = r.selector
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.some((p) => subjectKeys(p).some((k) => transitioned.has(k)))) continue;
          out.push({ line: r.line, message: oneLine(r.selector) + ' — hover, no transition' });
        }
        return out;
      },
    },
    {
      id: 'component-without-motion',
      severity: 'warn',
      exts: UI,
      check(file, text) {
        const name = path.basename(file);
        return COMPONENT_NAME.test(name) && !MOTION_TRACE.test(text)
          ? [{ line: 1, message: 'no enter/exit definition' }]
          : [];
      },
    },
    {
      id: 'list-without-motion',
      severity: 'warn',
      exts: ['.tsx', '.jsx'],
      check(file, text) {
        return /\.map\(/.test(text) && !LIST_MOTION.test(text)
          ? [{ line: 1, message: 'list render, no position animation' }]
          : [];
      },
    },
  ],

  projectRules: [
    {
      id: 'installed-unused',
      severity: 'warn',
      check(ctx) {
        const packages = motionPackages(ctx);
        const seen = importedPackages(ctx, packages);
        return packages
          .filter((p) => !seen.has(p.name))
          .map((p) => ({
            file: '',
            line: 0,
            message: p.name + ' installed (' + p.version + '), never imported',
          }));
      },
    },
    {
      id: 'motion-config-missing',
      severity: 'warn',
      check(ctx) {
        const packages = motionPackages(ctx);
        const seen = importedPackages(ctx, packages);
        const reactive = packages.find(
          (p) => (p.name === 'motion' || p.name === 'framer-motion') && seen.has(p.name)
        );
        if (!reactive || /\bMotionConfig\b/.test(allText(ctx))) return [];
        return [
          {
            file: '',
            line: 0,
            message:
              reactive.name +
              ' imported but no MotionConfig wrapper — reducedMotion never arrives',
          },
        ];
      },
    },
    {
      id: 'reduced-motion-missing',
      severity: 'warn',
      check(ctx) {
        if (!ctx.files.some((f) => WEB_UI.has(f.ext))) return [];
        if (/prefers-reduced-motion/.test(allText(ctx))) return [];
        const target = styleTarget(ctx);
        return [
          {
            file: target || '',
            line: 0,
            message: 'no prefers-reduced-motion block in any file',
            fix: target ? 'addReducedMotion' : null,
          },
        ];
      },
    },
    {
      id: 'focus-ring-missing',
      severity: 'warn',
      check(ctx) {
        const all = allText(ctx);
        const out = [];
        if (ctx.files.some((f) => WEB_UI.has(f.ext)) && !/:focus-visible/.test(all))
          out.push({ file: '', line: 0, message: 'no :focus-visible rule' });
        if (
          ctx.files.some((f) => f.ext === '.xaml' || f.ext === '.axaml') &&
          !/FocusVisualStyle/.test(all)
        )
          out.push({ file: '', line: 0, message: 'no FocusVisualStyle' });
        return out;
      },
    },
  ],

  fixes: {
    openTransition: { line: (text) => openTransition(text) },
    tokenizeDuration: {
      line: (text, ctx) => {
        const state = motion(ctx);
        return state ? tokenizeDuration(text, state) : text;
      },
    },
    addReducedMotion: {
      file: (text) => text.replace(/\s*$/, '') + '\n\n' + REDUCED_MOTION_BLOCK + '\n',
    },
  },
};
