'use strict';

const XAML = ['.axaml', '.xaml'];
const SHELL_EXT = ['.axaml', '.xaml', '.tsx', '.jsx', '.css', '.cs'];
const PLUGIN_ASSET = /(^|\/)skills\/teknesyum-ui\/assets\//;
const SIGNATURE = /teknesyum-ui template [\w./-]+/;
const EMBEDDED = /#|avares:\/\/|;component\/|pack:\/\/|^fonts:/i;
const ROOT_TAG = /<(?!\?|!)([\w:.]+)([^>]*)>/;
const WINDOW_STYLE = /<Style\s+Selector="\s*(?::is\(\s*Window\s*\)|Window)\s*"\s*>([\s\S]*?)<\/Style>/g;

const SHELL_NAMES = [
  { re: /^(titlebar|title-bar|ustcubuk|ust-cubuk|kabukstilleri)\b/i, what: 'title bar', target: 'ustcubuk' },
  { re: /^(updatepanel|update-panel|updatebadge|guncellemepaneli|guncelleme-paneli)\b/i, what: 'update panel', target: 'durum' },
  { re: /^(kurulumekrani|kurulum-ekrani|installscreen|installer)\b/i, what: 'install screen', target: 'kur' },
];
const HAND_TITLEBAR = [
  /<(?:Grid|Border|DockPanel|StackPanel|Panel)\b[^>]*\b(?:x:)?Name="(?:TitleBar|UstCubuk)"/,
  /data-tauri-drag-region|-webkit-app-region:\s*drag/,
];

const OUTLINE_EXTS = ['.css', '.xaml', '.axaml'];
const OUTLINE_CSS_KEYWORD = /\.[\w-]*(?:chip|tab|tk-sync|tk-update)[\w-]*/i;
const OUTLINE_TITLEBAR_BUTTON = /\.[\w-]*titlebar[\w-]*(?:control|button)[\w-]*/i;
const OUTLINE_EXCEPTION = /outlined/i;
const OUTLINE_XAML_NAME = /tab|chip|header|windowcontrol|caption/i;

const MAIN_WINDOW_XAML = /^(?:.*\/)?MainWindow\.(?:axaml|xaml)$/i;
const SKIP_WINDOW_NAME = /kurulum|installer|setup|dialog/i;
const FIXED_XAML = /\bCanResize\s*=\s*"False"|\bResizeMode\s*=\s*"NoResize"/i;
const MAXIMIZED_XAML = /\bWindowState\s*=\s*"Maximized"/i;
const MAXIMIZED_CODE_BEHIND = /WindowState\s*=\s*WindowState\.Maximized\b/;
const ELECTRON_CODE_EXT = ['.js', '.ts', '.mjs', '.cjs'];
const BROWSER_WINDOW = /new\s+BrowserWindow\s*\(/;
const BROWSER_WINDOW_RESIZABLE_FALSE = /\bresizable\s*:\s*false\b/;
const BROWSER_WINDOW_MAXIMIZE = /\.maximize\s*\(\s*\)/;
const TAURI_CONF_PATH = ['src-tauri/tauri.conf.json', 'tauri.conf.json'];

function pencereKapali(ctx) {
  return !!(ctx.config && ctx.config.pencere === 'normal');
}

function tauriConfigFile(ctx) {
  for (const file of TAURI_CONF_PATH) {
    const text = typeof ctx.read === 'function' ? ctx.read(file) : null;
    if (text === null || text === undefined) continue;
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }
    return { file, json };
  }
  return null;
}

function tauriWindowsOf(json) {
  if (!json) return [];
  const app = json.app && Array.isArray(json.app.windows) ? json.app.windows : null;
  const legacy = json.tauri && Array.isArray(json.tauri.windows) ? json.tauri.windows : null;
  return app || legacy || [];
}

function codeBehindText(ctx, rel) {
  const withCs = rel + '.cs';
  const direct = ctx.files.find((f) => f.rel === withCs);
  if (direct) return direct.text;
  return typeof ctx.read === 'function' ? ctx.read(withCs) : null;
}

