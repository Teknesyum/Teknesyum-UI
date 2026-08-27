#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function help() {
  process.stdout.write(
    'Usage: node manifest-apply.js --approve --plan <plan.json> --plan-digest <sha256> --target <root>\n'
  );
  process.stdout.write(
    'Input: JSON on stdin or argv carrying the same fields. Writes no target file; emits a verified manifest.\n'
  );
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) return { help: true };
  const input = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--approve') input.approve = true;
    else if (arg === '--plan' || arg === '--plan-file') input.plan = args[++i];
    else if (arg === '--plan-digest' || arg === '--digest') input.planDigest = args[++i];
    else if (arg === '--target' || arg === '--root') input.target = args[++i];
    else if (!arg.startsWith('-') && !input.plan) input.plan = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!process.stdin.isTTY) {
    const text = fs.readFileSync(0, 'utf8').trim();
    if (text) Object.assign(input, JSON.parse(text));
  }
  return input;
}

function readPlan(value) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('plan required');
  const text =
    fs.existsSync(value) && fs.statSync(value).isFile() ? fs.readFileSync(value, 'utf8') : value;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('plan JSON unreadable');
  }
}

function realRoot(value) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('target required');
  const absolute = path.resolve(value);
  const stat = fs.lstatSync(absolute);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error('target must be a real directory');
  return fs.realpathSync.native(absolute);
}

function safeRelative(value) {
  if (
    typeof value !== 'string' ||
    value === '' ||
    path.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  )
    throw new Error('plan file path outside root');
  const normalized = value.replace(/[\\/]+/g, '/');
  if (normalized.split('/').some((part) => part === '..' || part === ''))
    throw new Error('plan file path contains traversal');
  if (normalized === '.' || normalized.startsWith('/'))
    throw new Error('plan file path outside root');
  return normalized;
}

function digest(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function planDigest(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan))
    throw new Error('plan object required');
  if (typeof plan.digest !== 'string' || !/^[a-f0-9]{64}$/i.test(plan.digest))
    throw new Error('plan digest missing or invalid');
  const copy = { ...plan };
  delete copy.digest;
  const actual = digest(JSON.stringify(copy));
  if (actual !== plan.digest) throw new Error('stale plan: plan digest mismatch');
  return plan.digest;
}

function verify(input) {
  if (input.approve !== true) throw new Error('--approve required to apply');
  const plan = readPlan(input.plan);
  const actualPlanDigest = planDigest(plan);
  if (
    typeof input.planDigest !== 'string' ||
    input.planDigest.toLowerCase() !== actualPlanDigest.toLowerCase()
  )
    throw new Error('stale plan: plan digest could not be verified');
  const root = realRoot(input.target);
  const planRoot = realRoot(plan.target);
  if (root !== planRoot) throw new Error('target root does not match the plan');
  if (!Array.isArray(plan.files) || !Array.isArray(plan.findings))
    throw new Error('plan manifest fields invalid');
  const seen = new Set();
  const files = plan.files.map((record) => {
    if (!record || typeof record !== 'object') throw new Error('plan file record invalid');
    const relative = safeRelative(record.file);
    if (seen.has(relative)) throw new Error('plan file record duplicated');
    seen.add(relative);
    if (typeof record.digest !== 'string' || !/^[a-f0-9]{64}$/i.test(record.digest))
      throw new Error(`file digest invalid: ${relative}`);
    const absolute = path.resolve(root, relative);
    const outside = path.relative(root, absolute);
    if (outside === '..' || outside.startsWith(`..${path.sep}`) || path.isAbsolute(outside))
      throw new Error('plan file path outside root');
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new Error(`target file invalid: ${relative}`);
    const actual = digest(fs.readFileSync(absolute));
    if (actual.toLowerCase() !== record.digest.toLowerCase())
      throw new Error(`stale plan: file digest mismatch: ${relative}`);
    return { file: relative, digest: actual };
  });
  const findings = plan.findings.map((finding) => {
    if (!finding || typeof finding.file !== 'string') throw new Error('finding file invalid');
    const relative = safeRelative(finding.file);
    if (!seen.has(relative)) throw new Error(`finding not in plan files: ${relative}`);
    return { ...finding, file: relative };
  });
  return {
    type: 'teknesyum-ui-checkup-manifest',
    version: 1,
    approved: true,
    writeTarget: false,
    handoff: 'ui-builder/relay',
    target: root,
    planDigest: actualPlanDigest,
    catalog: plan.catalog,
    files,
    findings,
  };
}

try {
  const input = parseArgs();
  if (input.help) help();
  else process.stdout.write(`${JSON.stringify(verify(input))}\n`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
