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
  ],
};