function mainWindowFindings(ctx) {
  const out = [];
  for (const f of ctx.files) {
    if (!XAML.includes(f.ext)) continue;
    if (!MAIN_WINDOW_XAML.test(f.rel)) continue;
    if (SKIP_WINDOW_NAME.test(f.rel)) continue;
    if (FIXED_XAML.test(f.text)) continue;
    if (MAXIMIZED_XAML.test(f.text)) continue;
    const behind = codeBehindText(ctx, f.rel);
    if (behind && MAXIMIZED_CODE_BEHIND.test(behind)) continue;
    out.push({
      file: f.rel,
      line: 1,
      message:
        'the main window does not open maximized: set WindowState="Maximized" on the ' +
        'root Window, or WindowState = WindowState.Maximized in its code-behind. ' +
        'Fixed-size tool windows are exempt (CanResize="False" / ResizeMode="NoResize"), ' +
        'as is config "pencere": "normal".',
    });
  }
  return out;
}

function electronWindowFindings(ctx) {
  const out = [];
  for (const f of ctx.files) {
    if (!ELECTRON_CODE_EXT.includes(f.ext)) continue;
    if (SKIP_WINDOW_NAME.test(f.rel)) continue;
    if (!BROWSER_WINDOW.test(f.text)) continue;
    if (BROWSER_WINDOW_RESIZABLE_FALSE.test(f.text)) continue;
    if (BROWSER_WINDOW_MAXIMIZE.test(f.text)) continue;
    out.push({
      file: f.rel,
      line: 1,
      message:
        'this BrowserWindow never calls .maximize(): the main window should open maximized ' +
        '(call win.maximize() before or in place of show()). Fixed-size tool windows are ' +
        'exempt (resizable: false), as is config "pencere": "normal".',
    });
  }
  return out;
}

function tauriWindowFindings(ctx) {
  const found = tauriConfigFile(ctx);
  if (!found) return [];
  const out = [];
  tauriWindowsOf(found.json).forEach((w, i) => {
    if (!w) return;
    const label = String(w.label || i);
    if (SKIP_WINDOW_NAME.test(label)) return;
    if (w.resizable === false) return;
    if (w.maximized === true) return;
    out.push({
      file: found.file,
      line: 0,
      message: 'window ' + label + ' does not set "maximized": true — the main window should open maximized.',
    });
  });
  return out;
}

function outlineStripComments(text) {
  return String(text)
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

function outlineCssBlocks(text) {
  const out = [];
  const stack = [];
  let start = 0;
  let line = 1;
  let startLine = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      const raw = text.slice(start, i);
      const blank = (/^\s*/.exec(raw)[0].match(/\n/g) || []).length;
      stack.push({ selector: raw.trim(), line: startLine + blank, at: i + 1 });
      start = i + 1;
      startLine = line;
    } else if (c === '}') {
      const rule = stack.pop();
      if (rule) {
        rule.body = text.slice(rule.at, i);
        if (!rule.body.includes('{')) out.push(rule);
      }
      start = i + 1;
      startLine = line;
    } else if (c === '\n') {
      line++;
    }
  }
  return out;
}

function outlineTarget(selector) {
  return selector
    .split(',')
    .map((s) => s.trim())
    .some((s) => !OUTLINE_EXCEPTION.test(s) && (OUTLINE_CSS_KEYWORD.test(s) || OUTLINE_TITLEBAR_BUTTON.test(s)));
}

