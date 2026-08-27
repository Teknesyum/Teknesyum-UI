#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UI_EXTENSIONS = new Set([
  '.tsx',
  '.jsx',
  '.vue',
  '.svelte',
  '.html',
  '.css',
  '.scss',
  '.xaml',
  '.cs',
]);
const TOKEN_EXTENSIONS = new Set([
  '.json',
  '.yaml',
  '.yml',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.xaml',
]);
const SKIPPED_NAMES = new Set(['node_modules', '.git', 'build', 'dist', 'bin', 'obj']);

const SUGGESTIONS = {
  palette: 'Replace the colour with a palette token — no in-between tones (teknesyum-ui §2).',
  ground: 'A white ground is not allowed; use bg (#000000) or surface (#0a0a0c).',
  textCase: 'Visible text is sentence case; UPPERCASE and Title Case are not used.',
  motion: 'Layout properties are not animated; use opacity or transform.',
  typeScale: 'The type scale is 10 · 13 · 14 · 18 · 24; smaller than that is unreadable.',
};

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exitCode = code;
}

function help() {
  process.stdout.write('Usage: node manifest.js <root> | --target <root>\n');
  process.stdout.write(
    'Input: a root path on argv, or JSON on stdin carrying target/path. Read only; emits the scan plan as JSON on stdout.\n'
  );
}

function readInput() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) return { help: true };
  const targetArg = args.find((arg) => !arg.startsWith('-'));
  const targetFlag = args.indexOf('--target');
  if (targetFlag >= 0 && args[targetFlag + 1]) return { target: args[targetFlag + 1] };
  if (targetArg) return { target: targetArg };
  if (process.stdin.isTTY) return {};
  try {
    const value = fs.readFileSync(0, 'utf8').trim();
    return value ? JSON.parse(value) : {};
  } catch {
    throw new Error('stdin JSON unreadable');
  }
}

function resolveTarget(value) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('target required');
  const absolute = path.resolve(value);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink() || !stat.isDirectory())
    throw new Error('target must be a real directory');
  return fs.realpathSync.native(absolute);
}

function isHidden(name) {
  return name.startsWith('.');
}

function isTokenFile(name, extension) {
  if (!TOKEN_EXTENSIONS.has(extension)) return false;
  return (
    /(^|[._-])(tokens?|theme|variables?)([._-]|$)/i.test(name) ||
    /(^|[/\\])tokens?([/\\])/i.test(name)
  );
}

function collectFiles(root) {
  const files = [];
  function walk(dir) {
    let entries = fs.readdirSync(dir, { withFileTypes: true });
    entries = entries.sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.name.localeCompare(b.name)
    );
    for (const entry of entries) {
      if (isHidden(entry.name) || SKIPPED_NAMES.has(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!stat.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!UI_EXTENSIONS.has(extension) && !isTokenFile(entry.name, extension)) continue;
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      files.push({ absolute, relative, kind: UI_EXTENSIONS.has(extension) ? 'ui' : 'token' });
    }
  }
  walk(root);
  return files.sort(
    (a, b) =>
      a.relative.localeCompare(b.relative, 'en', { sensitivity: 'base' }) ||
      a.relative.localeCompare(b.relative)
  );
}

function catalogRoot() {
  const candidates = [
    path.resolve(__dirname, '..', 'skills', 'teknesyum-ui'),
    path.resolve(__dirname, '..', '..', 'skills', 'teknesyum-ui'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'SKILL.md'))) return candidate;
  }
  throw new Error('teknesyum-ui catalog not found');
}

