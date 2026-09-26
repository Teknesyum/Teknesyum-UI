#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const K = require('./kontrast');

const argv = process.argv.slice(2);
const VERSION = '1.1.0';
const TARGETS = ['css', 'react', 'wpf', 'avalonia', 'winforms'];

const ARTIFACTS = {
  css: ['theme.css', 'a11y.css', 'forms.css', 'states.css'],
  react: ['theme.css', 'Signature.tsx'],
  wpf: ['Theme.xaml', 'States.xaml', 'Forms.xaml', 'Signature.xaml'],
  avalonia: ['Theme.axaml', 'Signature.axaml'],
  winforms: ['Palette.cs'],
};

const FONT_FILES = [
  'AtkinsonHyperlegibleNext-Regular.ttf',
  'AtkinsonHyperlegibleNext-SemiBold.ttf',
  'AtkinsonHyperlegibleNext-Bold.ttf',
  'OFL.txt',
];
const FONT_FAMILY = 'Atkinson Hyperlegible Next';
const THEME_FILE = { avalonia: 'Theme.axaml', wpf: 'Theme.xaml' };
const SKIP_PROJECT_DIR = /^(\.|node_modules$|bin$|obj$|teknesyum-ui$|trash$)/;

const SAMPLES = {
  'Signature.axaml': 'Signature.axaml.example',
};

function flag(name) {
  const hit = argv.find((a) => a === '--' + name || a.startsWith('--' + name + '='));
  if (!hit) return null;
  if (hit.includes('=')) return hit.slice(hit.indexOf('=') + 1);
  const i = argv.indexOf(hit);
  return argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
}

function has(name) {
  return argv.some((a) => a === '--' + name || a.startsWith('--' + name + '='));
}

function read(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function write(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function pluginDir() {
  return path.resolve(__dirname, '..');
}

function projectRoot() {
  return path.resolve(flag('project') || process.cwd());
}

function configFile(root) {
  return path.join(root, '.claude', 'teknesyum-ui.json');
}

function machineFile() {
  return path.join(os.homedir(), '.claude', 'teknesyum-ui.json');
}

function outRoot(root) {
  return path.join(root, 'teknesyum-ui');
}

function neonColour(name, fallback) {
  try {
    const T = JSON.parse(fs.readFileSync(templateFile('neon'), 'utf8'));
    return ((T.brand && T.brand[name]) || (T.role && T.role[name])).value;
  } catch {
    return fallback;
  }
}

function templateFile(name) {
  const local = path.join(pluginDir(), 'templates', name + '.tokens.json');
  if (fs.existsSync(local)) return local;
  if (name === 'neon') {
    const assets = path.join(pluginDir(), 'skills', 'teknesyum-ui', 'assets', 'theme.tokens.json');
    if (fs.existsSync(assets)) return assets;
  }
  return null;
}

function generatorFile() {
  const built = path.join(pluginDir(), 'scripts', 'generate.js');
  if (fs.existsSync(built)) return { file: built };
  return null;
}

const YES = /^(y|yes|true|1|on)$/i;
const NO = /^(n|no|false|0|off)$/i;
const HEX = /^#[0-9a-fA-F]{6}$/;

function bool(v, fallback) {
  const s = String(v).trim();
  if (YES.test(s)) return true;
  if (NO.test(s)) return false;
  return fallback;
}

function hex(v, field) {
  const s = String(v).trim();
  if (!HEX.test(s)) throw new Error('not a #rrggbb colour for ' + field + ': ' + s);
  return s.toLowerCase();
}

function parseTargets(v) {
  const list = String(v)
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length || list.includes('all')) return TARGETS.slice();
  const bad = list.filter((t) => !TARGETS.includes(t));
  if (bad.length) throw new Error('unknown target: ' + bad.join(', ') + '; pick from ' + TARGETS.join(', '));
  return list;
}

const QUESTIONS = [
  {
    key: 'template',
    ask: 'Which template? neon (the shipped standard) or custom (your own colours)',
    parse: (v) => {
      const s = String(v).trim().toLowerCase();
      if (s !== 'neon' && s !== 'custom') throw new Error('template must be neon or custom');
      return s;
    },
    fallback: 'neon',
  },
  {
    key: 'targets',
    ask: 'Which targets? comma separated from ' + TARGETS.join(', ') + ', or all',
    parse: parseTargets,
    fallback: TARGETS.slice(),
  },
  {
    key: 'primary',
    custom: true,
    ask: 'Primary brand colour (#rrggbb)',
    parse: (v) => hex(v, 'primary'),
    fallback: neonColour('renk-1', '#5aa8ff'),
  },
  {
    key: 'secondary',
    custom: true,
    ask: 'Secondary brand colour (#rrggbb)',
    parse: (v) => hex(v, 'secondary'),
    fallback: neonColour('renk-2', '#c82ee0'),
  },
  {
    key: 'tertiary',
    custom: true,
    ask: 'Tertiary brand colour (#rrggbb)',
    parse: (v) => hex(v, 'tertiary'),
    fallback: neonColour('renk-3', '#9455ea'),
  },
  {
    key: 'surface',
    custom: true,
    ask: 'Surface colour, the base every contrast is measured against (#rrggbb)',
    parse: (v) => hex(v, 'surface'),
    fallback: neonColour('surface', '#101115'),
  },
  {
    key: 'dark',
    custom: true,
    ask: 'Is the surface dark? (yes/no)',
    parse: (v) => bool(v, true),
    fallback: true,
  },
  {
    key: 'signature',
    ask: 'Show the signature block? (yes/no)',
    parse: (v) => bool(v, true),
    fallback: true,
  },
  {
    key: 'note',
    ask: 'A rule of your own that wins over the template, or blank',
    parse: (v) => String(v).trim(),
    fallback: '',
  },
];

function questionsFor(template) {
  return QUESTIONS.filter((q) => !q.custom || template === 'custom');
}

function rgb(value) {
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
  };
}

