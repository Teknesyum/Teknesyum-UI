#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = 'tercihler';
const KURAL = path.join('teknesyum-ui', 'kurallar');

function configRoot() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function root() {
  return process.env.TEKNESYUM_PRIVATE || path.join(configRoot(), 'teknesyum-private');
}

function dir() {
  return path.join(root(), 'private', DIR);
}

function dizinler() {
  return [path.join(root(), KURAL), dir()].filter((d) => {
    try {
      return fs.statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
}

function var_() {
  return dizinler().length > 0;
}

function liste() {
  if (!var_()) return [];
  const adlar = new Set();
  for (const d of dizinler()) {
    try {
      for (const f of fs.readdirSync(d)) if (f.toLowerCase().endsWith('.md') && !/^(agents|claude)\.md$/i.test(f)) adlar.add(f.replace(/\.md$/i, ''));
    } catch {}
  }
  return [...adlar].sort();
}

function oku(name) {
  if (!name || !/^[a-z0-9-]+$/i.test(String(name))) return null;
  for (const d of dizinler()) {
    try {
      return fs.readFileSync(path.join(d, String(name) + '.md'), 'utf8');
    } catch {}
  }
  return null;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(
      'Usage: node raf.js [name]\n\nReads the private shelf under ' +
        path.join(root(), KURAL) +
        ' first, then ' +
        dir() +
        '\nNo name lists the books. Exit: 0 fine · 1 no shelf · 2 no such book\n'
    );
    return 0;
  }
  if (!var_()) {
    process.stderr.write('no private shelf at ' + dir() + '\n');
    return 1;
  }
  const name = args.find((a) => !a.startsWith('-'));
  if (!name) {
    process.stdout.write(liste().join('\n') + '\n');
    return 0;
  }
  const body = oku(name);
  if (body === null) {
    process.stderr.write('no such book: ' + name + '; pick from ' + liste().join(', ') + '\n');
    return 2;
  }
  process.stdout.write(body.replace(/\s*$/, '') + '\n');
  return 0;
}

module.exports = { root, dir, var: var_, liste, oku };

if (require.main === module) process.exitCode = main(process.argv);
