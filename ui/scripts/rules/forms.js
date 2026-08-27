'use strict';

const CODE = ['.js', '.jsx', '.ts', '.tsx', '.cs'];
const MARKUP = ['.jsx', '.tsx', '.html'];
const XAML = ['.xaml', '.axaml'];
const STYLE = ['.css', '.scss'];

const PANELS = [
  'Border', 'Grid', 'StackPanel', 'DockPanel', 'WrapPanel',
  'UniformGrid', 'ScrollViewer', 'GroupBox', 'Expander', 'Panel',
];
const CONTAINERS = ['TabControl', 'ToolBar', 'Menu'];
const TEMPLATE_HOSTS = ['Grid', 'StackPanel', 'DockPanel', 'WrapPanel', 'Canvas', 'UniformGrid', 'ContentPresenter'];
const PROMO = /(^|[\\/_.-])(promo|landing|site)([\\/_.-]|$)/i;
const LETTER = 'A-Za-z\\u00c0-\\u024f\\u011e\\u011f\\u0130\\u0131\\u015e\\u015f';
const MAX_PARAGRAPH_LINES = 4;
const MIN_LITERAL_WORDS = 3;

function relOf(file) {
  if (!file) return '';
  if (typeof file === 'string') return file;
  return file.rel || file.path || '';
}

function lineAt(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i += 1) if (text[i] === '\n') n += 1;
  return n;
}

function templateRanges(text) {
  const out = [];
  const blocks = /<ControlTemplate\b[\s\S]*?<\/ControlTemplate>/g;
  let hit;
  while ((hit = blocks.exec(text)) !== null) out.push([hit.index, hit.index + hit[0].length]);
  return out;
}

function inRanges(ranges, index) {
  for (const [start, end] of ranges) if (index >= start && index < end) return true;
  return false;
}

function walkTokens(node, name, depth) {
  if (!node || typeof node !== 'object' || depth > 8) return null;
  if (Object.prototype.hasOwnProperty.call(node, name)) return node[name];
  for (const key of Object.keys(node)) {
    const hit = walkTokens(node[key], name, depth + 1);
    if (hit !== null && hit !== undefined) return hit;
  }
  return null;
}

function tokenEntry(ctx, name) {
  if (!ctx || !ctx.tokens) return null;
  const hit = walkTokens(ctx.tokens, name, 0);
  if (hit === null || hit === undefined) return null;
  if (typeof hit === 'string' || typeof hit === 'number') return hit;
  if (typeof hit !== 'object') return null;
  if (typeof hit.value === 'string' || typeof hit.value === 'number') return hit.value;
  if (typeof hit.ref === 'string') {
    const seen = new Set([name]);
    let ref = hit.ref;
    while (ref && !seen.has(ref)) {
      seen.add(ref);
      const next = walkTokens(ctx.tokens, ref, 0);
      if (!next) return null;
      if (typeof next === 'string' || typeof next === 'number') return next;
      if (typeof next.value === 'string') return next.value;
      ref = typeof next.ref === 'string' ? next.ref : null;
    }
  }
  return null;
}