function hexOf(c) {
  const b = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + b(c.r) + b(c.g) + b(c.b);
}

function mix(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

function luminance(c) {
  const ch = (n) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function textCut(colour, surface, dark) {
  const target = dark ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const base = rgb(colour);
  const ground = rgb(surface);
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const c = mix(base, target, t);
    if (contrast(c, ground) >= 7) return hexOf(c);
  }
  return hexOf(target);
}

function tokenColour(T, name, trail) {
  const seen = trail || [];
  if (seen.includes(name)) return null;
  for (const group of ['brand', 'role', 'derived']) {
    const e = T[group] && T[group][name];
    if (!e) continue;
    const base = e.value !== undefined ? K.parse(e.value) : e.ref ? tokenColour(T, e.ref, seen.concat(name)) : null;
    if (!base) return null;
    return e.alpha !== undefined ? { r: base.r, g: base.g, b: base.b, a: e.alpha } : base;
  }
  return null;
}

function fillColour(T, name) {
  const tone = T.derived && T.derived['tone-scale'];
  const m = /^(.+)-(\d+)$/.exec(name);
  if (m && tone && tone.bases.includes(m[1]) && tone.steps.includes(Number(m[2]))) {
    const c = tokenColour(T, m[1]);
    return c ? { r: c.r, g: c.g, b: c.b, a: Number(m[2]) / 100 } : null;
  }
  return tokenColour(T, name);
}

function measureOnPairs(T) {
  if (!T.on) return;
  const g = tokenColour(T, 'surface');
  if (!g) return;
  const ground = { r: g.r, g: g.g, b: g.b, a: 1 };
  for (const name of Object.keys(T.on)) {
    if (name === '_') continue;
    const fill = fillColour(T, name);
    if (!fill) continue;
    let best = null;
    for (const on of ['black', 'text', 'surface']) {
      const c = tokenColour(T, on);
      if (!c) continue;
      const r = K.pair(fill, c, ground).ratio;
      if (!best || r > best.r) best = { on, r };
    }
    if (!best) continue;
    const label = name.replace(/-(\d+)$/, ' $1%') + (fill.a < 1 ? ' over surface' : '');
    T.on[name] =
      best.r >= K.THRESHOLD
        ? { on: best.on, rationale: best.on + ' on ' + label + ': ' + best.r.toFixed(2) + ':1.' }
        : {
            on: null,
            rationale:
              'Carries no text: the best pair, ' + best.on + ' on ' + label + ', is ' + best.r.toFixed(2) + ':1, below ' + K.THRESHOLD + ':1.',
          };
  }
}

function buildTokens(palette, name) {
  const neon = read(templateFile('neon'));
  if (!neon) throw new Error('neon template not found; cannot derive a custom one');
  const T = JSON.parse(JSON.stringify(neon));
  const dark = palette.dark !== false;
  const surface = palette.surface;
  const ground = rgb(surface);
  const extreme = dark ? neon.brand.black.value : '#ffffff';
  const body = contrast({ r: 255, g: 255, b: 255 }, ground) >= contrast({ r: 0, g: 0, b: 0 }, ground)
    ? neon.role.text.value
    : neon.brand.black.value;

  T._ = [
    'Generated by setup.js from a custom palette. Same schema as the neon template.',
    'Brand and surface values come from the user; text cuts and glass base are derived.',
  ];
  T.meta = { name: name, dark: dark, rationale: 'Custom template written by setup.js.' };

  const set = (group, key, value, why) => {
    if (!T[group][key]) T[group][key] = {};
    T[group][key].value = value;
    T[group][key].rationale = why;
  };

  set('brand', 'renk-1', palette.primary, 'Primary brand colour: primary fill, heading, label, focus ring.');
  set('brand', 'renk-2', palette.secondary, 'Secondary brand colour, fill cut.');
  set('brand', 'renk-3', palette.tertiary, 'Tertiary brand colour: decoration, scrollbar, ghost button.');
  set('brand', 'surface', surface, 'Surface base; every contrast is measured against it.');
  set('brand', 'black', extreme, 'Opening end of the background gradient.');
  set(
    'brand',
    'renk-2-text',
    textCut(palette.secondary, surface, dark),
    'Text cut of the secondary colour, lifted to 7:1 on the surface.'
  );
  set(
    'brand',
    'renk-3-text',
    textCut(palette.tertiary, surface, dark),
    'Text cut of the tertiary colour, lifted to 7:1 on the surface.'
  );
  set(
    'brand',
    'glass-base',
    hexOf(mix(ground, rgb(palette.tertiary), 0.02)),
    'Glass surface base: the surface nudged 2% toward the tertiary colour.'
  );
  set('role', 'text', body, 'Body text; the higher contrast of black and white on this surface.');
  measureOnPairs(T);

  return T;
}

function tokenScale(tokensFile) {
  const T = read(tokensFile);
  const steps = ['fs-1', 'fs-2', 'fs-3', 'fs-4', 'fs-5'].map((k) => T && T.size && T.size[k] && T.size[k].value);
  if (steps.some((v) => typeof v !== 'number')) throw new Error('token file has no size.fs-1..fs-5: ' + tokensFile);
  return steps;
}

function csprojFiles(dir, depth, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile() && /\.csproj$/i.test(e.name)) out.push(full);
    else if (e.isDirectory() && depth < 4 && !SKIP_PROJECT_DIR.test(e.name)) csprojFiles(full, depth + 1, out);
  }
  return out;
}

