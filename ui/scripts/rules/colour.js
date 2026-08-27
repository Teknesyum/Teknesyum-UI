'use strict';

const TOKEN_FILE = new Set([
  'theme.css',
  'theme.tokens.json',
  'Theme.xaml',
  'Theme.axaml',
  'Palette.cs',
]);

const WEB = ['.css', '.tsx', '.jsx', '.vue', '.svelte'];
const XAML = ['.xaml', '.axaml'];
const ALL = WEB.concat(XAML);
const JSX = ['.tsx', '.jsx'];
const STYLE = ['.css', '.vue', '.svelte'];

const TAILWIND_HUE =
  'slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TAILWIND_PROP =
  'text|bg|border|from|via|to|ring|ring-offset|fill|stroke|shadow|decoration|outline|accent|caret|divide|placeholder';
const TAILWIND_COLOUR = new RegExp(
  '(?:^|[\\s"\'`{])(?:[a-z][a-z0-9-]*:)*(?:' +
    TAILWIND_PROP +
    ')-(?:' +
    TAILWIND_HUE +
    ')-(?:50|\\d{2,3})\\b',
  'g'
);
const TAILWIND_UTILITY = new RegExp(
  '(?:^|[\\s"\'`{])(?:[a-z][a-z0-9-]*:)*(' +
    'rounded(?:-(?:sm|md|lg|xl|2xl|3xl))?|' +
    'tracking-(?:tighter|tight|normal|wide|wider|widest)|' +
    'text-(?:xs|sm|base|lg|xl|[2-9]xl)' +
    ')(?=$|[\\s"\'`}])',
  'g'
);

const SYSTEM_COLOUR =
  /^(?:Canvas|CanvasText|Window|WindowText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|LinkText|VisitedText|ActiveText|GrayText|AccentColor|AccentColorText|transparent|none|inherit|initial|unset|revert|currentColor)$/i;

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /\brgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*([\d.]+%?)\s*)?\)/g;
const COMMENT = /^\s*(?:\/\/|\/\*|\*|<!--|-->)/;
const CUSTOM_PROPERTY = /^\s*--[\w-]+\s*:/;
const TEXT_ROLE =
  /(?:^|[\s,>+~])(?:h[1-6]|p|body|label|dt|dd|li|td|th|caption|legend)(?=$|[\s,.:[])|\.tk-(?:h2|h3|label|mono|hero|hint|prose)\b/i;
const DECORATIVE =
  /divider|separator|rule|decor|ornament|grid-line|gridline|::before|::after|\bhr\b|scrollbar|watermark/i;

const cache = new WeakMap();

function base(file) {
  return String(file).replace(/\\/g, '/').split('/').pop();
}

function isTokenFile(file) {
  return TOKEN_FILE.has(base(file));
}

function extOf(file) {
  const name = base(file);
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot).toLowerCase();
}

function isArgb(file) {
  return XAML.indexOf(extOf(file)) >= 0;
}

function parseHex(raw, argb) {
  const v = String(raw).replace('#', '').toLowerCase();
  if (!/^[0-9a-f]+$/.test(v)) return null;
  if (v.length === 3) return { rgb: '#' + v[0] + v[0] + v[1] + v[1] + v[2] + v[2], alpha: 1 };
  if (v.length === 6) return { rgb: '#' + v, alpha: 1 };
  if (v.length === 8) {
    return argb
      ? { rgb: '#' + v.slice(2), alpha: parseInt(v.slice(0, 2), 16) / 255 }
      : { rgb: '#' + v.slice(0, 6), alpha: parseInt(v.slice(6), 16) / 255 };
  }
  return null;
}

function byte(n) {
  const v = Math.max(0, Math.min(255, Math.round(Number(n))));
  return (v < 16 ? '0' : '') + v.toString(16);
}

function parseRgb(match) {
  const raw = match[4];
  let alpha = 1;
  if (raw !== undefined) {
    alpha = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
    if (!Number.isFinite(alpha)) alpha = 1;
  }
  return { rgb: '#' + byte(match[1]) + byte(match[2]) + byte(match[3]), alpha };
}

function normName(name) {
  return String(name)
    .trim()
    .replace(/^--/, '')
    .replace(/^tk-/, '')
    .toLowerCase();
}

function themeMap(ctx) {
  const out = new Map();
  const theme = ctx && ctx.theme;
  if (!theme) return out;
  const entries = theme instanceof Map ? [...theme.entries()] : Object.entries(theme);
  for (const [k, v] of entries) if (typeof v === 'string') out.set(normName(k), v.trim());
  return out;
}

