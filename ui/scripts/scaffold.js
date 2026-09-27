#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raf = require('./raf');

const TEMPLATES = path.resolve(__dirname, '..', 'templates');
const BOM = '﻿';
const SAFE = /^[^"`$\r\n]*$/;
const ASCII = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

const HELP = [
  'Usage: node scaffold.js <target> [options] [--project <dir>]',
  '',
  '  kur <AppName>   Kur.bat + kur-<name>.ps1 into the project root; colours and sizes',
  '                  come from teknesyum-ui/theme.tokens.json (plugin default when absent)',
  '      --kaynak releases|ssh|yerel  source (default ssh; ssh is the private-repo exception)',
  '      releases: latest GitHub release, <asset> + <asset>.sha256, no admin',
  '        --depo <owner/repo>  repository (default: origin)',
  '        --varlik <asset.zip> release asset to install (required)',
  '        --exe <file.exe>     program inside the zip (default <AppName>.exe)',
  '      ssh: clone over a USB deploy key',
  '        --depo <url>         git remote (default: origin, as ssh)',
  '        --anahtar <name>     deploy key file under .kurulum\\anahtar (default usb-01)',
  '      --simge <path>      icon, relative to the script (default simge.ico)',
  '      --altbaslik <text>  subtitle under the title',
  '      yerel: files already unpacked beside the script (e.g. by Teknesyum Base); target is',
  '        that folder, no Değiştir; --adimlar required, step names read from its Adim calls',
  '        --exe <file>         file that must be present (optional)',
  '      --adimlar <file>    project steps fragment (default templates/kur/adimlar[-releases].ps1)',
  '      run: KUR_PROVA=1 temp target, no shortcut · KUR_OTOMATIK=1 no window, exit code',
  '           KUR_KOK=<dir> fake root for target, shortcuts, log · KUR_SONUC=<file> result JSON',
  '           KUR_API=<url> releases API base for tests (default https://api.github.com)',
  '      --avalonia          also the KurulumEkrani install screen into teknesyum-ui/kur',
  '      --ns <Namespace>    its C# namespace (default: the app name)',
  '  ustcubuk [<Namespace>]  title bar into teknesyum-ui/ustcubuk',
  '      --avalonia | --react  flavour (default: avalonia when the project has .axaml);',
  '                            Avalonia: TitleBar + KabukStilleri, needs the namespace',
  '  durum [<Namespace>]     update badge and panel into teknesyum-ui/durum',
  '      --avalonia | --electron | --react  flavour (default as above); Avalonia: GuncellemePaneli',
  '  denetim <Namespace>  headless contrast and shell tests into teknesyum-ui/denetim',
  '      --wpf | --avalonia  test flavour (default: avalonia when the project has .axaml)',
  '      --pencere <Class>   window to open (default MainWindow)',
  '      --esik <ratio>      threshold (default 7)',
  '',
  'An existing file is never overwritten.',
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

function template(rel) {
  return fs.readFileSync(path.join(TEMPLATES, rel), 'utf8').replace(/^﻿/, '');
}

function slug(name) {
  return name
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ASCII[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sshRemote(root) {
  const r = spawnSync('git', ['-C', root, 'remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000,
  });
  const url = r.status === 0 ? String(r.stdout).trim() : '';
  const https = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url);
  if (https) return 'git@github.com:' + https[1] + '/' + https[2] + '.git';
  return url || null;
}

function fill(text, values) {
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (all, key) => (key in values ? values[key] : all));
}

function originRepo(root) {
  const r = spawnSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  const url = r.status === 0 ? String(r.stdout).trim() : '';
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url);
  return m ? m[1] + '/' + m[2] : null;
}

function kurTokens(root) {
  const own = path.join(root, 'teknesyum-ui', 'theme.tokens.json');
  const file = fs.existsSync(own) ? own : path.join(__dirname, '..', 'skills', 'teknesyum-ui', 'assets', 'theme.tokens.json');
  const T = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  const find = (n) => {
    for (const g of ['brand', 'role', 'derived']) if (T[g] && T[g][n]) return T[g][n];
    throw new Error('unknown token in ' + file + ': ' + n);
  };
  const res = (n, trail = []) => {
    if (trail.includes(n)) throw new Error('ref cycle: ' + trail.concat(n).join(' -> '));
    const t = find(n);
    if (t.value !== undefined) return { hex: t.value.toLowerCase(), a: t.alpha !== undefined ? t.alpha : 1 };
    const b = res(t.ref, trail.concat(n));
    return { hex: b.hex, a: t.alpha !== undefined ? t.alpha : b.a };
  };
  const hex = (n) => res(n).hex;
  const num = (g, k) => {
    const t = T[g] && T[g][k];
    if (!t) throw new Error('unknown token in ' + file + ': ' + g + '.' + k);
    if (t.ref) return num(...t.ref.split('.'));
    return t.value;
  };
  const tone = (v) => {
    if (!T.derived['tone-scale'].steps.includes(v)) throw new Error('tone-scale has no ' + v + ' step');
    return v / 100;
  };
  const edge = T.shape['window-edge'] && T.shape['window-edge'].ref;
  const bare = !edge || edge === 'none';
  const label = (T.label && T.label.brand) || {};
  const links = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'skills', 'teknesyum-ui', 'assets', 'links.json'), 'utf8'));
  return {
    RENK_ZEMIN: hex('surface'),
    RENK_METIN: hex('text'),
    RENK_ETIKET: hex('text-label'),
    RENK_1: hex('renk-1'),
    RENK_2: hex('renk-2'),
    RENK_3: hex('renk-3'),
    RENK_VURGU: hex('renk-2-text'),
    RENK_BASARI: hex('success'),
    RENK_TEHLIKE: hex('danger-text'),
    RENK_EDILGEN: hex('disabled'),
    RENK_USTU_TEHLIKE: hex(T.on['danger-text'].on),
    RENK_MARKA: hex(label.ref || 'renk-1'),
    RENK_IZ: hex('border-decorative'),
    IZ_ALFA: String(res('border-decorative').a),
    TON_10: String(tone(10)),
    TON_20: String(tone(20)),
    TON_30: String(tone(30)),
    TON_50: String(tone(50)),
    TON_60: String(tone(60)),
    PENCERE_KENARI: bare ? '' : hex(edge),
    PENCERE_ALFA: bare ? '1' : String(res(edge).a),
    FS_1: String(num('size', 'fs-1')),
    FS_3: String(num('size', 'fs-3')),
    SATIR_GOVDE: String(Math.round(num('size', 'fs-1') * num('size', 'lh-body'))),
    SATIR_MONO: String(Math.round(num('size', 'fs-1') * num('size', 'lh-mono'))),
    BOSLUK_1: String(num('space', '1')),
    BOSLUK_2: String(num('space', '2')),
    BOSLUK_3: String(num('space', '3')),
    BOSLUK_4: String(num('space', '4')),
    BOSLUK_5: String(num('space', '5')),
    CUBUK_H: String(num('metric', 'titlebar-h-min')),
    KONTROL_W: String(num('metric', 'titlebar-h-max')),
    IKON_1: String(num('metric', 'icon-1')),
    IKON_3: String(num('metric', 'icon-3')),
    HEDEF_MIN: String(num('metric', 'target-min')),
    DUGME_PX: String(num('metric', 'btn-px')),
    KOSE: String(num('shape', 'r')),
    KENAR_W: String(num('shape', 'border-w')),
    PENCERE_W: String(num('metric', 'installer-w')),
    PENCERE_H: String(num('metric', 'installer-h')),
    MARKA: label.tr || '',
    MARKA_ADRES: links.github || '',
    YAZI_SANS: T.font.sans.chain.join(','),
    YAZI_MONO: T.font.mono.chain.join(','),
  };
}