function appProject(root, target) {
  const given = flag('app');
  const list = given && given !== 'true' ? [path.resolve(root, given)] : csprojFiles(root, 0, []);
  const fits = (text) =>
    target === 'avalonia'
      ? /Include="Avalonia(\.Desktop)?"/.test(text)
      : /<UseWPF>\s*true\s*<\/UseWPF>/i.test(text);
  const found = [];
  for (const file of list) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!fits(text)) continue;
    if (/<IsTestProject>\s*true|Include="xunit|Include="Avalonia\.Headless/i.test(text)) continue;
    const exe = /<OutputType>\s*(Win)?Exe\s*<\/OutputType>/i.test(text);
    const asm = /<AssemblyName>\s*([^<\s]+)\s*<\/AssemblyName>/.exec(text);
    found.push({ file, text, exe, assembly: asm ? asm[1] : path.basename(file, path.extname(file)) });
  }
  found.sort((a, b) => Number(b.exe) - Number(a.exe));
  return found[0] || null;
}

function fontUri(target, assembly, chain) {
  const rest = chain.slice(1).join(', ');
  const head =
    target === 'avalonia'
      ? 'avares://' + assembly + '/Assets/Fonts#' + FONT_FAMILY
      : '/' + assembly + ';component/Assets/Fonts/#' + FONT_FAMILY;
  return rest ? head + ', ' + rest : head;
}