function resolve(value, map, argb, depth) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (depth > 6) return null;
  const ref = /^var\(\s*(--[\w-]+)/.exec(v);
  if (ref) return resolve(map.get(normName(ref[1])), map, false, depth + 1);
  const res = /^\{\s*(?:StaticResource|DynamicResource)\s+([\w.]+)\s*\}$/.exec(v);
  if (res) {
    const key = res[1].toLowerCase().replace(/^neon/, '').replace(/brush$/, '').replace(/color$/, '');
    for (const [name, val] of map) if (name.replace(/-/g, '') === key) return resolve(val, map, false, depth + 1);
    return null;
  }
  HEX.lastIndex = 0;
  const hex = HEX.exec(v);
  if (hex && v.startsWith('#')) return parseHex(hex[0], argb);
  RGB.lastIndex = 0;
  const rgb = RGB.exec(v);
  if (rgb) return parseRgb(rgb);
  return null;
}

function tokenColours(tokens) {
  const out = new Map();
  if (!tokens || typeof tokens !== 'object') return out;
  const groups = ['marka', 'brand', 'rol', 'role'];
  for (const g of groups) {
    const node = tokens[g];
    if (!node || typeof node !== 'object') continue;
    for (const [name, def] of Object.entries(node)) {
      if (!def || typeof def !== 'object') continue;
      const value = def.deger || def.value;
      if (typeof value === 'string') out.set(normName(name), value);
    }
  }
  for (const g of groups) {
    const node = tokens[g];
    if (!node || typeof node !== 'object') continue;
    for (const [name, def] of Object.entries(node)) {
      if (!def || typeof def !== 'object' || !def.ref) continue;
      const target = out.get(normName(def.ref));
      if (target) out.set(normName(name), target);
    }
  }
  return out;
}

function tokenAlpha(tokens, name) {
  const node = tokens && (tokens.turetilmis || tokens.derived);
  const def = node && node[name];
  const alpha = def && Number(def.alpha);
  return Number.isFinite(alpha) ? alpha : null;
}

function px(value) {
  const m = /^(-?\d+(?:\.\d+)?)(px)?$/.exec(String(value).trim());
  return m ? Number(m[1]) : null;
}

