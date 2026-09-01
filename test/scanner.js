'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const MIN_RULES = 80;
const MODULE_EXT = new Set(['.ts', '.js', '.mjs', '.cjs']);

const CONFIG = {
  version: '1.1.0',
  off: false,
  template: 'neon',
  targets: ['css'],
  signature: { off: false },
};

function moduleNames() {
  return fs
    .readdirSync(L.RULE_DIR)
    .filter((n) => n.endsWith('.js'))
    .sort();
}

function listRules() {
  const r = L.node(L.SCAN, ['--list-rules'], { env: L.cleanEnv() });
  L.ok('--list-rules exits 0', r.status === 0, r.stderr);
  const rows = r.stdout
    .trim()
    .split(/\r?\n/)
    .filter((l) => /\s{2}(error|warn|[a-z]+)$/.test(l));
  const total = Number((/(\d+) rules/.exec(r.stdout) || [])[1]);
  L.ok('--list-rules counts at least ' + MIN_RULES + ' rules', total >= MIN_RULES, total + ' rules');
  const bad = rows.filter((l) => !/\s{2}(error|warn)$/.test(l));
  L.ok('every listed severity is error or warn', bad.length === 0, bad.slice(0, 3).join(' | '));
}

function shape() {
  const seen = new Map();
  for (const name of moduleNames()) {
    let mod = null;
    try {
      mod = require(path.join(L.RULE_DIR, name));
    } catch (e) {
      L.ok(name + ' can be required', false, e.message);
      continue;
    }
    L.ok(name + ' can be required', true);
    L.ok(name + ' exports an id', typeof mod.id === 'string' && mod.id.length > 0);
    let arrays = true;
    for (const group of ['lineRules', 'fileRules', 'projectRules']) {
      if (mod[group] !== undefined && !Array.isArray(mod[group])) arrays = false;
    }
    L.ok(name + ' declares rule groups as arrays', arrays);

    const local = new Set();
    let fields = true;
    let unique = true;
    for (const group of ['lineRules', 'fileRules', 'projectRules']) {
      for (const rule of mod[group] || []) {
        if (typeof rule.id !== 'string' || !rule.id) fields = false;
        if (rule.severity !== 'error' && rule.severity !== 'warn') fields = false;
        if (local.has(rule.id)) unique = false;
        local.add(rule.id);
        const full = mod.id + '/' + rule.id;
        if (seen.has(full)) unique = false;
        seen.set(full, name);
      }
    }
    L.ok(name + ' rules carry an id and a severity', fields);
    L.ok(name + ' rule ids are unique', unique);
  }
  L.ok('rule ids are unique across modules', seen.size > 0);
}

function assets() {
  const tokens = L.readJson(path.join(L.ASSETS, 'theme.tokens.json'));
  const css = fs.readFileSync(path.join(L.ASSETS, 'theme.css'), 'utf8');
  const theme = {};
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) theme[m[1]] = m[2].trim();
  return { tokens, theme };
}

function contextFor(root) {
  const { tokens, theme } = assets();
  const files = [];
  const modules = [];
  for (const full of L.walk(root)) {
    const ext = path.extname(full).toLowerCase();
    const entry = {
      path: full,
      rel: path.relative(root, full).replace(/\\/g, '/'),
      ext,
      text: fs.readFileSync(full, 'utf8'),
    };
    files.push(entry);
    if (MODULE_EXT.has(ext)) modules.push(entry);
  }
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  return {
    root,
    config: CONFIG,
    tokens,
    theme,
    files,
    modules,
    ext: '',
    read(target) {
      try {
        return fs.readFileSync(path.join(root, target), 'utf8');
      } catch {
        return null;
      }
    },
  };
}

function accepts(rule, ext) {
  if (!Array.isArray(rule.exts) || !rule.exts.length) return true;
  return rule.exts.includes(ext);
}

function findingsFor(rule, kind, ctx) {
  const out = [];
  if (kind === 'project') {
    for (const row of rule.check(ctx) || []) if (row && row.message) out.push(row);
    return out;
  }
  for (const file of ctx.files) {
    if (!accepts(rule, file.ext)) continue;
    ctx.ext = file.ext;
    if (kind === 'line') {
      file.text.split(/\r?\n/).forEach((line, i) => {
        const message = rule.test(line, ctx);
        if (typeof message === 'string' && message) out.push({ file: file.rel, line: i + 1, message });
      });
    } else {
      for (const row of rule.check(file.rel, file.text, ctx) || []) if (row && row.message) out.push(row);
    }
  }
  ctx.ext = '';
  return out;
}

function rulesOf(mod) {
  const out = [];
  for (const r of mod.lineRules || []) out.push({ rule: r, kind: 'line' });
  for (const r of mod.fileRules || []) out.push({ rule: r, kind: 'file' });
  for (const r of mod.projectRules || []) out.push({ rule: r, kind: 'project' });
  return out;
}

function flatCase(dir, rule, side) {
  const names = fs.readdirSync(dir).filter((n) => n.startsWith(rule.id + '.') && n.includes('.' + side + '.'));
  if (!names.length) return null;
  const cases = [];
  for (const name of names) {
    const staged = L.tmp('tkui-fx-');
    fs.copyFileSync(path.join(dir, name), path.join(staged, name));
    cases.push({ label: name, root: staged });
  }
  return cases;
}

function dirCase(dir, rule, side) {
  const src = path.join(dir, rule.id, side);
  if (!fs.existsSync(src)) return null;
  const staged = L.tmp('tkui-fx-');
  fs.cpSync(src, staged, { recursive: true });
  return [{ label: rule.id + '/' + side, root: staged }];
}

