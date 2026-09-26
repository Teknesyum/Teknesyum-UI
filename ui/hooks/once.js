const fs = require('fs');
const os = require('os');
const path = require('path');
const O = require('./ortak');

function reddet(neden) {
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: neden } };
}

function durumYolu(oturum) {
  return path.join(os.tmpdir(), 'teknesyum-ui', 'raf-' + String(oturum || 'yok').replace(/[^\w-]/g, '') + '.json');
}

function rafReddi(root, dosya, oturum) {
  let raf;
  try {
    raf = O.raf();
    if (!raf.var()) return null;
  } catch {
    return null;
  }
  const rel = path.relative(root, dosya).split(path.sep).join('/');
  const kayit = raf.kayit(root);
  const yol = durumYolu(oturum);
  const gorulen = new Set(O.read(yol) || []);
  const kitap = raf.kitaplar().find((k) => k.meta.tetik && k.meta.tetik.test(rel) && !gorulen.has(k.ad) && (!kayit[k.ad] || kayit[k.ad].ozet !== k.ozet));
  if (!kitap) return null;
  gorulen.add(kitap.ad);
  try {
    fs.mkdirSync(path.dirname(yol), { recursive: true });
    fs.writeFileSync(yol, JSON.stringify([...gorulen]));
  } catch {}
  return reddet(
    'teknesyum-ui raf: `' + rel + '` özel raftaki ' + kitap.ad + ' kitabının konusu ve bu projede o kitap ' + (kayit[kitap.ad] ? 'değiştiğinden beri' : 'henüz') +
      ' uygulanmadı. Önce `' + O.komut('raf.js', kitap.ad) + '` ile oku ve yazacağını ona göre kur; bitince `' +
      O.komut('raf.js', '--uydu ' + kitap.ad + ' --project "' + root + '"') + '` ile kaydet. Sonra yazmayı yeniden dene.'
  );
}

O.girdi((g) => {
  const t = g.tool_input || {};
  const yazilan = t.file_path || t.notebook_path;
  if (!yazilan) return null;
  const dosya = path.resolve(g.cwd || process.cwd(), yazilan);
  const root = O.gitRoot(path.dirname(dosya));
  if (!root || O.kendisi(root)) return null;
  const a = O.ayar(root);
  if (!a.var || a.off) return null;
  if (O.UI_FILE.test(dosya) && !a.project)
    return reddet(
      'teknesyum-ui: Bu projede UI düzeni kurulmadı. Arayüz dosyası yazmadan önce teknesyum-ui skill\'ini yükle ve `' +
        O.komut('setup.js', '--apply --project "' + root + '"') +
        '` çalıştır; sonra token\'ları okuyarak yazmayı yeniden dene.'
    );
  return rafReddi(root, dosya, g.session_id);
});
