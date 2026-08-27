'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const UI = path.resolve(__dirname, '..', 'ui');
const SKILL = path.join(UI, 'skills', 'teknesyum-ui');
const ASSETS = path.join(SKILL, 'assets');
const SCAN = path.join(UI, 'scripts', 'scan.js');
const SETUP = path.join(UI, 'scripts', 'setup.js');
const GENERATE = path.join(UI, 'scripts', 'generate.js');
const GUARD = path.join(UI, 'hooks', 'guard.js');
const RULE_DIR = path.join(UI, 'scripts', 'rules');
const FIXTURES = path.join(RULE_DIR, '__fixtures__');

const state = { pass: 0, fail: 0, failures: [] };
const temps = [];

function ok(name, cond, detail) {
  if (cond) {
    state.pass += 1;
    process.stdout.write('  ok    ' + name + '\n');
    return true;
  }
  state.fail += 1;
  state.failures.push(name + (detail ? ' — ' + String(detail).split('\n')[0].slice(0, 200) : ''));
  process.stdout.write('  FAIL  ' + name + '\n');
  return false;
}

function run(cmd, args, opts) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024,
    ...opts,
  });
}

function node(script, args, opts) {
  return run(process.execPath, [script].concat(args || []), opts);
}

function tmp(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

function cleanup() {
  for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true });
  temps.length = 0;
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

function lines(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
}

function walk(dir, out) {
  const found = out || [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

function cleanEnv(extra) {
  const cfg = tmp('tkui-cfg-');
  return { ...process.env, CLAUDE_CONFIG_DIR: cfg, NO_COLOR: '1', ...(extra || {}) };
}

module.exports = {
  UI,
  SKILL,
  ASSETS,
  SCAN,
  SETUP,
  GENERATE,
  GUARD,
  RULE_DIR,
  FIXTURES,
  state,
  ok,
  run,
  node,
  tmp,
  cleanup,
  write,
  readJson,
  lines,
  walk,
  cleanEnv,
};