function readCatalog() {
  const root = catalogRoot();
  const paths = ['SKILL.md'];
  const references = path.join(root, 'references');
  if (fs.existsSync(references)) {
    for (const name of fs.readdirSync(references).sort((a, b) => a.localeCompare(b))) {
      const absolute = path.join(references, name);
      if (fs.lstatSync(absolute).isFile() && path.extname(name).toLowerCase() === '.md')
        paths.push(path.join('references', name));
    }
  }
  const documents = paths.map((relative) => ({
    path: relative.split(path.sep).join('/'),
    content: fs.readFileSync(path.join(root, relative), 'utf8'),
  }));
  const rules = [];
  for (const document of documents) {
    const lines = document.content.split(/\r?\n/);
    lines.forEach((lineText, index) => {
      const match = lineText.match(/^#{2,4}\s+(.+?)\s*$/);
      if (!match) return;
      const title = match[1].replace(/[`*_]/g, '').trim();
      const slug = title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      rules.push({
        id: slug || `section-${rules.length + 1}`,
        title,
        source: document.path,
        line: index + 1,
      });
    });
  }
  rules.sort(
    (a, b) => a.source.localeCompare(b.source) || a.line - b.line || a.id.localeCompare(b.id)
  );
  const source = documents.map((document) => `${document.path}\n${document.content}`).join('\n');
  return {
    root,
    documents,
    rules,
    digest: crypto.createHash('sha256').update(source).digest('hex'),
  };
}

function findRule(catalog, terms, fallback) {
  const found = catalog.rules.find((rule) =>
    terms.some((term) => rule.title.toLowerCase().includes(term))
  );
  if (found) return found.id;
  const section = catalog.rules.find((rule) => rule.id.startsWith(fallback));
  return section ? section.id : fallback;
}

function makeFinding(file, line, rule, severity, suggestion) {
  return { file, line, rule, severity, suggestion };
}

const PALETTE = new Set([
  '#00f3ff',
  '#ff00ea',
  '#b026ff',
  '#34d399',
  '#000000',
  '#0a0a0c',
  '#ffffff',
  '#71717a',
]);
const TYPE_SCALE = new Set([10, 13, 14, 18, 24]);
const FINDING_CAP = 200;
const UPPER = '[A-ZÇĞİÖŞÜ]';
const UPPERCASE_RUN = new RegExp('(^|[^p{L}])' + UPPER + '{3,}([^p{L}]|$)', 'u');
const VISIBLE_ATTRIBUTE =
  /\b(?:Content|Text|Header|ToolTip|title|label|placeholder|alt|aria-label)\s*=\s*["']([^"']+)["']/gi;
const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g;
const WHITE_GROUND =
  /\b(?:background|background-color|Background)\s*[:=]\s*["']?\s*(#fff(?:fff)?\b|white\b)/i;

function visibleFragments(lineText) {
  const out = [];
  for (const m of lineText.matchAll(/>([^<>{}]+)</g)) out.push(m[1]);
  for (const m of lineText.matchAll(VISIBLE_ATTRIBUTE)) out.push(m[1]);
  return out.filter((fragment) => /\p{L}/u.test(fragment));
}

function normalizeHex(value) {
  const v = value.toLowerCase();
  if (!v.startsWith('#')) return v.replace(/\s+/g, '');
  if (v.length === 4) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  if (v.length === 9 && v.endsWith('ff')) return v.slice(0, 7);
  return v;
}

function offPalette(value) {
  const v = normalizeHex(value);
  if (v === 'transparent' || /^rgba?\([^)]*,\s*0\s*\)$/.test(v)) return false;
  if (v.startsWith('#')) return !PALETTE.has(v);
  return true;
}

function typeScaleFinding(lineText) {
  const out = [];
  for (const m of lineText.matchAll(/font-size\s*:\s*([\d.]+)px/gi)) out.push(Number(m[1]));
  for (const m of lineText.matchAll(/FontSize\s*=\s*"([\d.]+)"/g)) out.push(Number(m[1]));
  return out.filter((n) => Number.isFinite(n) && !TYPE_SCALE.has(n));
}

function inspect(file, text, catalog) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  const caseRule = findRule(catalog, ['uppercase', 'text case'], 'text-case');
  const colorRule = findRule(catalog, ['palette', 'colour', 'color'], 'color-palette');
  const groundRule = findRule(catalog, ['ground', 'background'], 'color-palette');
  const scaleRule = findRule(catalog, ['type scale', 'typography'], 'typography');
  const motionRule = findRule(
    catalog,
    ['width', 'height', 'box-shadow', 'animated'],
    'motion-properties'
  );
  lines.forEach((lineText, index) => {
    const line = index + 1;
    // MEASURED: the rule was catching every uppercase run on every line — constant
    // names, HTTP, class names all became findings and the output was unreadable. The
    // rule belongs to visible text: a JSX text node and a labelled attribute. Code's
    // own naming is outside this rule.
    if (visibleFragments(lineText).some((fragment) => UPPERCASE_RUN.test(fragment)))
      findings.push(makeFinding(file, line, caseRule, 'warning', SUGGESTIONS.textCase));
    if (WHITE_GROUND.test(lineText))
      findings.push(makeFinding(file, line, groundRule, 'error', SUGGESTIONS.ground));
    // MEASURED: three grey constants were searched for; every other colour outside the
    // palette passed silently. The criterion is being in the palette, not being on a list.
    else
      for (const m of lineText.match(COLOR) || []) {
        if (!offPalette(m)) continue;
        findings.push(makeFinding(file, line, colorRule, 'warning', SUGGESTIONS.palette));
        break;
      }
    if (typeScaleFinding(lineText).length)
      findings.push(makeFinding(file, line, scaleRule, 'warning', SUGGESTIONS.typeScale));
    if (
      /\b(?:transition|animation)\s*:[^;]*(?:width|height|top|left|margin|box-shadow|filter)\b/i.test(
        lineText
      )
    )
      findings.push(makeFinding(file, line, motionRule, 'error', SUGGESTIONS.motion));
  });
  return findings;
}

function scan(input) {
  const root = resolveTarget(input.target || input.path);
  const catalog = readCatalog();
  const files = collectFiles(root);
  const findings = [];
  const records = [];
  for (const file of files) {
    const content = fs.readFileSync(file.absolute);
    const text = content.toString('utf8');
    records.push({
      file: file.relative,
      kind: file.kind,
      digest: crypto.createHash('sha256').update(content).digest('hex'),
    });
    findings.push(...inspect(file.relative, text, catalog));
  }
  findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.rule.localeCompare(b.rule) ||
      a.severity.localeCompare(b.severity) ||
      a.suggestion.localeCompare(b.suggestion)
  );
  // MEASURED: the scan printed the whole catalog (60+ headings) and an unbounded list of
  // findings; on a mid-size interface the output ate most of the model's context. What is
  // above the cap stays as a number in the `truncated` field; a skipped finding is not
  // hidden, it is counted.
  const truncated = Math.max(0, findings.length - FINDING_CAP);
  const shown = findings.slice(0, FINDING_CAP);
  const cited = new Set(shown.map((f) => f.rule));
  const out = {
    target: root,
    catalog: {
      digest: catalog.digest,
      rules: catalog.rules.filter((rule) => cited.has(rule.id)),
    },
    files: records,
    findings: shown,
    truncated,
  };
  const canonical = JSON.stringify(out);
  out.digest = crypto.createHash('sha256').update(canonical).digest('hex');
  return out;
}

try {
  const input = readInput();
  if (input.help) help();
  else process.stdout.write(`${JSON.stringify(scan(input))}\n`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
