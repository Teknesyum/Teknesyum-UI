const path = require('path');
const O = require('./ortak');

O.girdi((g) => {
  const t = g.tool_input || {};
  const dosya = t.file_path || t.notebook_path;
  if (!dosya || !O.UI_FILE.test(dosya)) return null;
  const root = O.gitRoot(path.dirname(path.resolve(g.cwd || process.cwd(), dosya)));
  if (!root || O.kendisi(root)) return null;
  const a = O.ayar(root);
  if (!a.var || a.off || a.project) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        'teknesyum-ui: Bu projede UI düzeni kurulmadı. Arayüz dosyası yazmadan önce teknesyum-ui skill\'ini yükle ve `' +
        O.komut('setup.js', '--apply --project "' + root + '"') +
        '` çalıştır; sonra token\'ları okuyarak yazmayı yeniden dene.',
    },
  };
});