function state(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  if (cache.has(ctx)) return cache.get(ctx);
  const map = themeMap(ctx);
  const fallback = tokenColours(ctx.tokens);
  for (const [k, v] of fallback) if (!map.has(k)) map.set(k, v);

  const named = new Map();
  const palette = new Set();
  for (const [name, value] of map) {
    const c = resolve(value, map, false, 0);
    if (!c) continue;
    named.set(name, c);
    palette.add(c.rgb);
  }

  const scale = [];
  for (const [name, value] of map) {
    if (!/^fs-\d+$/.test(name)) continue;
    const n = px(value);
    if (n !== null) scale.push(n);
  }
  scale.sort((a, b) => a - b);

  const radii = new Set();
  for (const [name, value] of map) {
    if (name !== 'r' && !/^r-/.test(name)) continue;
    const direct = px(value);
    if (direct !== null) {
      radii.add(direct);
      continue;
    }
    const ref = /^var\(\s*(--[\w-]+)/.exec(String(value).trim());
    if (!ref) continue;
    const target = px(map.get(normName(ref[1])));
    if (target !== null) radii.add(target);
  }

  const border = named.get('border');
  const decorative = named.get('border-decorative');
  const alphas = {
    border: tokenAlpha(ctx.tokens, 'border') !== null ? tokenAlpha(ctx.tokens, 'border') : border ? border.alpha : null,
    decorative:
      tokenAlpha(ctx.tokens, 'border-decorative') !== null
        ? tokenAlpha(ctx.tokens, 'border-decorative')
        : decorative
          ? decorative.alpha
          : null,
  };

  let stops = null;
  const grad = ctx.tokens && (ctx.tokens.turetilmis || ctx.tokens.derived);
  const gradDef = grad && (grad['bg-gradient'] || grad.bgGradient);
  if (gradDef && Number.isFinite(Number(gradDef.durak || gradDef.stops))) {
    stops = Number(gradDef.durak || gradDef.stops);
  } else if (map.has('bg')) {
    const count = (String(map.get('bg')).match(/#[0-9a-fA-F]{3,8}|\brgba?\(/g) || []).length;
    if (count > 1) stops = count;
  }

  const built = { map, named, palette, scale, radii, alphas, stops };
  cache.set(ctx, built);
  return built;
}

function lines(text) {
  return String(text).split(/\r?\n/);
}

function blank(match) {
  return match.replace(/[^\n]/g, ' ');
}

function scrub(text) {
  return String(text)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
}

function guard(rule) {
  return Object.assign({}, rule, {
    check(file, text, ctx) {
      try {
        return rule.check(file, scrub(text), ctx) || [];
      } catch {
        return [];
      }
    },
  });
}

function guardProject(rule) {
  return Object.assign({}, rule, {
    check(ctx) {
      try {
        const files = Array.isArray(ctx && ctx.files)
          ? ctx.files.map((f) => Object.assign({}, f, { text: scrub(f.text) }))
          : [];
        return rule.check(Object.assign({}, ctx, { files })) || [];
      } catch {
        return [];
      }
    },
  });
}

function styleSections(file, text) {
  const ext = extOf(file);
  if (ext === '.css') return [{ text: String(text), offset: 0 }];
  if (ext !== '.vue' && ext !== '.svelte') return [];
  const out = [];
  for (const m of String(text).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[0].indexOf(m[1]);
    out.push({ text: m[1], offset: (String(text).slice(0, start).match(/\n/g) || []).length });
  }
  return out;
}

function cssBlocks(file, text) {
  const out = [];
  for (const section of styleSections(file, text)) {
    const body = section.text;
    const stack = [];
    let line = 1;
    let start = 0;
    let startLine = 1;
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c === '{') {
        const raw = body.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
        const blank = (/^\s*/.exec(raw)[0].match(/\n/g) || []).length;
        stack.push({ selector: raw.trim(), line: section.offset + startLine + blank, at: i + 1 });
        start = i + 1;
        startLine = line;
      } else if (c === '}') {
        const rule = stack.pop();
        if (rule) {
          rule.body = body.slice(rule.at, i);
          if (!rule.body.includes('{')) out.push(rule);
        }
        start = i + 1;
        startLine = line;
      } else if (c === '\n') {
        line++;
      }
    }
  }
  return out;
}

function decl(body, prop) {
  const re = new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;}]+)', 'gi');
  let last = null;
  for (const m of String(body).matchAll(re)) last = m[1].trim();
  return last;
}

function lineOf(block, prop) {
  const idx = lines(block.body).findIndex((l) => new RegExp('(?:^|[;{\\s])' + prop + '\\s*:', 'i').test(l));
  return block.line + (idx < 0 ? 0 : idx);
}

function xamlStyles(text) {
  const out = [];
  const src = String(text);
  const re = /<Style\b([^>]*)>([\s\S]*?)<\/Style>/g;
  for (const m of src.matchAll(re)) {
    const key = /x:Key\s*=\s*"([^"]*)"/.exec(m[1]);
    out.push({
      key: key ? key[1] : '',
      head: m[1],
      body: m[2],
      line: (src.slice(0, m.index).match(/\n/g) || []).length + 1,
      bodyLine: (src.slice(0, m.index + m[0].indexOf(m[2])).match(/\n/g) || []).length + 1,
    });
  }
  return out;
}

function setter(styleBody, property) {
  const re = new RegExp('<Setter\\b[^>]*Property\\s*=\\s*"' + property + '"[^>]*Value\\s*=\\s*"([^"]*)"', 'i');
  const m = re.exec(styleBody);
  return m ? m[1] : null;
}

function setterLine(style, property) {
  const idx = lines(style.body).findIndex((l) =>
    new RegExp('<Setter\\b[^>]*Property\\s*=\\s*"' + property + '"', 'i').test(l)
  );
  return style.bodyLine + (idx < 0 ? 0 : idx);
}

function achromatic(rgb) {
  const c = [1, 3, 5].map((i) => parseInt(rgb.slice(i, i + 2), 16));
  return Math.max.apply(null, c) - Math.min.apply(null, c) <= 24;
}

function extreme(rgb) {
  return rgb === '#000000' || rgb === '#ffffff';
}

function coloursIn(line, argb) {
  const out = [];
  HEX.lastIndex = 0;
  for (const m of line.matchAll(HEX)) {
    const c = parseHex(m[0], argb);
    if (c) out.push({ text: m[0], colour: c });
  }
  RGB.lastIndex = 0;
  for (const m of line.matchAll(RGB)) out.push({ text: m[0], colour: parseRgb(m) });
  return out;
}

