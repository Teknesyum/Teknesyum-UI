'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib');

const SKILL_MAX_LINES = 150;
const SKILL_MAX_BYTES = 8 * 1024;
const REFERENCE_MAX_LINES = 130;
const DESCRIPTION_MAX = 300;

function hooksWriteNoContext() {
  const dir = path.join(L.UI, 'hooks');
  const files = fs.readdirSync(dir).filter((n) => n.endsWith('.js'));
  L.ok('there is at least one hook to check', files.length > 0);
  for (const name of files) {
    const body = fs.readFileSync(path.join(dir, name), 'utf8');
    L.ok('no additionalContext in hooks/' + name, !body.includes('additionalContext'));
    L.ok('no systemMessage in hooks/' + name, !body.includes('systemMessage'));
  }
}

function transcript(dir) {
  const file = path.join(dir, 'transcript.jsonl');
  const entry = {
    message: {
      content: [{ type: 'tool_use', input: { file_path: path.join(dir, 'panel.css') } }],
    },
  };
  L.write(file, JSON.stringify(entry) + '\n');
  return file;
}

function guardIsSilent(label, config) {
  const root = L.tmp('tkui-guard-');
  L.write(path.join(root, 'panel.css'), '.a { color: #fff; }\n');
  if (config) L.write(path.join(root, '.claude', 'teknesyum-ui.json'), JSON.stringify(config, null, 2));
  const payload = {
    session_id: 'test-' + label,
    cwd: root,
    transcript_path: transcript(root),
  };
  const r = L.node(L.GUARD, [], { cwd: root, input: JSON.stringify(payload), env: L.cleanEnv() });
  L.ok('guard exits 0 ' + label, r.status === 0, 'status ' + r.status);
  L.ok(
    'guard writes zero bytes ' + label,
    r.stdout.length === 0 && r.stderr.length === 0,
    JSON.stringify({ out: r.stdout, err: r.stderr })
  );
}

function skillBudget() {
  const file = path.join(L.SKILL, 'SKILL.md');
  const text = fs.readFileSync(file, 'utf8');
  const count = text.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(text, 'utf8');
  L.ok('SKILL.md is at most ' + SKILL_MAX_LINES + ' lines', count <= SKILL_MAX_LINES, count + ' lines');
  L.ok('SKILL.md is at most 8 KB', bytes <= SKILL_MAX_BYTES, bytes + ' bytes');

  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  L.ok('SKILL.md has frontmatter', !!front);
  const description = front ? (/^description:\s*(.+)$/m.exec(front[1]) || [])[1] : null;
  L.ok('SKILL.md declares a description', typeof description === 'string' && description.length > 0);
  L.ok(
    'the description is at most ' + DESCRIPTION_MAX + ' characters',
    typeof description === 'string' && description.trim().length <= DESCRIPTION_MAX,
    description ? description.trim().length + ' characters' : 'missing'
  );
}

function referenceBudget() {
  const dir = path.join(L.SKILL, 'references');
  const names = fs.readdirSync(dir).sort();
  L.ok('references/ holds platform.md only', names.length === 1 && names[0] === 'platform.md', names.join(' '));
  if (names.includes('platform.md')) {
    const count = L.lines(path.join(dir, 'platform.md'));
    L.ok(
      'platform.md is at most ' + REFERENCE_MAX_LINES + ' lines',
      count <= REFERENCE_MAX_LINES,
      count + ' lines'
    );
  }
}

function noSlashCommands() {
  L.ok('the plugin ships no commands/ directory', !fs.existsSync(path.join(L.UI, 'commands')));
  const stray = L.walk(L.UI).filter((f) => /[\\/]commands[\\/]/.test(f));
  L.ok('no command file anywhere in the plugin', stray.length === 0, stray.join(' '));
}

module.exports = function cost() {
  hooksWriteNoContext();
  guardIsSilent('with no config', null);
  guardIsSilent('with off: true', { version: '1.1.0', off: true, template: 'neon', targets: ['css'] });
  skillBudget();
  referenceBudget();
  noSlashCommands();
};