function fixtures() {
  for (const name of moduleNames()) {
    const mod = require(path.join(L.RULE_DIR, name));
    const dir = path.join(L.FIXTURES, mod.id);
    if (!fs.existsSync(dir)) {
      L.ok(mod.id + ' has a fixture directory', false, 'no ' + path.join('__fixtures__', mod.id));
      continue;
    }
    let pairs = 0;
    let good = 0;
    const missing = [];
    const wrong = [];
    for (const { rule, kind } of rulesOf(mod)) {
      const bad = flatCase(dir, rule, 'bad') || dirCase(dir, rule, 'bad');
      const clean = flatCase(dir, rule, 'good') || dirCase(dir, rule, 'good');
      if (!bad || !clean) {
        missing.push(rule.id);
        continue;
      }
      pairs += 1;
      let fine = true;
      for (const c of bad) {
        if (findingsFor(rule, kind, contextFor(c.root)).length === 0) {
          fine = false;
          wrong.push(rule.id + ' bad ' + c.label + ': no finding');
        }
      }
      for (const c of clean) {
        const found = findingsFor(rule, kind, contextFor(c.root));
        if (found.length) {
          fine = false;
          wrong.push(rule.id + ' good ' + c.label + ': ' + found[0].message);
        }
      }
      if (fine) good += 1;
    }
    L.ok(mod.id + ' covers every rule with a bad/good pair', missing.length === 0, missing.join(' '));
    L.ok(mod.id + ' fixture pairs behave (' + good + '/' + pairs + ')', good === pairs, wrong.slice(0, 3).join(' | '));
  }
}

function cleanProject() {
  const root = L.tmp('tkui-clean-');
  L.write(path.join(root, '.claude', 'teknesyum-ui.json'), JSON.stringify(CONFIG, null, 2));
  L.write(path.join(root, 'locale', 'en.json'), JSON.stringify({ ok: 'Save' }, null, 2) + '\n');
  L.write(path.join(root, 'locale', 'tr.json'), JSON.stringify({ ok: 'Kaydet' }, null, 2) + '\n');
  return root;
}

function exitCodes() {
  const env = L.cleanEnv();

  const bare = L.tmp('tkui-bare-');
  L.ok('an unconfigured root exits 2', L.node(L.SCAN, [bare], { env }).status === 2);

  const off = L.tmp('tkui-off-');
  L.write(path.join(off, '.claude', 'teknesyum-ui.json'), JSON.stringify({ ...CONFIG, off: true }, null, 2));
  L.ok('off: true exits 2', L.node(L.SCAN, [off], { env }).status === 2);

  const clean = cleanProject();
  const r = L.node(L.SCAN, [clean], { env });
  L.ok('a clean project exits 0', r.status === 0, r.stdout + r.stderr);

  const dirty = cleanProject();
  L.write(path.join(dirty, 'panel.css'), '.panel { color: #ff00ea; }\n');
  const d = L.node(L.SCAN, [dirty], { env });
  L.ok('a project with violations exits 1', d.status === 1, d.stdout + d.stderr);

  const gone = path.join(L.tmp('tkui-gone-'), 'nowhere');
  L.ok('a root that does not exist exits 3', L.node(L.SCAN, [gone], { env }).status === 3);

  return dirty;
}

function jsonShape(dirty) {
  const r = L.node(L.SCAN, [dirty, '--json'], { env: L.cleanEnv() });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    L.ok('--json output parses', false, e.message);
    return;
  }
  L.ok('--json output parses', Array.isArray(parsed) && parsed.length > 0);
  const keys = ['file', 'line', 'rule', 'severity', 'message'];
  const bad = parsed.filter((f) => keys.some((k) => !(k in f)));
  L.ok('every finding carries file, line, rule, severity, message', bad.length === 0, JSON.stringify(bad[0] || {}));
  const severity = parsed.filter((f) => f.severity !== 'error' && f.severity !== 'warn');
  L.ok('every finding severity is error or warn', severity.length === 0, JSON.stringify(severity[0] || {}));
}

function brokenModuleSurvives(dirty) {
  const planted = path.join(L.RULE_DIR, '_bad.js');
  fs.writeFileSync(planted, 'throw new Error("planted");\n', 'utf8');
  try {
    const r = L.node(L.SCAN, [dirty], { env: L.cleanEnv() });
    L.ok('a broken rule module does not sink the scan', r.status === 1, 'status ' + r.status + ' ' + r.stderr);
    L.ok('the broken module is named on stderr', /_bad\.js/.test(r.stderr), r.stderr);
  } finally {
    fs.unlinkSync(planted);
  }
  L.ok('the planted module is gone', !fs.existsSync(planted));
}

function dogfood() {
  const repo = path.resolve(__dirname, '..');
  const config = path.join(repo, '.claude', 'teknesyum-ui.json');
  const had = fs.existsSync(config);
  if (!had) L.write(config, JSON.stringify(CONFIG, null, 2));
  const r = L.node(L.SCAN, [repo], { env: L.cleanEnv() });
  if (!had) fs.rmSync(config, { force: true });
  L.ok('the standard passes its own scanner', r.status === 0, r.stdout + r.stderr);
  L.ok('the scanner skips gitignored files', !/Teknesyum-Base/.test(r.stdout));
  L.ok('the scanner skips its own source', !/scripts\/rules\//.test(r.stdout));
}

module.exports = function scanner() {
  listRules();
  shape();
  fixtures();
  const dirty = exitCodes();
  jsonShape(dirty);
  brokenModuleSurvives(dirty);
  dogfood();
};