function skipLine(line) {
  return COMMENT.test(line) || CUSTOM_PROPERTY.test(line);
}

function colourOf(block, prop, s, argb) {
  const raw = decl(block.body, prop);
  return raw === null ? null : resolve(raw, s.map, argb, 0);
}

function selectorFinding(file, text, exts, pick) {
  const out = [];
  if (exts.indexOf(extOf(file)) < 0) return out;
  for (const block of cssBlocks(file, text)) pick(block, out);
  return out;
}

const rawColour = {
  id: 'raw-colour',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s) return [];
    const argb = isArgb(file);
    const out = [];
    lines(text).forEach((line, i) => {
      if (skipLine(line)) return;
      for (const hit of coloursIn(line, argb)) {
        if (extreme(hit.colour.rgb)) continue;
        if (!extreme(hit.colour.rgb) && achromatic(hit.colour.rgb) && !s.palette.has(hit.colour.rgb)) continue;
        out.push({ line: i + 1, message: hit.text + ' — colour literal, bind to a token' });
        return;
      }
    });
    return out;
  },
};

const midGrey = {
  id: 'mid-grey',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s || !s.palette.size) return [];
    const argb = isArgb(file);
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line)) return;
      for (const hit of coloursIn(line, argb)) {
        const rgb = hit.colour.rgb;
        if (extreme(rgb) || !achromatic(rgb) || s.palette.has(rgb)) continue;
        out.push({ line: i + 1, message: hit.text + ' — mid grey; show it white or delete it' });
        return;
      }
    });
    return out;
  },
};

const tailwindPalette = {
  id: 'tailwind-palette',
  severity: 'error',
  exts: WEB,
  check(file, text) {
    if (isTokenFile(file)) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line)) return;
      TAILWIND_COLOUR.lastIndex = 0;
      const m = TAILWIND_COLOUR.exec(line);
      if (m) out.push({ line: i + 1, message: m[0].replace(/^[^a-z]+/i, '') + ' — built-in palette class, use a token' });
    });
    return out;
  },
};

const tailwindUtility = {
  id: 'tailwind-utility',
  severity: 'error',
  exts: WEB,
  check(file, text) {
    if (isTokenFile(file)) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line)) return;
      TAILWIND_UTILITY.lastIndex = 0;
      const m = TAILWIND_UTILITY.exec(line);
      if (m) out.push({ line: i + 1, message: m[1] + ' — default utility, use the token scale' });
    });
    return out;
  },
};

const monoValueColour = {
  id: 'mono-value-colour',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s) return [];
    const fill = s.named.get('pink');
    const cut = s.named.get('pink-text');
    if (!fill || !cut || fill.rgb === cut.rgb) return [];
    const out = [];
    if (STYLE.indexOf(extOf(file)) >= 0) {
      for (const block of cssBlocks(file, text)) {
        if (!/\.tk-mono\b/.test(block.selector)) continue;
        const c = colourOf(block, 'color', s, false);
        if (c && c.rgb === fill.rgb) {
          out.push({ line: lineOf(block, 'color'), message: 'mono value colour is pink-text, not pink' });
        }
      }
    }
    if (XAML.indexOf(extOf(file)) >= 0) {
      for (const style of xamlStyles(text)) {
        if (!/mono/i.test(style.key)) continue;
        const c = resolve(setter(style.body, 'Foreground'), s.map, true, 0);
        if (c && c.rgb === fill.rgb) {
          out.push({ line: setterLine(style, 'Foreground'), message: 'mono value colour is PinkText, not NeonPink' });
        }
      }
    }
    return out;
  },
};

const ghostButtonText = {
  id: 'ghost-button-text',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s) return [];
    const fill = s.named.get('purple');
    const cut = s.named.get('purple-text');
    if (!fill || !cut || fill.rgb === cut.rgb) return [];
    const out = [];
    if (STYLE.indexOf(extOf(file)) >= 0) {
      for (const block of cssBlocks(file, text)) {
        if (!/\.tk-btn-ghost\b/.test(block.selector)) continue;
        const c = colourOf(block, 'color', s, false);
        if (c && c.rgb === fill.rgb) {
          out.push({ line: lineOf(block, 'color'), message: 'ghost button text is purple-text, not purple' });
        }
      }
    }
    if (XAML.indexOf(extOf(file)) >= 0) {
      for (const style of xamlStyles(text)) {
        if (!/ghost/i.test(style.key)) continue;
        const c = resolve(setter(style.body, 'Foreground'), s.map, true, 0);
        if (c && c.rgb === fill.rgb) {
          out.push({ line: setterLine(style, 'Foreground'), message: 'ghost button text is PurpleText, not NeonPurple' });
        }
      }
    }
    return out;
  },
};

