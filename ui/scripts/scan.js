#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const UI_EXT = new Set(['.css', '.tsx', '.jsx', '.vue', '.svelte', '.xaml', '.axaml']);
const CODE_EXT = new Set(['.cs', '.ts', '.js', '.mjs', '.cjs', '.md']);
const SCAN_EXT = new Set([...UI_EXT, ...CODE_EXT]);
const MODULE_EXT = new Set(['.ts', '.js', '.mjs', '.cjs']);
const GENERATED_FILE = new Set([
  'theme.tokens.json',
  'Palette.cs',
]);
const SELF_DIR = __dirname;

const SKIP_DIR = new Set([
  '__fixtures__',
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'bin',
  'obj',
  'coverage',
  'target',
  'vendor',
  '.next',
  '.claude',
  'graphify-out',
]);
const PRINT_CAP = 40;

const ASSETS = path.resolve(__dirname, '..', 'skills', 'teknesyum-ui', 'assets');
const RULE_DIR = path.join(__dirname, 'rules');

const KEY_MAP = {
  kapali: 'off',
  palet: 'palette',
  tipografi: 'typography',
  imza: 'signature',
  ekNot: 'note',
};

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

function rel(root, file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function configRoot() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function english(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) out[KEY_MAP[k] || k] = v;
  return out;
}

function uiConfig(root) {
  const projectPath = path.join(root, '.claude', 'teknesyum-ui.json');
  const machinePath = path.join(configRoot(), 'teknesyum-ui.json');
  const hasProject = fs.existsSync(projectPath);
  const hasMachine = fs.existsSync(machinePath);
  const project = hasProject ? readJson(projectPath) : null;
  const machine = hasMachine ? readJson(machinePath) : null;
  const flag = (c) => (c && typeof c.off === 'boolean' ? c.off : c && c.kapali === true);
  const projectFlag = project && (typeof project.off === 'boolean' || 'kapali' in project);
  const off = projectFlag ? !!flag(project) : !!flag(machine);
  return {
    configured: hasProject || hasMachine,
    off,
    layer: hasProject ? 'project' : hasMachine ? 'machine' : null,
    merged: Object.assign(english(machine), english(project)),
  };
}

function customProperties(css) {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const out = {};
  const re = /(--tk-[a-z0-9-]+)\s*:/gi;
  let m;
  while ((m = re.exec(body))) {
    let i = re.lastIndex;
    let depth = 0;
    while (i < body.length) {
      const c = body[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if ((c === ';' || c === '}') && depth <= 0) break;
      i++;
    }
    out[m[1]] = body.slice(re.lastIndex, i).trim();
  }
  return out;
}

function collect(root) {
  const ui = [];
  const modules = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIR.has(e.name) && path.resolve(full) !== SELF_DIR) stack.push(full);
        continue;
      }
      if (GENERATED_FILE.has(e.name)) continue;
      const ext = path.extname(e.name).toLowerCase();
      if (SCAN_EXT.has(ext)) ui.push(full);
      if (MODULE_EXT.has(ext)) modules.push(full);
    }
  }
  return { ui: ui.sort(), modules: modules.sort() };
}

function buildContext(root, config, notes) {
  const theme = customProperties(read(path.join(ASSETS, 'theme.css')) || '');
  const tokens = readJson(path.join(ASSETS, 'theme.tokens.json'));
  if (!Object.keys(theme).length && !tokens)
    notes.push('theme assets unreadable at ' + ASSETS + ' — colour and duration rules skipped');

  const found = collect(root);
  const files = [];
  for (const full of found.ui) {
    const text = read(full);
    if (text === null) continue;
    files.push({
      path: full,
      rel: rel(root, full),
      ext: path.extname(full).toLowerCase(),
      text,
    });
  }
  const modules = found.modules.map((full) => {
    const entry = { path: full, rel: rel(root, full), ext: path.extname(full).toLowerCase() };
    let text;
    let loaded = false;
    Object.defineProperty(entry, 'text', {
      enumerable: true,
      get() {
        if (!loaded) {
          text = read(full);
          loaded = true;
        }
        return text;
      },
    });
    return entry;
  });

  return {
    root,
    config,
    tokens,
    theme,
    files,
    modules,
    ext: '',
    read(target) {
      return read(path.join(root, target));
    },
  };
}