function pointFontSans(themeFile, target, assembly) {
  let text;
  try {
    text = fs.readFileSync(themeFile, 'utf8');
  } catch {
    return false;
  }
  const re = /(<FontFamily x:Key="FontSans">)([^<]*)(<\/FontFamily>)/;
  const m = re.exec(text);
  if (!m) return false;
  const chain = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  if (chain[0] !== FONT_FAMILY) return false;
  fs.writeFileSync(themeFile, text.replace(re, (all, a, v, b) => a + fontUri(target, assembly, chain) + b), 'utf8');
  return true;
}

function addFontResource(app, target) {
  const covered =
    target === 'avalonia'
      ? /<AvaloniaResource\s+Include="Assets[\\/](\*\*|Fonts)/i.test(app.text)
      : /<Resource\s+Include="Assets[\\/](\*\*|Fonts)/i.test(app.text);
  if (covered || !/<\/Project>\s*$/.test(app.text)) return false;
  const item = target === 'avalonia' ? '<AvaloniaResource Include="Assets\\Fonts\\**" />' : '<Resource Include="Assets\\Fonts\\*.ttf" />';
  const eol = app.text.includes('\r\n') ? '\r\n' : '\n';
  const text = app.text.replace(/<\/Project>\s*$/, '  <ItemGroup>' + eol + '    ' + item + eol + '  </ItemGroup>' + eol + '</Project>' + eol);
  fs.writeFileSync(app.file, text, 'utf8');
  return true;
}

function embedFont(root, target, outDir, force) {
  const app = appProject(root, target);
  if (!app) return '  font     no ' + target + ' app .csproj found; ' + FONT_FAMILY + ' is not embedded (pass --app <csproj>)';
  const fonts = path.join(path.dirname(app.file), 'Assets', 'Fonts');
  const r = copyInto(path.join(pluginDir(), 'fonts'), fonts, FONT_FILES, force);
  const pointed = pointFontSans(path.join(outDir, THEME_FILE[target]), target, app.assembly);
  const added = addFontResource(app, target);
  return (
    '  font     ' +
    fonts +
    '  (' +
    r.written.length +
    ' written' +
    (r.skipped.length ? ', ' + r.skipped.length + ' kept' : '') +
    (pointed ? ', FontSans -> ' + (target === 'avalonia' ? 'avares' : 'component') + ' URI' : '') +
    (added ? ', font resource added to ' + path.basename(app.file) : '') +
    ')'
  );
}

const TRANSFORM_ANIMATOR_REG = /RegisterCustomAnimator\s*<\s*ITransform\s*,/;
const INITIALIZE_RE = /(public\s+override\s+void\s+Initialize\s*\(\s*\)\s*\r?\n?\s*\{)(\r\n|\n)/;

function findAppCodeBehind(app) {
  const dir = path.dirname(app.file);
  for (const name of ['App.axaml.cs', 'App.xaml.cs']) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return { file: p, dir };
  }
  return null;
}