function themeValue(ctx, name) {
  const theme = ctx && ctx.theme;
  if (!theme || typeof theme !== 'object') return null;
  const keys = [name, '--' + name, '--tk-' + name, '--color-' + name];
  let value = null;
  for (const key of keys) {
    if (typeof theme[key] === 'string') { value = theme[key]; break; }
  }
  let guard = 0;
  while (value && /var\(/.test(value) && guard < 8) {
    guard += 1;
    const ref = value.match(/var\(\s*(--[\w-]+)/);
    if (!ref) break;
    const next = theme[ref[1]];
    if (typeof next !== 'string') return null;
    value = next;
  }
  return value;
}

function dangerHex(ctx) {
  const raw = themeValue(ctx, 'danger') || tokenEntry(ctx, 'danger');
  if (typeof raw !== 'string') return null;
  const hex = raw.trim().match(/^#([0-9a-f]{6})$/i);
  return hex ? '#' + hex[1].toLowerCase() : null;
}

function toastMax(ctx) {
  const raw = tokenEntry(ctx, 'toast-max');
  const value = Number(String(raw === null ? '' : raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function flattenKeys(value, prefix, out) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) flattenKeys(value[key], prefix ? prefix + '.' + key : key, out);
    return out;
  }
  out.set(prefix, value);
  return out;
}

function readLocale(ctx, rel) {
  if (!ctx || typeof ctx.read !== 'function') return null;
  let text = null;
  try { text = ctx.read(rel); } catch (err) { return null; }
  if (typeof text !== 'string' || !text.trim()) return null;
  try {
    return { text, data: JSON.parse(text) };
  } catch (err) {
    return null;
  }
}

function lineOfKey(text, key) {
  const leaf = String(key).split('.').pop();
  const index = text.indexOf('"' + leaf + '"');
  return index < 0 ? 1 : lineAt(text, index);
}

function wordCount(value) {
  return value.split(/\s+/).filter((word) => new RegExp('[' + LETTER + ']').test(word)).length;
}

module.exports = {
  id: 'forms',

  lineRules: [
    {
      id: 'no-placeholder',
      severity: 'error',
      exts: MARKUP.concat(XAML),
      test(line) {
        if (/(^|[\s{(<[])placeholder\s*=/.test(line)) {
          return 'No placeholder attribute: use a visible label plus help text below the field.';
        }
        if (/\b(PlaceholderText|Watermark)\s*=/.test(line)) {
          return 'No placeholder: use a visible label plus help text below the field.';
        }
        return null;
      },
    },
    {
      id: 'alert-role-scope',
      severity: 'error',
      exts: MARKUP,
      test(line) {
        if (!/role\s*=\s*["']alert["']/.test(line)) return null;
        if (/danger|error/i.test(line)) return null;
        return 'role="alert" belongs only on the persistent danger toast.';
      },
    },
    {
      id: 'error-border-alpha',
      severity: 'error',
      exts: STYLE.concat(XAML, MARKUP),
      test(line, ctx) {
        if (!/border/i.test(line)) return null;
        const danger = dangerHex(ctx);
        if (!danger) return null;
        const bare = danger.slice(1);
        const [r, g, b] = hexToRgb(danger);
        const alphaPatterns = [
          new RegExp('#[0-9a-f]{2}' + bare + '\\b', 'i'),
          new RegExp('#' + bare + '[0-9a-f]{2}\\b', 'i'),
          new RegExp('rgba?\\(\\s*' + r + '\\s*,\\s*' + g + '\\s*,\\s*' + b + '\\s*[,/]\\s*(?:0?\\.\\d+|\\d{1,2}%)', 'i'),
          /\bdanger(?:-text)?\/\d{1,3}\b/i,
          /var\(\s*--[\w-]*danger[\w-]*\s*\)\s*\/\s*\d/i,
        ];
        for (const pattern of alphaPatterns) {
          if (pattern.test(line)) return 'Error border takes the full danger colour, not an alpha step.';
        }
        return null;
      },
    },
    {
      id: 'no-messagebox',
      severity: 'error',
      exts: ['.cs', '.vb'],
      test(line) {
        return /\bMessageBox\s*\.\s*Show\b/.test(line)
          ? 'No MessageBox.Show: use the in-app modal or toast.'
          : null;
      },
    },
    {
      id: 'layout-rounding-off',
      severity: 'error',
      exts: XAML,
      test(line) {
        const hit = line.match(/\b(UseLayoutRounding|SnapsToDevicePixels)\s*=\s*"False"/);
        return hit ? hit[1] + ' must not be False: half-pixel strokes disappear.' : null;
      },
      fix(line) {
        return line.replace(/(\b(?:UseLayoutRounding|SnapsToDevicePixels)\s*=\s*")False(")/g, '$1True$2');
      },
    },
    {
      id: 'turkish-casing',
      severity: 'error',
      exts: CODE,
      test(line, ctx) {
        if (/toLocaleUpperCase|toLocaleLowerCase|CultureInfo/.test(line)) return null;
        if (/\.(?:toUpperCase|toLowerCase)\(\s*\)/.test(line)) {
          return "Turkish casing: use toLocaleUpperCase('tr') / toLocaleLowerCase('tr').";
        }
        if (ctx && ctx.ext === '.cs' && /\.(?:ToUpper|ToLower)\(\s*\)/.test(line)) {
          return 'Turkish casing: pass new CultureInfo("tr-TR") to ToUpper / ToLower.';
        }
        return null;
      },
      fix(line, ctx) {
        if (ctx && ctx.ext === '.cs') return null;
        if (!/\.(?:toUpperCase|toLowerCase)\(\s*\)/.test(line)) return null;
        return line
          .replace(/\.toUpperCase\(\s*\)/g, ".toLocaleUpperCase('tr')")
          .replace(/\.toLowerCase\(\s*\)/g, ".toLocaleLowerCase('tr')");
      },
    },
    {
      id: 'no-sentence-concat',
      severity: 'warn',
      exts: CODE,
      test(line) {
        if (!/\+/.test(line)) return null;
        const concat = /t\(\s*['"][^'"]+['"][^)]*\)\s*\+/.test(line)
          || /\+\s*t\(\s*['"][^'"]+['"]/.test(line);
        if (!concat) return null;
        return 'Do not concatenate sentence fragments: one locale key with a named placeholder.';
      },
    },
    {
      id: 'no-ui-string-literal',
      severity: 'warn',
      exts: ['.jsx', '.tsx'].concat(XAML),
      test(line, ctx) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('<!--')) return null;
        const ext = ctx && ctx.ext;
        let candidate = null;
        if (ext === '.jsx' || ext === '.tsx') {
          const hit = line.match(/>([^<>{}$"'`=/]+)</);
          if (hit) candidate = hit[1].trim();
        } else if (XAML.indexOf(ext) >= 0) {
          const hit = line.match(/\b(?:Content|Text|Header)\s*=\s*"([^"{}$]+)"/);
          if (hit) candidate = hit[1].trim();
        }
        if (!candidate) return null;
        if (!new RegExp('[' + LETTER + ']').test(candidate)) return null;
        if (wordCount(candidate) < MIN_LITERAL_WORDS) return null;
        return 'UI text belongs in locale/*.json, not in the source.';
      },
    },
  ],

  fileRules: [
    {
      id: 'error-field-aria-pair',
      severity: 'error',
      exts: MARKUP,
      check(file, text) {
        const out = [];
        const tags = /<[A-Za-z][^<>]*>/g;
        let hit;
        while ((hit = tags.exec(text)) !== null) {
          const tag = hit[0];
          const invalid = /\baria-invalid\b/.test(tag);
          const described = /\baria-describedby\b/.test(tag);
          if (invalid === described) continue;
          out.push({
            line: lineAt(text, hit.index),
            message: invalid
              ? 'aria-invalid without aria-describedby: point the field at its error text.'
              : 'aria-describedby on an error field without aria-invalid.',
          });
        }
        return out;
      },
    },
    {
      id: 'panel-fixed-height',
      severity: 'error',
      exts: XAML,
      check(file, text) {
        const out = [];
        const templates = templateRanges(text);
        const tags = new RegExp('<(' + PANELS.join('|') + ')\\b[^<>]*>', 'g');
        let hit;
        while ((hit = tags.exec(text)) !== null) {
          if (inRanges(templates, hit.index)) continue;
          const attrs = hit[0].replace(/\b(?:Min|Max|Row|Column|Line|Extent|Viewport)Height/g, '');
          if (!/\bHeight\s*=\s*"\s*\d/.test(attrs)) continue;
          if (/\bWidth\s*=\s*"\s*\d/.test(attrs)) continue;
          out.push({
            line: lineAt(text, hit.index),
            message: hit[1] + ' takes MinHeight, never a fixed Height.',
          });
        }
        return out;
      },
    },
    {
      id: 'template-outline-root',
      severity: 'error',
      exts: XAML,
      check(file, text) {
        const out = [];
        const blocks = /<ControlTemplate\b[\s\S]*?<\/ControlTemplate>/g;
        let hit;
        while ((hit = blocks.exec(text)) !== null) {
          const block = hit[0];
          const body = block.slice(block.indexOf('>') + 1);
          const root = body.match(/<([A-Za-z][\w.]*)\b/);
          if (!root || TEMPLATE_HOSTS.indexOf(root[1]) < 0) continue;
          const rootTagEnd = body.indexOf('>', body.indexOf('<' + root[1]));
          const rootTag = body.slice(0, rootTagEnd + 1);
          if (/BorderBrush\s*=|BorderThickness\s*=/.test(rootTag)) continue;
          const rest = body.slice(rootTagEnd + 1);
          const outline = (rest.match(/<[A-Za-z][\w.]*\b[^<>]*BorderBrush\s*=[^<>]*>/g) || [])
            .filter((tag) => !/\b(?:HorizontalAlignment|VerticalAlignment)\s*=/.test(tag))
            .filter((tag) => !/\b(?:Width|Height)\s*=\s*"\s*\d/.test(tag));
          if (!outline.length) continue;
          out.push({
            line: lineAt(text, hit.index),
            message: 'The outline must be the template root, not a sibling inside ' + root[1] + '.',
          });
        }
        return out;
      },
    },
    {
      id: 'itemscontrol-template',
      severity: 'error',
      exts: XAML,
      check(file, text) {
        const out = [];
        const blocks = /<Style\b[\s\S]*?<\/Style>/g;
        let hit;
        while ((hit = blocks.exec(text)) !== null) {
          const block = hit[0];
          const target = block.match(/TargetType\s*=\s*"(?:\{x:Type\s+)?([A-Za-z][\w.]*)/);
          if (!target || CONTAINERS.indexOf(target[1]) < 0) continue;
          if (!/BorderBrush|BorderThickness/.test(block)) continue;
          if (/Property\s*=\s*"Template"|<ControlTemplate\b/.test(block)) continue;
          out.push({
            line: lineAt(text, hit.index),
            message: target[1] + ' is outlined but keeps the system template: give it its own ControlTemplate.',
          });
        }
        return out;
      },
    },
    {
      id: 'toast-stack-cap',
      severity: 'error',
      exts: STYLE.concat(CODE, XAML),
      check(file, text, ctx) {
        const max = toastMax(ctx);
        if (!max) return [];
        const stack = text.match(/toast[-_]?(?:stack|container|list|host|region|items)/i);
        if (!stack) return [];
        const caps = [
          new RegExp('nth-(?:last-)?child\\(\\s*n\\s*\\+\\s*' + (max + 1) + '\\s*\\)'),
          new RegExp('slice\\(\\s*0\\s*,\\s*' + max + '\\s*\\)'),
          new RegExp('slice\\(\\s*-' + max + '\\s*\\)'),
          /--tk-toast-max|TkToastMax|TOAST_MAX|toastMax/,
        ];
        for (const cap of caps) if (cap.test(text)) return [];
        return [{
          line: lineAt(text, stack.index),
          message: 'Toast stack is uncapped: hold at most ' + max + ' visible toasts.',
        }];
      },
    },
    {
      id: 'no-theme-library',
      severity: 'error',
      exts: CODE.concat(XAML, ['.json', '.csproj', '.props']),
      check(file, text) {
        const out = [];
        const rel = relOf(file);
        if (/licenses\.md$/i.test(rel)) return out;
        const marks = /(@mui\/[\w-]+|@material-ui\/[\w-]+|MahApps(?:\.Metro)?|HandyControl|Wpf\.?Ui\b|wpf-ui)/g;
        const seen = new Set();
        let hit;
        while ((hit = marks.exec(text)) !== null) {
          const line = lineAt(text, hit.index);
          if (seen.has(line)) continue;
          seen.add(line);
          out.push({
            line,
            message: 'No prebuilt theme library (' + hit[1] + '): take behaviour libraries, never visual themes.',
          });
        }
        return out;
      },
    },
    {
      id: 'no-gsap',
      severity: 'error',
      exts: CODE.concat(['.html']),
      check(file, text) {
        const rel = relOf(file);
        if (PROMO.test(rel)) return [];
        const out = [];
        const marks = /\bgsap\b/g;
        const seen = new Set();
        let hit;
        while ((hit = marks.exec(text)) !== null) {
          const line = lineAt(text, hit.index);
          if (seen.has(line)) continue;
          seen.add(line);
          out.push({ line, message: 'gsap is allowed on the promo page only, never in application code.' });
        }
        return out;
      },
    },
  ],

  projectRules: [
    {
      id: 'locale-key-parity',
      severity: 'error',
      check(ctx) {
        const tr = readLocale(ctx, 'locale/tr.json');
        const en = readLocale(ctx, 'locale/en.json');
        if (!tr || !en) return [];
        const trKeys = flattenKeys(tr.data, '', new Map());
        const enKeys = flattenKeys(en.data, '', new Map());
        const out = [];
        for (const key of trKeys.keys()) {
          if (!enKeys.has(key)) out.push({ file: 'locale/en.json', line: 1, message: 'Missing key present in tr.json: ' + key });
        }
        for (const key of enKeys.keys()) {
          if (!trKeys.has(key)) out.push({ file: 'locale/tr.json', line: 1, message: 'Missing key present in en.json: ' + key });
        }
        return out;
      },
    },
    {
      id: 'locale-named-placeholder',
      severity: 'error',
      check(ctx) {
        const out = [];
        for (const rel of ['locale/tr.json', 'locale/en.json']) {
          const locale = readLocale(ctx, rel);
          if (!locale) continue;
          for (const [key, value] of flattenKeys(locale.data, '', new Map())) {
            if (typeof value !== 'string' || !/\{\d+\}/.test(value)) continue;
            out.push({
              file: rel,
              line: lineOfKey(locale.text, key),
              message: 'Positional placeholder in ' + key + ': name it, such as {count}.',
            });
          }
        }
        return out;
      },
    },
    {
      id: 'locale-paragraph-shape',
      severity: 'warn',
      check(ctx) {
        const out = [];
        for (const rel of ['locale/tr.json', 'locale/en.json']) {
          const locale = readLocale(ctx, rel);
          if (!locale) continue;
          for (const [key, value] of flattenKeys(locale.data, '', new Map())) {
            if (typeof value !== 'string' || value.indexOf('\n') < 0) continue;
            const paragraphs = value.split(/\n\s*\n/);
            const long = paragraphs.some((p) => p.split('\n').filter((l) => l.trim()).length > MAX_PARAGRAPH_LINES);
            const glued = paragraphs.length === 1 && value.split('\n').filter((l) => l.trim()).length > MAX_PARAGRAPH_LINES;
            if (!long && !glued) continue;
            out.push({
              file: rel,
              line: lineOfKey(locale.text, key),
              message: 'Paragraph in ' + key + ' runs past ' + MAX_PARAGRAPH_LINES + ' lines: split it with a blank line.',
            });
          }
        }
        return out;
      },
    },
    {
      id: 'borrowed-licence-recorded',
      severity: 'warn',
      check(ctx) {
        if (!ctx || !Array.isArray(ctx.files) || typeof ctx.read !== 'function') return [];
        const borrowed = ctx.files.filter((f) => /(^|[\\/])(vendor|vendored|third[-_]party|borrowed)([\\/]|$)/i.test(relOf(f)));
        if (!borrowed.length) return [];
        let licences = null;
        try { licences = ctx.read('docs/licenses.md'); } catch (err) { licences = null; }
        if (typeof licences !== 'string') {
          return [{ file: 'docs/licenses.md', line: 1, message: 'Borrowed components present but docs/licenses.md is missing.' }];
        }
        const out = [];
        for (const file of borrowed) {
          const rel = relOf(file);
          const name = rel.split(/[\\/]/).pop();
          if (licences.indexOf(name) >= 0 || licences.indexOf(rel) >= 0) continue;
          out.push({ file: 'docs/licenses.md', line: 1, message: 'Borrowed component not recorded: ' + rel });
        }
        return out;
      },
    },
    {
      id: 'unmeasured-label',
      severity: 'warn',
      check(ctx) {
        if (!ctx || !Array.isArray(ctx.files)) return [];
        const out = [];
        for (const file of ctx.files) {
          const rel = relOf(file);
          if (!/\.md$/i.test(rel)) continue;
          const text = typeof file.text === 'string' ? file.text : '';
          const lines = text.split('\n');
          for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            if (!/\bdefaults?\b/i.test(line) || !/\d/.test(line)) continue;
            if (/\(default, unmeasured\)/.test(line)) continue;
            if (/\bmeasured\b/i.test(line)) continue;
            out.push({ file: rel, line: i + 1, message: 'Unmeasured number: carry the (default, unmeasured) label.' });
          }
        }
        return out;
      },
    },
  ],
};