function loadModules(only) {
  const loaded = [];
  let names;
  try {
    names = fs.readdirSync(RULE_DIR).filter((n) => n.endsWith('.js')).sort();
  } catch {
    return loaded;
  }
  for (const name of names) {
    const base = name.slice(0, -3);
    let mod;
    try {
      mod = require(path.join(RULE_DIR, name));
    } catch (e) {
      process.stderr.write(
        'rule module skipped: ' + name + ' — ' + (e && e.message ? e.message : String(e)) + '\n'
      );
      continue;
    }
    if (!mod || typeof mod !== 'object') {
      process.stderr.write('rule module skipped: ' + name + ' — no rule object exported\n');
      continue;
    }
    const id = typeof mod.id === 'string' && mod.id ? mod.id : base;
    if (only && !only.has(id) && !only.has(base)) continue;
    loaded.push({
      id,
      file: name,
      lineRules: Array.isArray(mod.lineRules) ? mod.lineRules : [],
      fileRules: Array.isArray(mod.fileRules) ? mod.fileRules : [],
      projectRules: Array.isArray(mod.projectRules) ? mod.projectRules : [],
      fixes: mod.fixes && typeof mod.fixes === 'object' ? mod.fixes : {},
    });
  }
  return loaded;
}

function ruleTable(modules) {
  const out = [];
  for (const m of modules)
    for (const group of ['lineRules', 'fileRules', 'projectRules'])
      for (const r of m[group]) out.push({ id: m.id + '/' + r.id, severity: r.severity || 'error' });
  return out;
}

function fixTable(modules) {
  const out = new Map();
  for (const m of modules)
    for (const [name, spec] of Object.entries(m.fixes)) if (!out.has(name)) out.set(name, spec);
  return out;
}

function accepts(rule, ext) {
  if (!Array.isArray(rule.exts) || !rule.exts.length) return true;
  return rule.exts.includes(ext);
}

function finding(severity, rule, file, line, message, fix) {
  return { severity, rule, file, line, message, fix: fix || null, fixed: false };
}

function runScan(ctx, modules, broken) {
  const findings = [];
  const guard = (id, run) => {
    try {
      return run();
    } catch (e) {
      if (!broken.has(id)) broken.set(id, e && e.message ? e.message : String(e));
      return null;
    }
  };

  const lineRules = [];
  const fileRules = [];
  for (const m of modules) {
    for (const r of m.lineRules) lineRules.push({ m, r, id: m.id + '/' + r.id });
    for (const r of m.fileRules) fileRules.push({ m, r, id: m.id + '/' + r.id });
  }

  for (const file of ctx.files) {
    ctx.ext = file.ext;
    const lines = file.text.split(/\r?\n/);
    const active = lineRules.filter((x) => accepts(x.r, file.ext));
    for (let i = 0; i < lines.length; i++) {
      for (const x of active) {
        const message = guard(x.id, () => x.r.test(lines[i], ctx));
        if (typeof message === 'string' && message)
          findings.push(
            finding(x.r.severity || 'error', x.id, file.rel, i + 1, message, x.r.fix)
          );
      }
    }
    for (const x of fileRules) {
      if (!accepts(x.r, file.ext)) continue;
      const rows = guard(x.id, () => x.r.check(file.rel, file.text, ctx));
      if (!Array.isArray(rows)) continue;
      for (const row of rows)
        if (row && row.message)
          findings.push(
            finding(
              row.severity || x.r.severity || 'error',
              x.id,
              row.file === undefined ? file.rel : row.file || '',
              Number(row.line) || 0,
              row.message,
              row.fix === undefined ? x.r.fix : row.fix
            )
          );
    }
  }
  ctx.ext = '';

  for (const m of modules)
    for (const r of m.projectRules) {
      const id = m.id + '/' + r.id;
      const rows = guard(id, () => r.check(ctx));
      if (!Array.isArray(rows)) continue;
      for (const row of rows)
        if (row && row.message)
          findings.push(
            finding(
              row.severity || r.severity || 'error',
              id,
              row.file || '',
              Number(row.line) || 0,
              row.message,
              row.fix === undefined ? r.fix : row.fix
            )
          );
    }

  findings.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule)
  );
  return findings;
}

function applyFixes(ctx, findings, fixes) {
  const order = [...fixes.keys()];
  const byFile = new Map();
  for (const f of findings) {
    if (!f.fix || !f.file) continue;
    const spec = fixes.get(f.fix);
    if (!spec || (typeof spec.line !== 'function' && typeof spec.file !== 'function')) continue;
    if (!byFile.has(f.file)) byFile.set(f.file, { lines: new Map(), whole: new Set() });
    const bucket = byFile.get(f.file);
    if (typeof spec.line === 'function') {
      if (!bucket.lines.has(f.line)) bucket.lines.set(f.line, new Set());
      bucket.lines.get(f.line).add(f.fix);
    } else {
      bucket.whole.add(f.fix);
    }
    f.fixed = true;
  }
  for (const [file, bucket] of byFile) {
    const full = path.join(ctx.root, file);
    let text = read(full);
    if (text === null) continue;
    if (bucket.lines.size) {
      const eol = text.includes('\r\n') ? '\r\n' : '\n';
      const L = text.split(/\r?\n/);
      for (const [no, ops] of bucket.lines) {
        if (L[no - 1] === undefined) continue;
        let y = L[no - 1];
        for (const name of order)
          if (ops.has(name)) {
            try {
              const next = fixes.get(name).line(y, ctx);
              if (typeof next === 'string') y = next;
            } catch {
              /* a fix that throws leaves the line as it was */
            }
          }
        L[no - 1] = y;
      }
      text = L.join(eol);
    }
    for (const name of order)
      if (bucket.whole.has(name)) {
        try {
          const next = fixes.get(name).file(text, ctx);
          if (typeof next === 'string') text = next;
        } catch {
          /* a fix that throws leaves the file as it was */
        }
      }
    fs.writeFileSync(full, text, 'utf8');
  }
  return findings.filter((f) => f.fixed);
}