function rootNamespace(app) {
  const m = /<RootNamespace>\s*([^<\s]+)\s*<\/RootNamespace>/.exec(app.text);
  return (m && m[1]) || app.assembly;
}

function transformAnimatorSource(ns) {
  return [
    'using Avalonia.Animation;',
    'using Avalonia.Media.Transformation;',
    '',
    'namespace ' + ns + ';',
    '',
    'public sealed class TransformAnimator : InterpolatingAnimator<ITransform>',
    '{',
    '    public override ITransform Interpolate(double progress, ITransform oldValue, ITransform newValue) =>',
    '        TransformOperations.Interpolate(oldValue as TransformOperations ?? TransformOperations.Identity,',
    '            newValue as TransformOperations ?? TransformOperations.Identity, progress);',
    '}',
    '',
  ].join('\n');
}

function ensureUsing(text, name) {
  const re = new RegExp('^using\\s+' + name.replace(/\./g, '\\.') + '\\s*;\\s*$', 'm');
  if (re.test(text)) return text;
  const block = /^(using[^\n]*\r?\n)+/.exec(text);
  if (block) return text.slice(0, block[0].length) + 'using ' + name + ';\r\n' + text.slice(block[0].length);
  return 'using ' + name + ';\r\n' + text;
}

function installAnimator(root, target, outDir, force) {
  if (target !== 'avalonia') return null;
  const themeFile = path.join(outDir, THEME_FILE[target]);
  let themeText;
  try {
    themeText = fs.readFileSync(themeFile, 'utf8');
  } catch {
    return null;
  }
  if (!/<Style\s+Selector="Window\.anim\b/.test(themeText)) return null;

  const app = appProject(root, target);
  if (!app) return '  animator no ' + target + ' app .csproj found; register Animation.RegisterCustomAnimator<ITransform, TransformAnimator>() by hand (pass --app <csproj>)';

  const found = findAppCodeBehind(app);
  if (!found)
    return '  animator no App.axaml.cs found next to ' + app.file + '; register Animation.RegisterCustomAnimator<ITransform, TransformAnimator>() in Initialize() by hand';

  let text;
  try {
    text = fs.readFileSync(found.file, 'utf8');
  } catch (e) {
    return '  animator could not read ' + found.file + ': ' + e.message;
  }

  if (TRANSFORM_ANIMATOR_REG.test(text)) return '  animator already registered in ' + found.file;

  const animatorFile = path.join(found.dir, 'TransformAnimator.cs');
  let wroteAnimator = true;
  if (fs.existsSync(animatorFile) && !force) {
    wroteAnimator = false;
  } else {
    fs.writeFileSync(animatorFile, transformAnimatorSource(rootNamespace(app)), 'utf8');
  }

  if (!INITIALIZE_RE.test(text))
    return (
      '  animator ' +
      animatorFile +
      (wroteAnimator ? ' written' : ' kept') +
      ', but Initialize() was not found in ' +
      found.file +
      '; add `Animation.RegisterCustomAnimator<ITransform, TransformAnimator>();` as its first line by hand'
    );

  text = ensureUsing(text, 'Avalonia.Animation');
  text = ensureUsing(text, 'Avalonia.Media.Transformation');
  text = text.replace(
    INITIALIZE_RE,
    (all, head, eol) => head + eol + '        Animation.RegisterCustomAnimator<ITransform, TransformAnimator>();' + eol
  );
  fs.writeFileSync(found.file, text, 'utf8');

  return '  animator ' + found.file + ' (registration added, ' + animatorFile + (wroteAnimator ? ' written' : ' kept') + ')';
}

function copyInto(fromDir, toDir, names, force) {
  const written = [];
  const skipped = [];
  const missing = [];
  fs.mkdirSync(toDir, { recursive: true });
  for (const name of names) {
    const src = path.join(fromDir, name);
    if (!fs.existsSync(src)) {
      missing.push(name);
      continue;
    }
    const dest = path.join(toDir, SAMPLES[name] || name);
    if (fs.existsSync(dest) && !force) {
      skipped.push(dest);
      continue;
    }
    fs.copyFileSync(src, dest);
    written.push(dest);
  }
  return { written, skipped, missing };
}

function generate(tokensFile, outDir) {
  const gen = generatorFile();
  if (!gen) throw new Error('no generator found; expected scripts/generate.js');
  fs.mkdirSync(outDir, { recursive: true });
  const r = spawnSync(process.execPath, [gen.file, tokensFile, outDir], { encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) {
    throw new Error('generator failed: ' + String(r.stderr || r.stdout || '').trim());
  }
  return outDir;
}

function resolveConfig(root) {
  const project = read(configFile(root));
  const machine = read(machineFile());
  if (!project && !machine) return { config: null, from: null };
  const merged = Object.assign({}, machine || {}, project || {});
  return { config: merged, from: project ? configFile(root) : machineFile() };
}

function installed(root, targets) {
  const state = {};
  for (const t of targets || TARGETS) {
    const dir = path.join(outRoot(root), t);
    state[t] = ARTIFACTS[t].filter((n) => fs.existsSync(path.join(dir, n)));
  }
  return state;
}

function inspect() {
  const root = projectRoot();
  const { config, from } = resolveConfig(root);
  const template = flag('template') || (config && config.template) || null;
  const answered = [];
  const missing = [];
  for (const q of questionsFor(template || 'neon')) {
    const known = flag(q.key) !== null || (config && config[q.key] !== undefined);
    const inPalette = q.custom && config && config.palette && config.palette[q.key] !== undefined;
    if (known || inPalette) answered.push(q.key);
    else missing.push({ flag: '--' + q.key, ask: q.ask });
  }
  const gen = generatorFile();
  return {
    version: VERSION,
    project: root,
    configFile: configFile(root),
    machineFile: machineFile(),
    configuredFrom: from,
    configured: !!config,
    off: !!(config && config.off),
    template: template,
    templates: fs.existsSync(path.join(pluginDir(), 'templates'))
      ? fs
          .readdirSync(path.join(pluginDir(), 'templates'))
          .filter((f) => f.endsWith('.tokens.json'))
          .map((f) => f.replace('.tokens.json', ''))
      : [],
    generator: gen ? gen.file : null,
    targets: (config && config.targets) || null,
    installed: installed(root, (config && config.targets) || TARGETS),
    answered,
    missing,
    config: config,
  };
}

function apply(answers) {
  const root = projectRoot();
  const force = has('force');
  const prev = read(configFile(root)) || {};
  const template = answers.template || prev.template || 'neon';
  const qs = questionsFor(template);

  const cfg = Object.assign({}, prev);
  cfg.version = VERSION;
  cfg.template = template;
  cfg.off = false;
  cfg.targets = answers.targets || prev.targets || TARGETS.slice();
  cfg.typography = prev.typography || {
    sans: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, sans-serif",
    mono: "'Cascadia Mono', Consolas, ui-monospace, monospace",
  };
  if (flag('sans')) cfg.typography.sans = flag('sans');
  if (flag('mono')) cfg.typography.mono = flag('mono');
  cfg.signature = prev.signature || {
    off: false,
    text: 'by Teknesyum',
    github: 'https://github.com/Teknesyum',
    sponsor: 'https://github.com/sponsors/Teknesyum',
    supportText: 'Buy me a coffee',
  };
  if (answers.signature !== undefined) cfg.signature.off = answers.signature === false;
  if (answers.note !== undefined && answers.note !== '') cfg.note = answers.note;
  if (cfg.note === undefined) cfg.note = '';

  const palette = Object.assign({}, prev.palette || {});
  for (const q of qs) {
    if (!q.custom) continue;
    palette[q.key] = answers[q.key] !== undefined ? answers[q.key] : palette[q.key] !== undefined ? palette[q.key] : q.fallback;
  }

  const out = outRoot(root);
  let tokensFile;
  if (template === 'custom') {
    tokensFile = path.join(out, 'theme.tokens.json');
    if (!fs.existsSync(tokensFile) || force || answers.primary) {
      write(tokensFile, buildTokens(palette, 'custom'));
    }
    cfg.palette = palette;
  } else {
    tokensFile = templateFile('neon');
    if (!tokensFile) throw new Error('neon template not found under ' + path.join(pluginDir(), 'templates'));
    const neon = read(tokensFile);
    cfg.palette = {
      primary: neon.brand['renk-1'].value,
      secondary: neon.brand['renk-2'].value,
      tertiary: neon.brand['renk-3'].value,
      surface: neon.brand.surface.value,
      dark: neon.meta.dark !== false,
    };
    const copy = path.join(out, 'theme.tokens.json');
    if (!fs.existsSync(copy) || force) {
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(tokensFile, copy);
    }
  }

  cfg.typography.scale = tokenScale(tokensFile);

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'teknesyum-ui-'));
  const lines = [];
  let wrote = 0;
  let skipped = 0;
  try {
    generate(tokensFile, stage);
    const assets = path.join(pluginDir(), 'skills', 'teknesyum-ui', 'assets');
    for (const t of cfg.targets) {
      const dir = path.join(out, t);
      const names = ARTIFACTS[t];
      const generated = names.filter((n) => fs.existsSync(path.join(stage, n)));
      const staticOnes = names.filter((n) => !generated.includes(n));
      const a = copyInto(stage, dir, generated, force);
      const b = copyInto(assets, dir, staticOnes, force);
      wrote += a.written.length + b.written.length;
      skipped += a.skipped.length + b.skipped.length;
      const gone = a.missing.concat(b.missing);
      lines.push(
        '  ' +
          t.padEnd(9) +
          dir +
          '  (' +
          (a.written.length + b.written.length) +
          ' written' +
          (a.skipped.length + b.skipped.length ? ', ' + (a.skipped.length + b.skipped.length) + ' kept' : '') +
          (gone.length ? ', missing ' + gone.join(' ') : '') +
          ')'
      );
      if (THEME_FILE[t]) lines.push(embedFont(root, t, dir, force));
      if (t === 'avalonia') {
        const animatorMsg = installAnimator(root, t, dir, force);
        if (animatorMsg) lines.push(animatorMsg);
      }
    }
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }

  cfg.installedAt = cfg.installedAt || new Date().toISOString();
  write(configFile(root), cfg);

  return [
    'Teknesyum UI is set up.',
    '',
    '  config     ' + configFile(root),
    '  template   ' + cfg.template,
    '  tokens     ' + tokensFile,
    '  signature  ' + (cfg.signature.off ? 'off' : 'on'),
    '',
    lines.join('\n'),
    '',
    wrote + ' file(s) written, ' + skipped + ' kept. Existing files are never overwritten without --force.',
  ].join('\n');
}

