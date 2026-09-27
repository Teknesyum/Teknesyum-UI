'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./lib');

const BASLANGIC = path.join(L.UI, 'hooks', 'baslangic.js');
const ONCE = path.join(L.UI, 'hooks', 'once.js');

const CONFIG = {
  version: '1.1.0',
  off: false,
  template: 'neon',
  targets: ['css'],
  signature: { off: false },
};

function tmpProject(prefix) {
  const dir = L.tmp(prefix);
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function tmpConfigDir(withMachineConfig) {
  const dir = L.tmp('tkui-hook-cfg-');
  if (withMachineConfig) L.write(path.join(dir, 'teknesyum-ui.json'), JSON.stringify(CONFIG, null, 2));
  return dir;
}

function hookEnv(configDir, shelfDir) {
  return {
    ...process.env,
    CLAUDE_CONFIG_DIR: configDir,
    TEKNESYUM_PRIVATE: shelfDir || path.join(configDir, 'yok-boyle-raf'),
    TEKNESYUM_UI_TOPLU_KOK: L.tmp('tkui-toplu-bos-'),
    NO_COLOR: '1',
  };
}

function runHook(script, payload, env) {
  return spawnSync(process.execPath, [script], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env,
    windowsHide: true,
    timeout: 20000,
  });
}

function parseOut(r) {
  const text = String(r.stdout || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function noUiNoProjectConfig() {
  const root = tmpProject('tkui-hook-a-');
  const cfg = tmpConfigDir(true);
  const r = runHook(BASLANGIC, { cwd: root, source: 'startup' }, hookEnv(cfg));
  L.ok('baslangic.js exits 0 with no UI files and only a machine config', r.status === 0, r.stderr);
  const out = parseOut(r);
  L.ok('a project with a machine config but no UI files gets a context note', !!out && typeof out.hookSpecificOutput.additionalContext === 'string' && /hen[uü]z/i.test(out.hookSpecificOutput.additionalContext), r.stdout);
  L.ok('that context note carries no systemMessage', out && out.systemMessage === undefined, JSON.stringify(out));
}

function noUiWithProjectConfig() {
  const root = tmpProject('tkui-hook-b-');
  L.write(path.join(root, '.claude', 'teknesyum-ui.json'), JSON.stringify(CONFIG, null, 2));
  const cfg = tmpConfigDir(false);
  const r = runHook(BASLANGIC, { cwd: root, source: 'startup' }, hookEnv(cfg));
  L.ok('baslangic.js exits 0 with no UI files and a project config', r.status === 0, r.stderr);
  L.ok('a project already configured with no UI files prints nothing', String(r.stdout || '').trim() === '', JSON.stringify(r.stdout));
}

function uiFileNoProjectConfig() {
  const root = tmpProject('tkui-hook-c-');
  L.write(path.join(root, 'src', 'panel.css'), '.panel { color: red; }\n');
  const cfg = tmpConfigDir(true);
  const r = runHook(BASLANGIC, { cwd: root, source: 'startup' }, hookEnv(cfg));
  L.ok('baslangic.js exits 0 with a UI file and no project config', r.status === 0, r.stderr);
  const out = parseOut(r);
  L.ok('an unconfigured UI project reports it was never set up', !!out && /hi[cç] kurulmad[ıi]/i.test(out.hookSpecificOutput.additionalContext), r.stdout);
  L.ok('that reason also ships a systemMessage', !!out && typeof out.systemMessage === 'string' && out.systemMessage.length > 0, JSON.stringify(out));
}

function compactIsSilent() {
  const root = tmpProject('tkui-hook-d-');
  L.write(path.join(root, 'src', 'panel.css'), '.panel { color: red; }\n');
  const cfg = tmpConfigDir(true);
  const r = runHook(BASLANGIC, { cwd: root, source: 'compact' }, hookEnv(cfg));
  L.ok('baslangic.js exits 0 for a compact source', r.status === 0, r.stderr);
  L.ok('a compact source never prints anything, UI or not', String(r.stdout || '').trim() === '', JSON.stringify(r.stdout));
}

function onceDeniesWithoutProjectConfig() {
  const root = tmpProject('tkui-once-a-');
  const cfg = tmpConfigDir(true);
  const r = runHook(ONCE, { cwd: root, tool_input: { file_path: path.join(root, 'src', 'panel.css') } }, hookEnv(cfg));
  L.ok('once.js exits 0 when denying', r.status === 0, r.stderr);
  const out = parseOut(r);
  L.ok('a .css write is denied when the project has no config of its own', !!out && out.hookSpecificOutput.permissionDecision === 'deny', r.stdout);
  L.ok('the denial explains the project was never set up', /kurulmad[ıi]/i.test(out.hookSpecificOutput.permissionDecisionReason), r.stdout);
}

function onceAllowsWithProjectConfig() {
  const root = tmpProject('tkui-once-b-');
  L.write(path.join(root, '.claude', 'teknesyum-ui.json'), JSON.stringify(CONFIG, null, 2));
  const cfg = tmpConfigDir(false);
  const r = runHook(ONCE, { cwd: root, tool_input: { file_path: path.join(root, 'src', 'panel.css') } }, hookEnv(cfg));
  L.ok('once.js exits 0 when a project config already exists', r.status === 0, r.stderr);
  L.ok('a .css write is allowed once the project is configured', String(r.stdout || '').trim() === '', JSON.stringify(r.stdout));
}

function onceIgnoresMarkdown() {
  const root = tmpProject('tkui-once-c-');
  const cfg = tmpConfigDir(true);
  const r = runHook(ONCE, { cwd: root, tool_input: { file_path: path.join(root, 'README.md') } }, hookEnv(cfg));
  L.ok('once.js exits 0 for a non-UI file', r.status === 0, r.stderr);
  L.ok('a Markdown write is never denied', String(r.stdout || '').trim() === '', JSON.stringify(r.stdout));
}

function newVersionRunsBulkUc() {
  const kok = L.tmp('tkui-toplu-kok-');
  const root = path.join(kok, 'Burasi');
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  const eski = path.join(kok, 'Eski');
  L.write(path.join(eski, '.claude', 'teknesyum-ui.json'), JSON.stringify({ uc: { surum: '0.1.0' } }));
  const cfg = tmpConfigDir(false);
  const env = { ...hookEnv(cfg), TEKNESYUM_UI_TOPLU_KOK: '' };
  let r = runHook(BASLANGIC, { cwd: root, source: 'startup' }, env);
  const out = parseOut(r);
  L.ok('a new plugin version writes the bulk uc lines at session start', !!out && /1 projenin defterine uc satırı yazıldı — Eski/.test(out.systemMessage || '') && !(out.hookSpecificOutput || {}).additionalContext, r.stdout + r.stderr);
  L.ok('the bulk uc state records the version', !!L.readJson(path.join(cfg, 'teknesyum-ui', 'toplu.json')));
  r = runHook(BASLANGIC, { cwd: root, source: 'startup' }, env);
  const defter = fs.readFileSync(path.join(eski, '.claude', 'acik.md'), 'utf8');
  L.ok('the same version does not run the bulk uc again', String(r.stdout || '').trim() === '' && (defter.match(/uc çalıştır/g) || []).length === 1, r.stdout);
}

module.exports = function hooks() {
  newVersionRunsBulkUc();
  noUiNoProjectConfig();
  noUiWithProjectConfig();
  uiFileNoProjectConfig();
  compactIsSilent();
  onceDeniesWithoutProjectConfig();
  onceAllowsWithProjectConfig();
  onceIgnoresMarkdown();
};