const filledButtonText = {
  id: 'filled-button-text',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s) return [];
    const black = s.named.get('black');
    if (!black) return [];
    const out = [];
    if (STYLE.indexOf(extOf(file)) >= 0) {
      for (const block of cssBlocks(file, text)) {
        if (!/\.tk-btn-(?:primary|danger)\b/.test(block.selector)) continue;
        const c = colourOf(block, 'color', s, false);
        if (c && c.rgb !== black.rgb) {
          out.push({ line: lineOf(block, 'color'), message: 'filled button text is black, not ' + c.rgb });
        }
      }
    }
    if (XAML.indexOf(extOf(file)) >= 0) {
      for (const style of xamlStyles(text)) {
        if (!/(primary|danger)button|button(primary|danger)/i.test(style.key.replace(/[^a-z]/gi, ''))) continue;
        const c = resolve(setter(style.body, 'Foreground'), s.map, true, 0);
        if (c && c.rgb !== black.rgb) {
          out.push({ line: setterLine(style, 'Foreground'), message: 'filled button text is black, not ' + c.rgb });
        }
      }
    }
    return out;
  },
};

const borderAlpha = {
  id: 'border-alpha',
  severity: 'warn',
  exts: STYLE,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s || s.alphas.decorative === null || s.alphas.border === null) return [];
    if (s.alphas.decorative === s.alphas.border) return [];
    const step = String(Math.round(s.alphas.decorative * 100));
    return selectorFinding(file, text, STYLE, (block, out) => {
      if (DECORATIVE.test(block.selector)) return;
      for (const prop of ['border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right', 'outline', 'outline-color']) {
        const raw = decl(block.body, prop);
        if (raw === null) continue;
        const viaToken = /var\(\s*--[\w-]*border-decorative/.test(raw);
        const c = resolve(raw.replace(/^[\d.]+px\s+\w+\s+/, ''), s.map, false, 0);
        const viaAlpha = c && c.alpha !== 1 && Math.abs(c.alpha - s.alphas.decorative) < 0.02;
        if (viaToken || viaAlpha) {
          out.push({
            line: lineOf(block, prop),
            message: '/' + step + ' border on a non-decorative selector — default is /' + Math.round(s.alphas.border * 100),
          });
          return;
        }
      }
    });
  },
};

const warningFill = {
  id: 'warning-fill',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s) return [];
    const warning = s.named.get('warning');
    if (!warning) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line) || CUSTOM_PROPERTY.test(line)) return;
      const m = /\b(background|background-color|fill|Background|Fill)\s*[:=]\s*"?([^;"}\n]+)/.exec(line);
      if (!m) return;
      const value = m[2];
      const token = /var\(\s*--[\w-]*warning|\{\s*(?:Static|Dynamic)Resource\s+Warning/i.test(value);
      const c = resolve(value.trim(), s.map, isArgb(file), 0);
      if (token || (c && c.rgb === warning.rgb)) {
        out.push({ line: i + 1, message: 'warning is text, border and icon only — never a fill' });
      }
    });
    return out;
  },
};

const infoToken = {
  id: 'info-token',
  severity: 'error',
  exts: ALL,
  check(file, text) {
    if (isTokenFile(file)) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line)) return;
      const m =
        /--tk-info\b|\btk-info\b|\bInfoBrush\b|\bNeonInfo\b|\b(?:variant|severity|tone|kind)\s*[:=]\s*['"]info['"]/.exec(
          line
        );
      if (m) out.push({ line: i + 1, message: m[0] + ' — there is no info role; use the default border' });
    });
    return out;
  },
};

const whiteBackground = {
  id: 'white-background',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    if (!state(ctx)) return [];
    const argb = isArgb(file);
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line) || CUSTOM_PROPERTY.test(line)) return;
      const m = /\b(background|background-color|Background)\s*[:=]\s*"?([^;"}\n]+)/.exec(line);
      if (!m) return;
      const value = m[2].trim();
      if (/^"?White"?$/i.test(value)) {
        out.push({ line: i + 1, message: 'white background — the surface is dark' });
        return;
      }
      const c = resolve(value, new Map(), argb, 0);
      if (c && c.rgb === '#ffffff' && c.alpha > 0.5) {
        out.push({ line: i + 1, message: 'white background — the surface is dark' });
      }
    });
    return out;
  },
};