function outlineBorderDeclaration(body) {
  for (const prop of ['border', 'border-top', 'border-bottom', 'border-left', 'border-right']) {
    const re = new RegExp('(?:^|[;{\\s])' + prop + '\\s*:\\s*([^;}]+)', 'i');
    const m = re.exec(body);
    if (!m) continue;
    const v = m[1].trim();
    if (/^(?:0(?:px)?|none)\s*$/i.test(v)) continue;
    if (/\bsolid\b/i.test(v) && /^[\d.]/.test(v)) {
      return (body.slice(0, m.index).match(/\n/g) || []).length;
    }
  }
  const styleSolid = /(?:^|[;{\s])border-style\s*:\s*solid\b/i.test(body);
  const widthMatch = /(?:^|[;{\s])border-width\s*:\s*([\d.]+)/i.exec(body);
  if (styleSolid && widthMatch && parseFloat(widthMatch[1]) > 0) return 0;
  return -1;
}

function outlineXamlHosts(text) {
  const out = [];
  const re = /<(Style|ControlTheme)\b([^>]*)>([\s\S]*?)<\/(?:Style|ControlTheme)>/g;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[2];
    const key = (/x:Key\s*=\s*"([^"]*)"/.exec(attrs) || [])[1] || '';
    const sel = (/Selector\s*=\s*"([^"]*)"/.exec(attrs) || [])[1] || '';
    const target = (/TargetType\s*=\s*"([^"]*)"/.exec(attrs) || [])[1] || '';
    const bodyStart = m.index + m[0].indexOf(m[3]);
    out.push({ name: (key + ' ' + sel + ' ' + target).trim(), body: m[3], bodyStart });
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function rootTag(text) {
  const body = text.replace(/^﻿/, '').replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
  const m = ROOT_TAG.exec(body);
  if (!m) return null;
  return { name: m[1], attrs: m[2], line: lineOf(body, m.index) };
}

function windowStyleSetsSize(ctx) {
  if (ctx._kabukWindowStyle !== undefined) return ctx._kabukWindowStyle;
  let found = false;
  for (const f of ctx.files) {
    if (f.ext !== '.axaml') continue;
    WINDOW_STYLE.lastIndex = 0;
    let m;
    while ((m = WINDOW_STYLE.exec(f.text))) if (/Property="FontSize"/.test(m[1])) found = true;
    if (found) break;
  }
  ctx._kabukWindowStyle = found;
  return found;
}

function sansHead(ctx) {
  const chain = ctx.tokens && ctx.tokens.font && ctx.tokens.font.sans && ctx.tokens.font.sans.chain;
  return Array.isArray(chain) && chain.length ? String(chain[0]) : null;
}

function shellKind(file, text) {
  const base = file.split('/').pop();
  for (const s of SHELL_NAMES) if (s.re.test(base)) return s;
  const ext = '.' + base.split('.').pop().toLowerCase();
  if (XAML.includes(ext) && HAND_TITLEBAR[0].test(text)) return SHELL_NAMES[0];
  if (ext !== '.cs' && HAND_TITLEBAR[1].test(text)) return SHELL_NAMES[0];
  return null;
}

