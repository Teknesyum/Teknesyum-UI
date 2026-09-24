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
  '  kur <AppName>   Kur.bat + kur-<name>.ps1 into the project root',
  '      --simge <path>      icon, relative to the USB root (default simge.ico)',
  '      --altbaslik <text>  subtitle under the title',
  '      --depo <url>        git remote (default: origin, as ssh)',
  '      --anahtar <name>    deploy key file under .kurulum\\anahtar (default usb-01)',
  '      --adimlar <file>    project steps fragment (default templates/kur/adimlar.ps1)',
  '  ustcubuk        TitleBar.tsx + titlebar.css into teknesyum-ui/ustcubuk',
  '  durum           Electron sync badge into teknesyum-ui/durum',
  '  denetim <Namespace>  headless contrast test into teknesyum-ui/denetim/KontrastTests.cs',
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
  return text.replace(/\{\{([A-Z]+)\}\}/g, (all, key) => (key in values ? values[key] : all));
}

function kur(root, args, name) {
  if (!name) throw new Error('kur needs an application name');
  const file = slug(name);
  if (!file) throw new Error('application name has no usable letters: ' + name);
  const values = {
    AD: name,
    ALTBASLIK: flag(args, 'altbaslik') || '',
    DEPO: flag(args, 'depo') || sshRemote(root) || 'git@github.com:Teknesyum/' + name + '.git',
    ANAHTAR: flag(args, 'anahtar') || 'usb-01',
    SIMGE: (flag(args, 'simge') || 'simge.ico').replace(/\//g, '\\'),
    BETIK: 'kur-' + file + '.ps1',
  };
  for (const [key, value] of Object.entries(values))
    if (!SAFE.test(value)) throw new Error(key.toLowerCase() + ' may not contain " ` $ or a newline');
  const custom = flag(args, 'adimlar');
  const steps = (custom ? fs.readFileSync(path.resolve(custom), 'utf8').replace(/^﻿/, '') : template('kur/adimlar.ps1')).replace(/\s+$/, '');
  const script = template('kur/kur.ps1').replace(/^[ \t]*\{\{ADIMLAR\}\}[ \t]*$/m, () => steps);
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
  return [
    {
      to: path.join(root, 'teknesyum-ui', 'denetim', 'KontrastTests.cs'),
      text: fill(template('denetim/' + kind + '/KontrastTests.cs'), values),
      crlf: true,
    },
  ];
}

function copies(root, dir, names) {
  return names.map((n) => ({ to: path.join(root, 'teknesyum-ui', dir, n), text: template(dir + '/' + n) }));
}

const TARGETS = {
  kur: (root, args, name) => kur(root, args, name),
  ustcubuk: (root) =>
    copies(root, 'ustcubuk', ['react/TitleBar.tsx', 'react/titlebar.css']).map((f) => ({
      ...f,
      to: f.to.replace(path.sep + 'react' + path.sep, path.sep),
    })),
  denetim: (root, args, name) => denetim(root, args, name),
  durum: (root) =>
    copies(root, 'durum', ['electron/sync.js', 'electron/preload.js', 'electron/badge.js', 'electron/badge.css']).map(
      (f) => ({ ...f, to: f.to.replace(path.sep + 'electron' + path.sep, path.sep) })
    ),
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
  process.stdout.write(shelfNote(target) + '\n');
  return 0;
}

process.exitCode = main(process.argv);
