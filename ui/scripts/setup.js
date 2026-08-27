#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

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
    fallback: '#00f3ff',
  },
  {
    key: 'secondary',
    custom: true,
    ask: 'Secondary brand colour (#rrggbb)',
    parse: (v) => hex(v, 'secondary'),
    fallback: '#ff00ea',
  },
  {
    key: 'tertiary',
    custom: true,
    ask: 'Tertiary brand colour (#rrggbb)',
    parse: (v) => hex(v, 'tertiary'),
    fallback: '#b026ff',
  },
  {
    key: 'surface',
    custom: true,
    ask: 'Surface colour, the base every contrast is measured against (#rrggbb)',
    parse: (v) => hex(v, 'surface'),
    fallback: '#08090a',
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

function buildTokens(palette, name) {
  const neon = read(templateFile('neon'));
  if (!neon) throw new Error('neon template not found; cannot derive a custom one');
  const T = JSON.parse(JSON.stringify(neon));
  const dark = palette.dark !== false;
  const surface = palette.surface;
  const ground = rgb(surface);
  const extreme = dark ? '#000000' : '#ffffff';
  const body = contrast({ r: 255, g: 255, b: 255 }, ground) >= contrast({ r: 0, g: 0, b: 0 }, ground)
    ? '#ffffff'
    : '#000000';

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

  set('brand', 'blue', palette.primary, 'Primary brand colour: primary fill, heading, label, focus ring.');
  set('brand', 'pink', palette.secondary, 'Secondary brand colour, fill cut.');
  set('brand', 'purple', palette.tertiary, 'Tertiary brand colour: decoration, scrollbar, ghost button.');
  set('brand', 'surface', surface, 'Surface base; every contrast is measured against it.');
  set('brand', 'black', extreme, 'Opening end of the background gradient.');
  set(
    'brand',
    'pink-text',
    textCut(palette.secondary, surface, dark),
    'Text cut of the secondary colour, lifted to 7:1 on the surface.'
  );
  set(
    'brand',
    'purple-text',
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

  return T;
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
    const dest = path.join(toDir, name);
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
    scale: [10, 13, 14, 18, 24],
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
      primary: neon.brand.blue.value,
      secondary: neon.brand.pink.value,
      tertiary: neon.brand.purple.value,
      surface: neon.brand.surface.value,
      dark: neon.meta.dark !== false,
    };
    const copy = path.join(out, 'theme.tokens.json');
    if (!fs.existsSync(copy) || force) {
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(tokensFile, copy);
    }
  }

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
    '',
    'Examples',
    '  node setup.js --apply --template neon --targets css,react --project .',
    '  node setup.js --apply --template custom --primary #00f3ff --secondary #ff00ea \\',
    '    --tertiary #b026ff --surface #08090a --dark yes',
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