function kur(root, args, name) {
  if (!name) throw new Error('kur needs an application name');
  const file = slug(name);
  if (!file) throw new Error('application name has no usable letters: ' + name);
  const kaynak = flag(args, 'kaynak') || 'ssh';
  if (kaynak !== 'releases' && kaynak !== 'ssh' && kaynak !== 'yerel') throw new Error('--kaynak is releases, ssh or yerel, not ' + kaynak);
  const releases = kaynak === 'releases';
  const yerel = kaynak === 'yerel';
  const values = {
    AD: name,
    ALTBASLIK: flag(args, 'altbaslik') || '',
    SIMGE: (flag(args, 'simge') || 'simge.ico').replace(/\//g, '\\'),
    BETIK: 'kur-' + file + '.ps1',
  };
  if (releases) {
    values.DEPO = flag(args, 'depo') || originRepo(root) || '';
    if (!/^[\w.-]+\/[\w.-]+$/.test(values.DEPO)) throw new Error('--kaynak releases needs --depo owner/repo');
    values.VARLIK = flag(args, 'varlik') || '';
    if (!/^[^\\/]+\.zip$/i.test(values.VARLIK)) throw new Error('--kaynak releases needs --varlik <asset.zip>');
    values.EXE = flag(args, 'exe') || name.replace(/\s+/g, '') + '.exe';
    values.ANAHTAR = '';
  } else if (yerel) {
    values.DEPO = '';
    values.VARLIK = '';
    values.EXE = flag(args, 'exe') || '';
    values.ANAHTAR = '';
  } else {
    values.DEPO = flag(args, 'depo') || sshRemote(root) || 'git@github.com:Teknesyum/' + name + '.git';
    values.ANAHTAR = flag(args, 'anahtar') || 'usb-01';
    values.VARLIK = '';
    values.EXE = '';
  }
  for (const [key, value] of Object.entries(values))
    if (!SAFE.test(value)) throw new Error(key.toLowerCase() + ' may not contain " ` $ or a newline');
  Object.assign(values, kurTokens(root));
  const custom = flag(args, 'adimlar');
  if (yerel && !custom) throw new Error('--kaynak yerel needs --adimlar <file> with the project steps');
  const steps = (custom
    ? fs.readFileSync(path.resolve(custom), 'utf8').replace(/^﻿/, '')
    : template(releases ? 'kur/adimlar-releases.ps1' : 'kur/adimlar.ps1')
  ).replace(/\s+$/, '');
  let [ayar, is] = template('kur/kaynak-' + kaynak + '.ps1').split(/^#-- is\r?\n/m);
  if (yerel) {
    const names = [['Dosyalar denetleniyor', 0]];
    for (const m of steps.matchAll(/^[ \t]*Adim[ \t]+(\d+)[ \t]+\d+[ \t]+"([^"$`]+)"/gm)) names.push([m[2], Number(m[1])]);
    if (names.length < 2) throw new Error('--adimlar has no Adim <from> <to> "name" step');
    ayar = ayar.replace('{{YEREL_ADIMLAR}}', names.map(([n, y]) => '@("' + n + '", ' + y + ')').join(', '));
  }
  const script = template('kur/kur.ps1')
    .replace(/^\{\{KAYNAK_AYAR\}\}[ \t]*$/m, () => ayar.replace(/\s+$/, ''))
    .replace(/^\{\{KAYNAK_IS\}\}[ \t]*$/m, () => is.replace(/\s+$/, ''))
    .replace(/^[ \t]*\{\{ADIMLAR\}\}[ \t]*$/m, () => steps);
  return [
    { to: path.join(root, 'Kur.bat'), text: fill(template('kur/Kur.bat'), values), crlf: true },
    { to: path.join(root, values.BETIK), text: fill(script, values), crlf: true, bom: true },
  ];
}

function hasAxaml(dir, depth) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase().endsWith('.axaml')) return true;
    if (e.isDirectory() && depth < 4 && !/^(\.|node_modules$|bin$|obj$)/.test(e.name) && hasAxaml(path.join(dir, e.name), depth + 1))
      return true;
  }
  return false;
}

function denetim(root, args, name) {
  if (!name) throw new Error('denetim needs the application namespace, e.g. denetim Runly');
  const ident = /^[A-Za-z_]\w*(\.[A-Za-z_]\w*)*$/;
  const pencere = flag(args, 'pencere') || 'MainWindow';
  if (!ident.test(name)) throw new Error('namespace is not a C# name: ' + name);
  if (!/^[A-Za-z_]\w*$/.test(pencere)) throw new Error('window class is not a C# name: ' + pencere);
  const esik = flag(args, 'esik') || '7';
  if (!/^\d+(\.\d+)?$/.test(esik) || Number(esik) < 1) throw new Error('--esik takes a ratio of 1 or more');
  const kind = args.includes('--wpf') ? 'wpf' : args.includes('--avalonia') ? 'avalonia' : hasAxaml(root, 0) ? 'avalonia' : 'wpf';
  const values = { AD: name, PENCERE: pencere, ESIK: esik.includes('.') ? esik : esik + '.0' };
  const plan = templateFiles('denetim/' + kind).map((n) => ({
    to: path.join(root, 'teknesyum-ui', 'denetim', n),
    text: fill(template('denetim/' + kind + '/' + n), values),
    crlf: true,
  }));
  plan.note = DENETIM_NOTE[kind];
  return plan;
}

const DENETIM_OUTPUT =
  'output: tmp/uc/kontrast-<UC_ETIKET>.txt and ana-<scale>-<UC_ETIKET>.png beside the .sln (UC_CIKTI overrides the folder)';

const DENETIM_NOTE = {
  avalonia: [
    'test project: xunit.v3 - Avalonia.Headless.XUnit does not run on xunit 2',
    '  packages: xunit.v3, xunit.runner.visualstudio 3+, Avalonia.Headless.XUnit and Avalonia.Skia at the app\'s Avalonia version',
    '  OutputType Exe, a ProjectReference to the app, and the file linked in:',
    '  <Compile Include="../../teknesyum-ui/denetim/*.cs" Link="Denetim/%(Filename)%(Extension)" />',
    DENETIM_OUTPUT,
  ].join('\n'),
  wpf: [
    'test project: net*-windows with UseWPF, xunit 2 or xunit.v3, a ProjectReference to the app',
    DENETIM_OUTPUT,
  ].join('\n'),
};

const IDENT = /^[A-Za-z_]\w*(\.[A-Za-z_]\w*)*$/;

function isAvalonia(root, args, other) {
  if (args.includes('--avalonia')) return true;
  if (args.includes('--' + other)) return false;
  return hasAxaml(root, 0);
}

function templateFiles(dir) {
  return fs
    .readdirSync(path.join(TEMPLATES, dir), { withFileTypes: true })
    .filter((e) => e.isFile() && /\.(axaml|cs)$/.test(e.name))
    .map((e) => e.name)
    .sort();
}

function linkNote(target) {
  const dir = '../teknesyum-ui/' + target;
  const lines = [
    'link into the app .csproj (paths relative to it):',
    '  <AvaloniaXaml Include="' + dir + '/*.axaml" Link="Kabuk/%(Filename)%(Extension)" />',
    '  <Compile Include="' + dir + '/*.cs" Link="Kabuk/%(Filename)%(Extension)" />',
  ];
  if (target === 'ustcubuk') lines.push('  App.axaml Styles: <StyleInclude Source="avares://<Assembly>/Kabuk/KabukStilleri.axaml"/>');
  lines.push('hover and press stay inside each button: do not add RenderTransform scale or a negative Margin to these files');
  return lines.join('\n');
}

function avaloniaShell(root, target, ns) {
  if (!ns || !IDENT.test(ns)) throw new Error(target + ' --avalonia needs the application namespace as a C# name, e.g. ' + target + ' Runly');
  const plan = templateFiles(target + '/avalonia').map((n) => ({
    to: path.join(root, 'teknesyum-ui', target, n),
    text: fill(template(target + '/avalonia/' + n), { AD: ns }),
    crlf: true,
  }));
  plan.note = linkNote(target);
  return plan;
}

function kurAll(root, args, name) {
  const plan = kur(root, args, name);
  if (!args.includes('--avalonia')) return plan;
  const shell = avaloniaShell(root, 'kur', flag(args, 'ns') || name);
  const all = plan.concat(shell);
  all.note = shell.note;
  return all;
}

function copies(root, dir, names) {
  return names.map((n) => ({ to: path.join(root, 'teknesyum-ui', dir, n), text: template(dir + '/' + n) }));
}

const TARGETS = {
  kur: (root, args, name) => kurAll(root, args, name),
  ustcubuk: (root, args, name) =>
    isAvalonia(root, args, 'react')
      ? avaloniaShell(root, 'ustcubuk', name)
      : copies(root, 'ustcubuk', ['react/TitleBar.tsx', 'react/titlebar.css']).map((f) => ({
          ...f,
          to: f.to.replace(path.sep + 'react' + path.sep, path.sep),
        })),
  denetim: (root, args, name) => denetim(root, args, name),
  durum: (root, args, name) => {
    const kind = args.includes('--avalonia') ? 'avalonia' : args.includes('--react') ? 'react' : args.includes('--electron') ? 'electron' : hasAxaml(root, 0) ? 'avalonia' : 'electron';
    if (kind === 'avalonia') return avaloniaShell(root, 'durum', name);
    const names =
      kind === 'react'
        ? ['react/UpdateBadge.tsx', 'react/UpdatePanel.tsx', 'react/update.css']
        : ['electron/sync.js', 'electron/preload.js', 'electron/badge.js', 'electron/badge.css'];
    return copies(root, 'durum', names).map((f) => ({ ...f, to: f.to.replace(path.sep + kind + path.sep, path.sep) }));
  },
};

function emit(root, plan) {
  let written = 0;
  const lines = [];
  for (const f of plan) {
    const rel = path.relative(root, f.to).replace(/\\/g, '/');
    if (fs.existsSync(f.to)) {
      lines.push('kept   ' + rel + ' (exists)');
      continue;
    }
    let text = f.text.replace(/\r?\n/g, f.crlf ? '\r\n' : '\n');
    if (f.bom) text = BOM + text;
    fs.mkdirSync(path.dirname(f.to), { recursive: true });
    fs.writeFileSync(f.to, text, 'utf8');
    lines.push('wrote  ' + rel);
    written += 1;
  }
  lines.push(written + ' file(s) written, ' + (plan.length - written) + ' kept');
  return lines.join('\n');
}

const BOOKS = { kur: 'guncelleme-paneli', durum: 'guncelleme-paneli', ustcubuk: 'ui-duzeni' };

function shelfNote(target) {
  const book = BOOKS[target];
  if (!book) return '';
  if (!raf.var()) return 'shelf missing at ' + raf.dir() + ' - the written standard is not on this machine';
  if (raf.oku(book) === null) return 'shelf has no ' + book + '.md - write the standard there before editing the panel';
  return 'shelf: node <plugin>/scripts/raf.js ' + book + ' - follow it before editing the generated files';
}

function main(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP + '\n');
    return args.length ? 0 : 2;
  }
  const [target, name] = positional(args);
  if (!TARGETS[target]) {
    process.stderr.write('unknown target: ' + target + '; pick from ' + Object.keys(TARGETS).join(', ') + '\n');
    return 2;
  }
  const root = path.resolve(flag(args, 'project') || process.cwd());
  let plan;
  try {
    plan = TARGETS[target](root, args, name);
  } catch (e) {
    process.stderr.write(e.message + '\n');
    return 2;
  }
  process.stdout.write(emit(root, plan) + '\n');
  if (plan.note) process.stdout.write(plan.note + '\n');
  process.stdout.write(shelfNote(target) + '\n');
  return 0;
}

process.exitCode = main(process.argv);
