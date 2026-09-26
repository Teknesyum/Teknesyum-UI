const path = require('path');
const { spawnSync } = require('child_process');
const O = require('./ortak');

function cikti(baglam, mesaj) {
  const o = { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: baglam } };
  if (mesaj) o.systemMessage = mesaj;
  return o;
}

O.girdi((g) => {
  if (g.source === 'compact') return null;
  const root = O.gitRoot(g.cwd || process.cwd());
  if (!root || O.kendisi(root)) return null;
  const a = O.ayar(root);
  if (!a.var || a.off) return null;
  const skill = 'teknesyum-ui skill\'ini yükle (Skill aracı, ad: teknesyum-ui:teknesyum-ui)';
  const kur = O.komut('setup.js', '--apply --project "' + root + '"');
  const tara = O.komut('scan.js', '"' + root + '" --fix');

  if (!O.uiVar(root)) {
    if (a.project) return null;
    return cikti(
      'teknesyum-ui: Bu projede henüz arayüz dosyası yok. Arayüz yazılacaksa ilk dosyadan önce ' + skill + ' ve `' + kur + '` çalıştır. Düzen, kullanıcının önizlemede kaydettiği Benim Token Dosyam\'dır; değer uydurma, token oku.',
      null
    );
  }

  const d = O.duzen();
  const denetim = a.project && a.project.denetim;
  const neden = !a.project ? 'UI düzenine göre hiç kurulmadı' : !denetim ? 'UI düzenine göre hiç denetlenmedi' : d && denetim.duzen !== d ? 'kayıtlı UI düzeni değiştiği için yeniden denetlenmeli' : null;
  if (neden)
    return cikti(
      'teknesyum-ui: Bu projenin arayüzü ' + neden + '. Kullanıcının isteğine geçmeden ÖNCE bunu yap: 1) ' + skill + '. 2) `' + kur + '`. 3) `' + tara + '`. 4) Kalan bulguları skill\'in önceliğiyle düzelt ve taramayı 0 açık olana dek yinele; 0 açıkta denetim kendiliğinden kaydedilir. 5) Kullanıcıya iki satırlık rapor ver, sonra onun isteğine dön.',
      'teknesyum-ui: arayüz ' + neden + ' — önce UI denetimi yapılacak.'
    );

  const r = spawnSync(process.execPath, [path.join(O.PLUGIN, 'scripts', 'scan.js'), root, '--json'], { encoding: 'utf8', timeout: 60000, windowsHide: true });
  let bulgular = [];
  try {
    bulgular = JSON.parse(r.stdout || '[]');
  } catch {
    return null;
  }
  const acik = bulgular.filter((f) => !f.fixed && !f.ignored);
  if (!acik.length) return null;
  const kurallar = [...new Set(acik.map((f) => f.rule))].slice(0, 4).join(', ');
  return cikti(
    'teknesyum-ui: Arayüzde ' + acik.length + ' açık bulgu var (' + kurallar + '). Kullanıcının isteğine geçmeden ÖNCE ' + skill + ', `' + tara + '` çalıştır, kalanları düzelt ve 0 açığa indir; sonra iki satır rapor ver ve isteğe dön.',
    'teknesyum-ui: ' + acik.length + ' açık arayüz bulgusu — önce düzeltilecek.'
  );
});