const backgroundGradient = {
  id: 'background-gradient',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s || !s.stops) return [];
    const out = [];
    if (STYLE.indexOf(extOf(file)) >= 0) {
      for (const block of cssBlocks(file, text)) {
        if (!/(?:^|[\s,])(?:body|html|:root|\.tk-app|#root|#app)(?=$|[\s,.:[])/i.test(block.selector)) continue;
        const raw = decl(block.body, 'background') || decl(block.body, 'background-color');
        if (raw === null) continue;
        if (/var\(\s*--[\w-]*bg\b/.test(raw)) continue;
        if (SYSTEM_COLOUR.test(raw.trim())) continue;
        const grad = /linear-gradient\(([\s\S]*)\)/.exec(raw);
        if (!grad) {
          out.push({ line: lineOf(block, 'background'), message: 'flat background — the shell takes the ' + s.stops + '-stop gradient' });
          continue;
        }
        const count = (grad[1].match(/#[0-9a-fA-F]{3,8}|\brgba?\(|\bvar\(/g) || []).length;
        if (count < s.stops) {
          out.push({
            line: lineOf(block, 'background'),
            message: count + ' gradient stops — the shell gradient has ' + s.stops,
          });
        }
      }
    }
    if (XAML.indexOf(extOf(file)) >= 0) {
      const src = String(text);
      for (const m of src.matchAll(/<LinearGradientBrush\b[\s\S]*?<\/LinearGradientBrush>/g)) {
        const count = (m[0].match(/<GradientStop\b/g) || []).length;
        if (count > 1 && count < s.stops) {
          out.push({
            line: (src.slice(0, m.index).match(/\n/g) || []).length + 1,
            message: count + ' gradient stops — the shell gradient has ' + s.stops,
          });
        }
      }
    }
    return out;
  },
};

const wpfGradientInterpolation = {
  id: 'wpf-gradient-interpolation',
  severity: 'error',
  exts: ['.xaml'],
  check(file, text) {
    const src = String(text);
    const out = [];
    for (const m of src.matchAll(/<LinearGradientBrush\b([^>]*)>/g)) {
      if (/ColorInterpolationMode\s*=\s*"ScRgbLinearInterpolation"/.test(m[1])) continue;
      out.push({
        line: (src.slice(0, m.index).match(/\n/g) || []).length + 1,
        message: 'LinearGradientBrush without ColorInterpolationMode="ScRgbLinearInterpolation"',
      });
    }
    return out;
  },
};

const unusedToken = {
  id: 'unused-token',
  severity: 'warn',
  check(ctx) {
    if (!ctx || !Array.isArray(ctx.files)) return [];
    const declared = new Map();
    for (const f of ctx.files) {
      if (isTokenFile(f.rel || f.path || '')) continue;
      if (STYLE.indexOf(extOf(f.rel || f.path || '')) < 0) continue;
      lines(f.text).forEach((line, i) => {
        const m = /^\s*(--[\w-]+)\s*:/.exec(line);
        if (m && !declared.has(m[1])) declared.set(m[1], { file: f.rel || f.path, line: i + 1 });
      });
    }
    if (!declared.size) return [];
    const out = [];
    for (const [name, at] of declared) {
      const re = new RegExp('var\\(\\s*' + name.replace(/[-]/g, '\\-') + '\\b');
      const used = ctx.files.some((f) => re.test(f.text));
      if (!used) out.push({ file: at.file, line: at.line, message: name + ' declared but never referenced' });
    }
    return out;
  },
};

function fontSizes(line, ext) {
  const out = [];
  for (const m of line.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)) out.push({ text: m[0], value: Number(m[1]) });
  for (const m of line.matchAll(/\btext-\[(\d+(?:\.\d+)?)px\]/g)) out.push({ text: m[0], value: Number(m[1]) });
  for (const m of line.matchAll(/fontSize\s*:\s*(\d+(?:\.\d+)?)\b/g)) out.push({ text: m[0], value: Number(m[1]) });
  if (XAML.indexOf(ext) >= 0) {
    for (const m of line.matchAll(/FontSize\s*=\s*"(\d+(?:\.\d+)?)"/g)) out.push({ text: m[0], value: Number(m[1]) });
    for (const m of line.matchAll(/Property\s*=\s*"FontSize"\s*Value\s*=\s*"(\d+(?:\.\d+)?)"/g))
      out.push({ text: m[0], value: Number(m[1]) });
  }
  return out;
}

const typeScale = {
  id: 'type-scale',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s || s.scale.length < 2) return [];
    const min = s.scale[0];
    const ext = extOf(file);
    const out = [];
    lines(text).forEach((line, i) => {
      if (skipLine(line)) return;
      for (const hit of fontSizes(line, ext)) {
        if (hit.value < min) continue;
        if (s.scale.indexOf(hit.value) >= 0) continue;
        out.push({ line: i + 1, message: hit.text + ' — off the ' + s.scale.join('/') + ' scale' });
        return;
      }
    });
    return out;
  },
};

