const path = require('path');
const { spawnSync } = require('child_process');
const O = require('./ortak');

const SKILL = 'teknesyum-ui skill\'ini yükle (Skill aracı, ad: teknesyum-ui:teknesyum-ui)';

function rafNotu(root) {
  let bekleyen = [];
  try {
    bekleyen = O.raf().bekleyen(root);
  } catch {
    return null;
  }
  if (!bekleyen.length) return null;
  const adlar = bekleyen.map((b) => b.ad + ' (' + b.neden + ')').join(', ');
  return {
    baglam:
      'teknesyum-ui raf: Özel rafta bu projeye uyan kitap var: ' + adlar + '. Raf eklentinin kendi kuralıdır, uymak zorunlu. Kullanıcının isteğine geçmeden ÖNCE her kitap için: `' +
      O.komut('raf.js', '<ad>') + '` ile oku, projeyi kitaba uydur, sonra `' + O.komut('raf.js', '--uydu <ad> --project "' + root + '"') +
      '` ile kaydet; kitabın şartları geçmezse kayıt reddedilir, düzeltip yinele. Sonra iki satır rapor ver ve isteğe dön.',
    mesaj: 'teknesyum-ui: raf kitabı uygulanacak — ' + bekleyen.map((b) => b.ad).join(', '),
  };
}

function uiNotu(root, a) {
  const kur = O.komut('setup.js', '--apply --project "' + root + '"');
  const tara = O.komut('scan.js', '"' + root + '" --fix');

  if (!O.uiVar(root)) {
    if (a.project) return null;
    return {
      baglam: 'teknesyum-ui: Bu projede henüz arayüz dosyası yok. Arayüz yazılacaksa ilk dosyadan önce ' + SKILL + ' ve `' + kur + '` çalıştır. Düzen, kullanıcının önizlemede kaydettiği Benim Token Dosyam\'dır; değer uydurma, token oku.',
      mesaj: null,
    };
  }

  const d = O.duzen();
  const denetim = a.project && a.project.denetim;
  const neden = !a.project ? 'UI düzenine göre hiç kurulmadı' : !denetim ? 'UI düzenine göre hiç denetlenmedi' : d && denetim.duzen !== d ? 'kayıtlı UI düzeni değiştiği için yeniden denetlenmeli' : null;
  if (neden)
    return {
      baglam: 'teknesyum-ui: Bu projenin arayüzü ' + neden + '. Kullanıcının isteğine geçmeden ÖNCE bunu yap: 1) ' + SKILL + '. 2) `' + kur + '`. 3) `' + tara + '`. 4) Kalan bulguları skill\'in önceliğiyle düzelt ve taramayı 0 açık olana dek yinele; 0 açıkta denetim kendiliğinden kaydedilir. 5) Kullanıcıya iki satırlık rapor ver, sonra onun isteğine dön.',
      mesaj: 'teknesyum-ui: arayüz ' + neden + ' — önce UI denetimi yapılacak.',
    };

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
  return {
    baglam: 'teknesyum-ui: Arayüzde ' + acik.length + ' açık bulgu var (' + kurallar + '). Kullanıcının isteğine geçmeden ÖNCE ' + SKILL + ', `' + tara + '` çalıştır, kalanları düzelt ve 0 açığa indir; sonra iki satır rapor ver ve isteğe dön.',
    mesaj: 'teknesyum-ui: ' + acik.length + ' açık arayüz bulgusu — önce düzeltilecek.',
  };
}

O.girdi((g) => {
  if (g.source === 'compact') return null;
  const root = O.gitRoot(g.cwd || process.cwd());
  if (!root || O.kendisi(root)) return null;
  const a = O.ayar(root);
  if (!a.var || a.off) return null;
  const notlar = [rafNotu(root), uiNotu(root, a)].filter(Boolean);
  if (!notlar.length) return null;
  const o = { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notlar.map((n) => n.baglam).join('\n\n') } };
  const mesaj = notlar.map((n) => n.mesaj).filter(Boolean).join(' · ');
  if (mesaj) o.systemMessage = mesaj;
  return o;
});