function setOff(value) {
  const root = projectRoot();
  const cfg = read(configFile(root)) || { version: VERSION, template: 'neon', targets: [] };
  cfg.off = value;
  write(configFile(root), cfg);
  return 'Interface standard is ' + (value ? 'off' : 'on') + ' for ' + root + '.';
}

function status() {
  const root = projectRoot();
  const { config, from } = resolveConfig(root);
  if (!config) {
    return [
      'Interface standard is not installed for ' + root + '.',
      '',
      '  node setup.js --apply --template neon    take the shipped standard',
      '  node setup.js --apply --template custom  give your own colours',
    ].join('\n');
  }
  const state = installed(root, config.targets || TARGETS);
  return [
    'Teknesyum UI ' + (config.off ? 'off' : 'on') + '  (' + from + ')',
    '',
    '  template   ' + (config.template || 'neon'),
    '  palette    ' +
      [config.palette && config.palette.primary, config.palette && config.palette.secondary, config.palette && config.palette.tertiary]
        .filter(Boolean)
        .join(' ') +
      '  on ' +
      ((config.palette && config.palette.surface) || '?'),
    '  typography ' + ((config.typography && config.typography.sans) || '?'),
    '  signature  ' + (config.signature && config.signature.off ? 'off' : 'on'),
    '  targets    ' + (config.targets || []).map((t) => t + ' (' + state[t].length + ')').join('  '),
    '  note       ' + (config.note ? config.note : '-'),
  ].join('\n');
}