const minFontSize = {
  id: 'min-font-size',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s || !s.scale.length) return [];
    const min = s.scale[0];
    const ext = extOf(file);
    const out = [];
    lines(text).forEach((line, i) => {
      if (skipLine(line)) return;
      for (const hit of fontSizes(line, ext)) {
        if (hit.value >= min) continue;
        out.push({ line: i + 1, message: hit.text + ' — below the ' + min + 'px floor' });
        return;
      }
    });
    return out;
  },
};

function heavy(value) {
  const v = String(value).trim().toLowerCase();
  if (/^\d+$/.test(v)) return Number(v) >= 700;
  return /^(bold|bolder|extrabold|black|heavy)$/.test(v);
}

const heroWeight = {
  id: 'hero-weight',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    if (!state(ctx)) return [];
    const ext = extOf(file);
    const out = [];
    if (STYLE.indexOf(ext) >= 0) {
      for (const block of cssBlocks(file, text)) {
        if (/hero/i.test(block.selector)) continue;
        const raw = decl(block.body, 'font-weight');
        if (raw !== null && heavy(raw)) {
          out.push({ line: lineOf(block, 'font-weight'), message: 'font-weight ' + raw + ' outside hero — go one size up instead' });
        }
      }
    }
    if (XAML.indexOf(ext) >= 0) {
      for (const style of xamlStyles(text)) {
        if (/hero/i.test(style.key)) continue;
        const raw = setter(style.body, 'FontWeight');
        if (raw !== null && heavy(raw)) {
          out.push({ line: setterLine(style, 'FontWeight'), message: 'FontWeight ' + raw + ' outside hero — go one size up instead' });
        }
      }
    }
    if (JSX.indexOf(ext) >= 0) {
      lines(text).forEach((line, i) => {
        if (COMMENT.test(line) || /hero/i.test(line)) return;
        const m = /\bfont-(?:bold|extrabold|black)\b/.exec(line);
        if (m) out.push({ line: i + 1, message: m[0] + ' outside hero — go one size up instead' });
      });
    }
    return out;
  },
};

const lineHeightDeclared = {
  id: 'line-height',
  severity: 'warn',
  exts: STYLE,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    if (!state(ctx)) return [];
    return selectorFinding(file, text, STYLE, (block, out) => {
      if (!TEXT_ROLE.test(block.selector)) return;
      if (decl(block.body, 'font-size') === null) return;
      if (decl(block.body, 'line-height') !== null) return;
      out.push({ line: block.line, message: 'text role sets font-size without line-height' });
    });
  },
};

const wpfLineStacking = {
  id: 'wpf-line-stacking',
  severity: 'error',
  exts: ['.xaml'],
  check(file, text) {
    const out = [];
    for (const style of xamlStyles(text)) {
      if (setter(style.body, 'LineHeight') === null) continue;
      const strategy = setter(style.body, 'LineStackingStrategy');
      if (strategy === 'BlockLineHeight') continue;
      out.push({
        line: setterLine(style, 'LineHeight'),
        message: 'LineHeight without LineStackingStrategy="BlockLineHeight"',
      });
    }
    return out;
  },
};

