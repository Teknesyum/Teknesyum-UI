const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CONFIG_NAME = 'teknesyum-ui.json';
const MAX_BLOCKS = 2;
const MAX_TEXT = 200;
const UI_FILE = /\.(css|tsx|jsx|xaml|axaml)$|\.xaml\.cs$/i;

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  try {
    decide(JSON.parse(raw));
  } catch {}
  process.exit(0);
});

function home() {
  return process.env.USERPROFILE || process.env.HOME || '.';
}

function configRoot() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(home(), '.claude');
}

function read(f) {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return null;
  }
}

function write(f, data) {
  const tmp = f + '.' + process.pid + '.tmp';
  try {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, f);
  } catch {
    try {
      fs.unlinkSync(tmp);
    } catch {}
  }
}

function safe(s) {
  return String(s)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
}

function config(root) {
  const machine = read(path.join(configRoot(), CONFIG_NAME));
  const project = read(path.join(root, '.claude', CONFIG_NAME));
  if (!machine && !project) return null;
  return Object.assign({}, machine || {}, project || {});
}

function stateFile(session) {
  return path.join(configRoot(), 'teknesyum-ui', 'guard-' + safe(session || 'main') + '.json');
}

function touched(transcript, state) {
  let size = 0;
  try {
    size = fs.statSync(transcript).size;
  } catch {
    return null;
  }
  let from = Number(state.offset) || 0;
  if (from > size) from = 0;
  state.offset = size;
  if (from === size) return [];
  let chunk = '';
  try {
    const fd = fs.openSync(transcript, 'r');
    const buf = Buffer.alloc(size - from);
    fs.readSync(fd, buf, 0, buf.length, from);
    fs.closeSync(fd);
    chunk = buf.toString('utf8');
  } catch {
    return null;
  }
  const out = [];
  for (const line of chunk.split('\n')) {
    if (!line.trim()) continue;
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    const content = j && j.message && j.message.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || part.type !== 'tool_use' || !part.input) continue;
      const target = part.input.file_path || part.input.notebook_path || '';
      if (target && UI_FILE.test(String(target))) out.push(String(target));
    }
  }
  return out;
}

function scan(script, root) {
  const r = spawnSync(process.execPath, [script, root, '--json'], {
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.error || r.status === 2 || r.status === null) return null;
  let j;
  try {
    j = JSON.parse(String(r.stdout || ''));
  } catch {
    return null;
  }
  const items = Array.isArray(j) ? j : Array.isArray(j && j.findings) ? j.findings : null;
  return items && items.length ? items : null;
}

function where(f) {
  const file = String((f && (f.file || f.path)) || '').replace(/\\/g, '/');
  if (!file) return null;
  const line = f.line || (f.loc && f.loc.line) || 0;
  return { file, at: path.basename(file) + (line ? ':' + line : '') };
}

function text(count, at, script, root) {
  const s = script.replace(/\\/g, '/');
  const head = count + (count === 1 ? ' UI violation, ' : ' UI violations, first ') + at + '.';
  for (const cmd of ['node ' + s + ' ' + String(root).replace(/\\/g, '/'), 'node ' + s + ' .']) {
    const full = head + ' Run: ' + cmd;
    if (full.length <= MAX_TEXT) return full;
  }
  return (head + ' Run: node ' + path.basename(s) + ' .').slice(0, MAX_TEXT);
}

function decide(j) {
  if (j.stop_hook_active) return;
  const root = path.resolve(j.cwd || process.env.CLAUDE_PROJECT_DIR || '.');
  const cfg = config(root);
  if (!cfg || cfg.off === true) return;

  const transcript = j.transcript_path || '';
  if (!transcript) return;
  const file = stateFile(j.session_id);
  const state = read(file) || { offset: 0, blocks: {} };
  const changed = touched(transcript, state);
  if (!changed || !changed.length) return write(file, state);
  write(file, state);

  const script = path.join(__dirname, '..', 'scripts', 'scan.js');
  if (!fs.existsSync(script)) return;
  const findings = scan(script, root);
  if (!findings) return;

  if (!state.blocks || typeof state.blocks !== 'object') state.blocks = {};
  let spot = null;
  for (const f of findings) {
    const w = where(f);
    if (!w) continue;
    if ((state.blocks[safe(w.file)] || 0) >= MAX_BLOCKS) continue;
    spot = w;
    break;
  }
  if (!spot) return;

  state.blocks[safe(spot.file)] = (state.blocks[safe(spot.file)] || 0) + 1;
  write(file, state);
  process.stderr.write(text(findings.length, spot.at, script, root));
  process.exit(2);
}