function help() {
  return [
    'setup.js — install, inspect or turn off the Teknesyum UI standard for a project.',
    'It writes <project>/.claude/teknesyum-ui.json and generates theme artifacts into',
    '<project>/teknesyum-ui/<target>/.',
    '',
    'Modes   --check  --apply  --status  --off  --on  --help',
    'Flags   --project <dir>  --template neon|custom  --targets ' + TARGETS.join(',') ,
    '        --primary --secondary --tertiary --surface --dark   (custom only)',
    '        --sans --mono --signature yes|no --note <text>  --force',
    '        --app <csproj>   app project that receives Assets/Fonts (default: found under --project)',
    '',
    'Examples',
    '  node setup.js --apply --template neon --targets css,react --project .',
    '  node setup.js --apply --template custom --primary ' + neonColour('renk-1') + ' --secondary ' + neonColour('renk-2') + ' \\',
    '    --tertiary ' + neonColour('renk-3') + ' --surface ' + neonColour('surface') + ' --dark yes',
  ].join('\n');
}

function interactive() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answers = {};
  process.stdout.write('Teknesyum UI setup — ' + projectRoot() + '\n\n');

  let list = questionsFor('neon');
  let i = 0;
  const next = () => {
    if (i >= list.length) {
      rl.close();
      process.stdout.write('\n' + apply(answers) + '\n');
      return;
    }
    const q = list[i++];
    rl.question('  ' + q.ask + '\n  > ', (v) => {
      try {
        answers[q.key] = String(v).trim() ? q.parse(v) : q.fallback;
      } catch (e) {
        process.stdout.write('  ' + e.message + '\n\n');
        i--;
        return next();
      }
      if (q.key === 'template') list = questionsFor(answers.template);
      process.stdout.write('\n');
      next();
    });
  };
  next();
}