const tabularNumerals = {
  id: 'tabular-numerals',
  severity: 'warn',
  check(ctx) {
    if (!ctx || !Array.isArray(ctx.files) || !ctx.files.length) return [];
    const own = ctx.files.filter((f) => !isTokenFile(f.rel || f.path || ''));
    if (!own.length) return [];
    const web = own.filter((f) => STYLE.indexOf(extOf(f.rel || f.path || '')) >= 0);
    const wpf = own.filter((f) => extOf(f.rel || f.path || '') === '.xaml');
    const webPool = ctx.files.filter((f) => STYLE.indexOf(extOf(f.rel || f.path || '')) >= 0);
    const wpfPool = ctx.files.filter((f) => extOf(f.rel || f.path || '') === '.xaml');
    const out = [];
    if (web.length && !webPool.some((f) => /font-variant-numeric\s*:[^;}]*tabular-nums/i.test(f.text))) {
      out.push({ file: web[0].rel || web[0].path, line: 1, message: 'no font-variant-numeric: tabular-nums anywhere' });
    }
    if (wpf.length && !wpfPool.some((f) => /NumeralAlignment"\s*Value\s*=\s*"Tabular"|NumeralAlignment\s*=\s*"Tabular"/.test(f.text))) {
      out.push({ file: wpf[0].rel || wpf[0].path, line: 1, message: 'no Typography.NumeralAlignment="Tabular" anywhere' });
    }
    return out;
  },
};

const monoDataNumbers = {
  id: 'mono-data-numbers',
  severity: 'warn',
  exts: JSX,
  check(file, text) {
    if (isTokenFile(file)) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line)) return;
      if (!/\.(?:toFixed|toLocaleString)\(/.test(line)) return;
      if (/tk-mono|font-mono/.test(line)) return;
      out.push({ line: i + 1, message: 'formatted number without the mono class' });
    });
    return out;
  },
};

const uppercaseLabel = {
  id: 'uppercase-label',
  severity: 'error',
  exts: WEB,
  check(file, text) {
    if (isTokenFile(file)) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (COMMENT.test(line)) return;
      const m = /text-transform\s*:\s*uppercase|(?:^|[\s"'`{])(?:[a-z][a-z0-9-]*:)?uppercase(?=$|[\s"'`}])/.exec(line);
      if (m) out.push({ line: i + 1, message: 'uppercase label — first letter capital, rest lowercase' });
    });
    return out;
  },
};

function radiusValues(raw) {
  return String(raw)
    .trim()
    .split(/[\s,/]+/)
    .filter(Boolean);
}

function isFullRound(line, raw) {
  const r = px(raw.trim());
  if (r === null || r <= 0) return false;
  for (const m of String(line).matchAll(/\b(?:Width|Height)\s*=\s*"([\d.]+)"/g)) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && Math.abs(n - r * 2) < 0.01) return true;
  }
  return false;
}

const tokenizedRadius = {
  id: 'tokenized-radius',
  severity: 'error',
  exts: ALL,
  check(file, text, ctx) {
    if (isTokenFile(file)) return [];
    const s = state(ctx);
    if (!s || !s.radii.size) return [];
    const out = [];
    lines(text).forEach((line, i) => {
      if (skipLine(line)) return;
      const m =
        /border-radius\s*:\s*([^;}\n]+)/i.exec(line) ||
        /CornerRadius\s*=\s*"([^"]+)"/.exec(line) ||
        /Property\s*=\s*"CornerRadius"\s*Value\s*=\s*"([^"]+)"/.exec(line);
      if (!m) return;
      const raw = m[1];
      if (raw.includes('{')) return;
      if (/var\(\s*--[\w-]*\br(?:-[\w-]+)?\s*\)/.test(raw)) return;
      if (isFullRound(line, raw)) return;
      const bad = radiusValues(raw).some((part) => {
        if (/^(?:50%|100%|full|9999px|inherit|initial|unset)$/i.test(part)) return false;
        if (/^var\(/.test(part)) return false;
        const n = px(part);
        if (n === null) return true;
        return n !== 0 && !s.radii.has(n);
      });
      if (bad) out.push({ line: i + 1, message: raw.trim() + ' — not a radius token' });
    });
    return out;
  },
};

module.exports = {
  id: 'colour',
  lineRules: [],
  fileRules: [
    rawColour,
    midGrey,
    tailwindPalette,
    tailwindUtility,
    monoValueColour,
    ghostButtonText,
    filledButtonText,
    borderAlpha,
    warningFill,
    infoToken,
    whiteBackground,
    backgroundGradient,
    wpfGradientInterpolation,
    typeScale,
    minFontSize,
    heroWeight,
    lineHeightDeclared,
    wpfLineStacking,
    monoDataNumbers,
    uppercaseLabel,
    tokenizedRadius,
  ].map(guard),
  projectRules: [unusedToken, tabularNumerals].map(guardProject),
};