const HELP = [
  'Usage: node scan.js <root> [--json] [--fix] [--rules <a,b>] [--list-rules] [--help]',
  '',
  '  --json         print findings as a JSON array',
  '  --fix          apply the mechanical fixes, then report what changed',
  '  --rules <a,b>  run only these rule modules',
  '  --list-rules   print every rule id and severity',
  '',
  'Exit: 0 clean · 1 findings · 2 not configured or off · 3 internal error',
  'Config: <root>/.claude/teknesyum-ui.json, then ~/.claude/teknesyum-ui.json',
  'Rules: ui/scripts/rules/*.js — see docs/RULE-API.md',
].join('\n');

function where(f) {
  return f.file ? f.file + ':' + f.line : 'project';
}

function flagValue(args, name) {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith('-')) return args[i + 1];
  const inline = args.find((a) => a.startsWith(name + '='));
  return inline ? inline.slice(name.length + 1) : null;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP + '\n');
    return 0;
  }
  const asJson = args.includes('--json');
  const fix = args.includes('--fix');
  const list = args.includes('--list-rules');
  const pick = flagValue(args, '--rules');
  const only = pick
    ? new Set(
        pick
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    : null;

  const modules = loadModules(only);

  if (list) {
    const table = ruleTable(modules);
    process.stdout.write(
      table.map((r) => r.id + '  ' + r.severity).join('\n') +
        (table.length ? '\n' : '') +
        table.length +
        ' rules\n'
    );
    return 0;
  }

  const skip = new Set([pick, ...args.filter((a) => a.startsWith('-'))]);
  const positional = args.filter((a) => !a.startsWith('-') && !skip.has(a));
  const root = path.resolve(positional[0] || process.cwd());
  if (!fs.existsSync(root)) {
    process.stderr.write('no such root: ' + root + '\n');
    return 3;
  }

  const config = uiConfig(root);
  if (!config.configured) {
    process.stderr.write('teknesyum-ui not configured — no teknesyum-ui.json found\n');
    return 2;
  }
  if (config.off) {
    process.stderr.write('teknesyum-ui is off in the ' + config.layer + ' config\n');
    return 2;
  }

  const notes = [];
  const broken = new Map();
  const ctx = buildContext(root, config.merged, notes);
  const findings = runScan(ctx, modules, broken);
  const applied = fix ? applyFixes(ctx, findings, fixTable(modules)) : [];
  for (const n of notes) process.stderr.write(n + '\n');
  for (const [id, message] of broken)
    process.stderr.write('rule skipped: ' + id + ' — ' + message + '\n');

  const open = findings.filter((f) => !f.fixed);

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        findings.map((f) => ({
          file: f.file || null,
          line: f.line,
          rule: f.rule,
          severity: f.severity,
          message: f.message,
          fix: f.fix,
          fixed: f.fixed,
        })),
        null,
        2
      ) + '\n'
    );
    return open.length ? 1 : 0;
  }

  const lines = [];
  for (const f of applied) lines.push('fixed  ' + where(f) + '  ' + f.rule + '  ' + f.message);
  for (const f of open.slice(0, PRINT_CAP)) lines.push(where(f) + '  ' + f.rule + '  ' + f.message);
  if (open.length > PRINT_CAP) lines.push('… ' + (open.length - PRINT_CAP) + ' more');
  lines.push(
    ctx.files.length +
      ' files · ' +
      open.length +
      ' open · ' +
      applied.length +
      ' fixed · ' +
      open.filter((f) => f.severity === 'error').length +
      ' error(s)'
  );
  process.stdout.write(lines.join('\n') + '\n');
  return open.length ? 1 : 0;
}

try {
  process.exitCode = main(process.argv);
} catch (e) {
  process.stderr.write('scan failed: ' + (e && e.message ? e.message : String(e)) + '\n');
  process.exitCode = 3;
}
