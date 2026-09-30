const fs = require('fs');
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
    baglam: 'teknesyum-ui raf: bekleyen kitap: ' + adlar + '. Kendiliğinden başlama; kullanıcı `uc` yazınca ya da kitabın konusu olan dosyaya yazarken uygulanır.',
    mesaj: 'teknesyum-ui: raf kitabı bekliyor — ' + bekleyen.map((b) => b.ad).join(', '),
  };
}

function uiNotu(root, a) {
  const kur = O.komut('setup.js', '--apply --project "' + root + '"');

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
      baglam: 'teknesyum-ui: bu projenin arayüzü ' + neden + '. Kendiliğinden başlama; kullanıcı `uc` yazınca ele alınır.',
      mesaj: 'teknesyum-ui: arayüz ' + neden + ' — `uc` yazınca ele alınır.',
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
    baglam: 'teknesyum-ui: arayüzde ' + acik.length + ' açık bulgu var (' + kurallar + '). Kendiliğinden başlama; kullanıcı `uc` yazınca ele alınır.',
    mesaj: 'teknesyum-ui: ' + acik.length + ' açık arayüz bulgusu — `uc` yazınca ele alınır.',
  };
}

function guncelNotu(root) {
  const U = require(path.join(O.PLUGIN, 'scripts', 'uc.js'));
  let cfg = null;
  try {
    cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'teknesyum-ui.json'), 'utf8'));
  } catch {
    return null;
  }
  const b = U.bekliyor(cfg);
  if (!b) return null;
  return {
    baglam: 'teknesyum-ui: UI güncellemesi bekliyor (' + b.eski + ' → ' + b.yeni + '). Kullanıcının ilk isteğinden önce kendiliğinden uygula, tam uc yapma; talimat aşağıda.\n' + U.guncelle(root, cfg),
    mesaj: 'teknesyum-ui: UI güncellemesi ' + b.eski + ' → ' + b.yeni + ' bu oturumda kendiliğinden uygulanacak',
  };
}

function topluNotu(root) {
  const U = require(path.join(O.PLUGIN, 'scripts', 'uc.js'));
  const surum = U.surum();
  if (!surum) return null;
  const durum = path.join(O.configRoot(), 'teknesyum-ui', 'toplu.json');
  const onceki = O.read(durum);
  if (onceki && onceki.surum === surum) return null;
  const kok = process.env.TEKNESYUM_UI_TOPLU_KOK || path.dirname(root);
  const yazilan = U.toplu(kok, true).filter((s) => s.yazildi).map((s) => s.ad);
  try {
    fs.mkdirSync(path.dirname(durum), { recursive: true });
    fs.writeFileSync(durum, JSON.stringify({ surum, kok, tarih: new Date().toISOString(), yazilan }, null, 2) + '\n');
  } catch {}
  return yazilan.length ? 'teknesyum-ui ' + surum + ': ' + yazilan.length + ' projenin defterine uc satırı yazıldı — ' + yazilan.join(', ') : null;
}

O.girdi((g) => {
  if (g.source === 'compact') return null;
  const root = O.gitRoot(g.cwd || process.cwd());
  if (!root) return null;
  const toplu = topluNotu(root);
  const sadeceToplu = toplu ? { systemMessage: toplu } : null;
  if (O.kendisi(root)) return sadeceToplu;
  const a = O.ayar(root);
  if (!a.var || a.off) return sadeceToplu;
  const guncel = guncelNotu(root);
  const notlar = guncel ? [guncel] : [rafNotu(root), uiNotu(root, a)].filter(Boolean);
  if (!notlar.length) return sadeceToplu;
  const o = { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notlar.map((n) => n.baglam).join('\n\n') } };
  const mesaj = [toplu].concat(notlar.map((n) => n.mesaj)).filter(Boolean).join(' · ');
  if (mesaj) o.systemMessage = mesaj;
  return o;
});