module.exports = {
  id: 'kabuk',

  fileRules: [
    {
      id: 'kok-yazi-boyu',
      severity: 'error',
      exts: XAML,
      check(file, text, ctx) {
        const root = rootTag(text);
        if (!root || root.name !== 'Window') return [];
        if (/\bFontSize\s*=/.test(root.attrs)) return [];
        if (/\bStyle\s*=\s*"\{StaticResource\s+TkWindow\}"/.test(root.attrs)) return [];
        if (file.endsWith('.axaml') && windowStyleSetsSize(ctx)) return [];
        return [
          {
            line: root.line,
            message:
              'the window sets no root FontSize, so untyped text falls to the framework default (14), below fs-2. ' +
              (file.endsWith('.axaml')
                ? 'Give it FontSize="{StaticResource FontSize2}" FontFamily="{StaticResource FontSans}", or include the generated Theme.axaml.'
                : 'Give it Style="{StaticResource TkWindow}" or FontSize="{StaticResource FontSize2}".'),
          },
        ];
      },
    },
    {
      id: 'font-gomulu-degil',
      severity: 'error',
      exts: XAML,
      check(file, text, ctx) {
        if (PLUGIN_ASSET.test(file)) return [];
        const head = sansHead(ctx);
        if (!head) return [];
        const m = /<FontFamily\s+x:Key="FontSans"\s*>([^<]*)<\/FontFamily>/.exec(text);
        if (!m) return [];
        const first = m[1].split(',')[0].trim();
        if (EMBEDDED.test(first) || first !== head) return [];
        return [
          {
            line: lineOf(text, m.index),
            message:
              'FontSans names ' +
              head +
              ' but does not embed it; the machine falls back to another face. Run setup.js --apply (it copies the font into Assets/Fonts and points FontSans at an ' +
              (file.endsWith('.axaml') ? 'avares' : 'assembly component') +
              ' URI).',
          },
        ];
      },
    },
    {
      id: 'sablon-imzasiz',
      severity: 'error',
      exts: SHELL_EXT,
      check(file, text) {
        if (PLUGIN_ASSET.test(file)) return [];
        const kind = shellKind(file, text);
        if (!kind) return [];
        if (SIGNATURE.test(text.split(/\r?\n/).slice(0, 3).join('\n'))) return [];
        return [
          {
            line: 1,
            message:
              'this ' +
              kind.what +
              ' is hand-written: it carries no template signature line. Take it from scaffold.js ' +
              kind.target +
              ', do not write it by hand.',
          },
        ];
      },
    },
    {
      id: 'eylem-sarmali',
      severity: 'warn',
      exts: ['.css'],
      check(file, rawText) {
        const out = [];
        for (const block of outlineCssBlocks(outlineStripComments(rawText))) {
          if (!/(?:actions|eylem|buttons|dugmeler)\b/i.test(block.selector) || /titlebar|pencere|window/i.test(block.selector)) continue;
          const body = block.body;
          if (!/(?:^|[;\s])display\s*:\s*(?:inline-)?flex\b/.test(body)) continue;
          if (/flex-wrap\s*:|flex-flow\s*:[^;]*wrap|flex-direction\s*:\s*column/.test(body)) continue;
          out.push({
            line: block.line,
            message:
              block.selector.split(',')[0].trim() +
              ' is a flex row of actions with no flex-wrap: on a narrow card or a large text scale the buttons push past the edge. Add flex-wrap: wrap; min-width: 0.',
          });
        }
        return out;
      },
    },
    {
      id: 'anahatsiz-dugme',
      severity: 'warn',
      exts: OUTLINE_EXTS,
      check(file, rawText) {
        const text = outlineStripComments(rawText);
        const ext = '.' + file.split('.').pop().toLowerCase();
        const out = [];
        if (ext === '.css') {
          for (const block of outlineCssBlocks(text)) {
            if (!outlineTarget(block.selector)) continue;
            const offset = outlineBorderDeclaration(block.body);
            if (offset < 0) continue;
            out.push({
              line: block.line + offset,
              message:
                block.selector.split(',')[0].trim() +
                ' is a chip/tab/window-button target — teknesyum-ui keeps these outline-free (border: 0); ' +
                'hover moves the text to Renk 2 text and opens an underline instead.',
            });
          }
          return out;
        }
        for (const host of outlineXamlHosts(text)) {
          if (!OUTLINE_XAML_NAME.test(host.name.replace(/[^a-z]/gi, ''))) continue;
          const m = /<Setter\s+Property="BorderThickness"\s+Value="([^"]*)"/i.exec(host.body);
          if (!m) continue;
          const nums = m[1].split(/[,\s]+/).map(Number).filter((n) => !Number.isNaN(n));
          if (nums.length && nums.every((n) => n === 0)) continue;
          out.push({
            line: (text.slice(0, host.bodyStart + host.body.indexOf(m[0])).match(/\n/g) || []).length + 1,
            message:
              (host.name || 'this style') +
              ' sets BorderThickness ' +
              m[1] +
              ' on a tab/chip/header/window-control style — teknesyum-ui keeps these outline-free.',
          });
        }
        return out;
      },
    },
  ],

  projectRules: [
    {
      id: 'pencere-maximize',
      severity: 'error',
      check(ctx) {
        if (pencereKapali(ctx)) return [];
        return [].concat(mainWindowFindings(ctx), electronWindowFindings(ctx), tauriWindowFindings(ctx));
      },
    },
  ],
};
