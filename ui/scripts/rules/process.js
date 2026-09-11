'use strict';

const CODE = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'];
const SYNC_CALL = /\b(?:execFileSync|execSync|spawnSync)\b/;
const UI_PROCESS = /require\(\s*['"]electron['"]\s*\)|from\s+['"]electron['"]|@tauri-apps\/api/;
const SEND_SYNC = /\bipcRenderer\s*\.\s*sendSync\s*\(/;

function code(line) {
  return String(line).replace(/\/\/.*$/, '');
}

module.exports = {
  id: 'process',

  lineRules: [
    {
      id: 'send-sync',
      severity: 'error',
      exts: CODE,
      test(line) {
        if (SEND_SYNC.test(code(line)))
          return 'ipcRenderer.sendSync freezes the renderer until main answers: use ipcRenderer.invoke.';
        return null;
      },
    },
  ],

  fileRules: [
    {
      id: 'sync-child-process',
      severity: 'error',
      exts: CODE,
      check(file, text) {
        if (!SYNC_CALL.test(text) || !UI_PROCESS.test(text)) return [];
        const out = [];
        text.split(/\r?\n/).forEach((line, i) => {
          const hit = SYNC_CALL.exec(code(line));
          if (hit)
            out.push({
              line: i + 1,
              message:
                hit[0] + ' in a UI process freezes the window: use execFile / spawn behind a promise.',
            });
        });
        return out;
      },
    },
  ],
};
