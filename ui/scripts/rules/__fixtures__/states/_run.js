'use strict';

const fs = require('fs');
const path = require('path');

const mod = require('../../states.js');
const dir = __dirname;

const tokens = JSON.parse(
  fs
    .readFileSync(
      path.resolve(dir, '../../../../skills/teknesyum-ui/assets/theme.tokens.json'),
      'utf8'
    )
    .replace(/^﻿/, '')
);
const themeCss = fs.readFileSync(
  path.resolve(dir, '../../../../skills/teknesyum-ui/assets/theme.css'),
  'utf8'
);
const theme = {};
for (const m of themeCss.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) theme[m[1]] = m[2].trim();

function ctxFor(files) {
  return {
    root: dir,
    config: {},
    tokens,
    theme,
    files,
    modules: [],
    read: () => null,
  };
}

function run(rule, kind, file) {
  const ext = path.extname(file.rel).toLowerCase();
  if (rule.exts && !rule.exts.includes(ext)) return [];
  const ctx = ctxFor([file]);
  if (kind === 'line') {
    const out = [];
    file.text.split(/\r?\n/).forEach((line, i) => {
      const msg = rule.test(line, Object.assign({}, ctx, { ext }));
      if (msg) out.push({ line: i + 1, message: msg });
    });
    return out;
  }
  if (kind === 'file') return rule.check(file.rel, file.text, ctx) || [];
  return rule.check(ctxFor([file])) || [];
}

const rules = [];
for (const r of mod.lineRules || []) rules.push({ rule: r, kind: 'line' });
for (const r of mod.fileRules || []) rules.push({ rule: r, kind: 'file' });
for (const r of mod.projectRules || []) rules.push({ rule: r, kind: 'project' });

const names = fs.readdirSync(dir).filter((n) => /\.(bad|good)\./.test(n));
let pass = 0;
let fail = 0;

for (const { rule, kind } of rules) {
  const mine = names.filter((n) => n.startsWith(rule.id + '.'));
  if (!mine.length) {
    console.log('MISSING  ' + rule.id + ' — no fixture');
    fail += 1;
    continue;
  }
  for (const name of mine) {
    const rel = name;
    const file = {
      rel,
      path: path.join(dir, name),
      ext: path.extname(name).toLowerCase(),
      text: fs.readFileSync(path.join(dir, name), 'utf8'),
    };
    const found = run(rule, kind, file);
    const wantsFinding = name.includes('.bad.');
    const ok = wantsFinding ? found.length > 0 : found.length === 0;
    if (ok) pass += 1;
    else {
      fail += 1;
      console.log(
        'FAIL     ' +
          rule.id +
          ' / ' +
          name +
          ' — ' +
          (wantsFinding ? 'no finding' : 'unexpected: ' + JSON.stringify(found))
      );
    }
  }
}

console.log('\nrules ' + rules.length + ' · pass ' + pass + ' · fail ' + fail);
process.exit(fail ? 1 : 0);