function collect() {
  const template = flag('template') || 'neon';
  const answers = {};
  for (const q of questionsFor(template)) {
    const v = flag(q.key);
    if (v !== null) answers[q.key] = q.parse(v);
  }
  return answers;
}

function main() {
  try {
    if (has('help') || argv.includes('-h')) {
      process.stdout.write(help() + '\n');
      return;
    }
    if (has('check')) {
      process.stdout.write(JSON.stringify(inspect(), null, 2) + '\n');
      return;
    }
    if (has('status')) {
      process.stdout.write(status() + '\n');
      return;
    }
    if (has('off')) {
      process.stdout.write(setOff(true) + '\n');
      return;
    }
    if (has('on')) {
      process.stdout.write(setOff(false) + '\n');
      return;
    }
    if (has('apply')) {
      process.stdout.write(apply(collect()) + '\n');
      return;
    }
    if (process.stdin.isTTY) return interactive();
    process.stdout.write(
      [
        'No TTY, so nothing was asked.',
        '',
        'Run `node setup.js --check` for the JSON of what is missing, ask the user those',
        'questions in one message, then call `node setup.js --apply` with the flags.',
        '',
        'See `node setup.js --help` for the flags.',
      ].join('\n') + '\n'
    );
  } catch (e) {
    process.stderr.write('setup: ' + e.message + '\n');
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { inspect, apply, status, QUESTIONS, TARGETS };
