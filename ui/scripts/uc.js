#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const raf = require('./raf');

const SCRIPTS = __dirname;

function js(ad) {
  return 'node "' + path.join(SCRIPTS, ad) + '"';
}

function gitKok(from) {
  let d = path.resolve(from || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

function oku(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function ayar(kok) {
  try {
    return JSON.parse(oku(path.join(kok, '.claude', 'teknesyum-ui.json')));
  } catch {
    return null;
  }
}

function surum() {
  try {
    return JSON.parse(oku(path.join(SCRIPTS, '..', '.claude-plugin', 'plugin.json'))).version || null;
  } catch {
    return null;
  }
}

function kiyas(a, b) {
  const x = String(a).split('.').map(Number);
  const y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}

function degisiklikler(eski, yeni) {
  const metin = [path.join(SCRIPTS, '..', 'CHANGELOG.md'), path.join(SCRIPTS, '..', '..', 'CHANGELOG.md')].map(oku).find((m) => m != null);
  if (!metin) return [];
  const out = [];
  let al = false;
  for (const satir of metin.replace(/\r\n/g, '\n').split('\n')) {
    const m = /^## \[(\d+\.\d+\.\d+)\]/.exec(satir);
    if (m) al = kiyas(m[1], eski) > 0 && kiyas(m[1], yeni) <= 0;
    else if (/^## /.test(satir)) al = false;
    if (al) out.push(satir);
  }
  return out.filter((l) => l.trim());
}

function git(kok, args) {
  const r = require('child_process').spawnSync('git', ['-C', kok].concat(args), { encoding: 'utf8', windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : null;
}

function rafDuzen() {
  const yol = require('./ozel').tokenYollari();
  const metin = yol ? oku(yol.tokenlar) : null;
  return metin ? require('crypto').createHash('sha256').update(metin).digest('hex').slice(0, 16) : null;
}

function renk(kok, cfg) {
  const u = (cfg && cfg.uc) || {};
  const simdi = rafDuzen();
  return [
    'uc renk: sahibin paleti değişti. Bu bir tazelemedir, dönüşüm değil; birkaç dakikada biter. Dakikalarca sürüyorsa proje yanlış kurulmuştur: nedeni düzelt ki bir sonraki renk değişikliğine tek komut yetsin, ve nedeni rapora tek satır yaz.',
    simdi && u.duzen === simdi ? 'Son uc bu düzenle kaydedilmiş; yapılacak tazeleme yok. Aşağıdaki 2. adımı koş, 0 farkı göster, bitir.' : 'Son uc başka bir düzenle kaydedilmiş; tazeleme gerekiyor.',
    'Doğru kuruluş (bir kez yapılır, sonra her renk değişikliği tek komuttur): düzenin tek kaynağı `teknesyum-ui/` altındaki üretilmiş dosyalardır, projeye kopyalanmaz, elle düzenlenmez, git\'e girer. Avalonia: `App.axaml` içinde `<ResourceInclude Source="avares://<Assembly>/teknesyum-ui/avalonia/Theme.axaml"/>`, `.csproj`\'da `<AvaloniaResource Include="teknesyum-ui\\avalonia\\**"/>`; renkler `{DynamicResource Renk1}` gibi anahtarla okunur. WPF: `App.xaml` birleşik sözlüğüne `teknesyum-ui/wpf/Theme.xaml` (ve States, Forms); `{DynamicResource Renk1}`. React/Tauri/Electron: giriş dosyasında `import \'../teknesyum-ui/react/theme.css\'` (düz web: `teknesyum-ui/css/`), bileşenler yalnız `var(--tk-renk-1)` gibi değişken kullanır. WinForms: `teknesyum-ui/winforms/Palette.cs` derlemeye eklenir, `Palette.Renk1` okunur. Yazılar `labels.tr.json`/`labels.en.json`\'dan gelir. Projenin kendi tema sınıfı varsa varsayılan tema değerlerini bu anahtarlardan alır, kopyasını tutmaz; kullanıcıya sunulan ek paletler kendi dosyalarında durabilir. Tema seçimi saklanıyorsa ayar dosyasında yalnız tema adı durur, renk değeri durmaz; bilinmeyen ya da kaldırılmış ad açılışta düzenin temasına düşer.',
    '1. Tazele: `' + js('setup.js') + ' --apply --project "' + kok + '"`. `teknesyum-ui/` altındaki üretilmiş kaynaklar yenilenir; elle dokunma.',
    '2. Kapı: `' + js('esle.js') + ' --denetle --project "' + kok + '"` 0 fark vermeli. Fark varsa bir renk ya da değer projeye elle yazılmıştır: onu `teknesyum-ui/` kaynağına bağla, kopyasını sil. Rengi yeni değerle elle değiştirmek yasak; bir dahaki sefere yine elle değiştirmek gerekir.',
    '3. Kayıtlı seçim: program tema ya da palet seçimini ayar dosyasında saklıyorsa, sahibin kurulu profili düzenin temasıyla açılmalı. Eski ya da kaldırılmış bir palet kayıtlıysa açılışta düzene göç et. Sahibin gerçek profiliyle aç ve bak; boş profil yetmez.',
    '4. Derle ve gör: renkler derlemede üretilmiş kaynaktan okunmalı. Derle, çalıştır, bir ekran görüntüsü al; önizlemedeki paletle aynı olmalı.',
    '5. Yayınla: projenin sürüm rutiniyle minör sürümü artır, commit, etiket, yayın. Sonra `' + js('uc.js') + ' --bitti --project "' + kok + '"`.',
    "Bu turda yapma: ekran envanteri, artık temizliği, simge, tam denetim. Bunlar tam uc'nin işi; gerekiyorsa tek satırla `.claude/acik.md`'ye yaz.",
  ].join('\n');
}

const ARAYUZ = /\.(axaml|xaml|cs|tsx|jsx|ts|js|css|html|vue|svelte)$/i;

function artim(kok, cfg) {
  const u = cfg && cfg.uc;
  if (!u || !u.surum) return null;
  const simdi = surum();
  const satir = [];
  const surumDegisti = !!simdi && kiyas(simdi, u.surum) > 0;
  const guncel = rafDuzen() || cfg.duzen;
  const duzenDegisti = !!(u.duzen && guncel && u.duzen !== guncel);
  if (surumDegisti) {
    satir.push('Son uc ' + u.surum + ' sürümünde tamamlandı, eklenti şimdi ' + simdi + '. Baştan tarama yapma: yalnız bu iki sürüm arasındaki değişiklikleri uygula ve yalnız onlardan etkilenen ekranları denetle:');
    satir.push(...degisiklikler(u.surum, simdi));
  } else satir.push('Son uc ' + u.surum + ' sürümünde tamamlandı ve eklenti değişmedi. Baştan tarama yapma.');
  if (duzenDegisti) satir.push('Sahibin düzeni o günden beri değişti: tazeleme üretilmiş kaynakları yeniler; elle yazılmış değer kalmadıysa ekranlar kendiliğinden uyar, yalnız yan yana görüntüyle doğrula.');
  const liste = [u.commit ? git(kok, ['diff', '--name-only', u.commit]) : null, git(kok, ['ls-files', '--others', '--exclude-standard'])]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter((d) => d && ARAYUZ.test(d) && !d.startsWith('teknesyum-ui/'));
  if (u.commit) satir.push(liste.length ? "Projede son uc'dan beri değişen arayüz dosyaları (yalnız bunları dönüştür ve denetle): " + liste.join(', ') : "Projede son uc'dan beri arayüz dosyası değişmedi.");
  if (!surumDegisti && !duzenDegisti && u.commit && !liste.length) satir.push('Yapılacak dönüşüm yok: tazeleme ve kapıyı koş, 0 farkı göster, bitir.');
  return satir.join('\n');
}

function bekliyor(cfg) {
  const u = cfg && cfg.uc;
  const simdi = surum();
  if (!u || !u.surum || !simdi || cfg.off) return null;
  return kiyas(simdi, u.surum) > 0 ? { eski: u.surum, yeni: simdi } : null;
}

const PENCERE = 'Ana pencere: tersi istenmedikçe (config `pencere: "normal"` değilse) ekranı kaplayarak açılır — Avalonia/WPF `WindowState="Maximized"`, Electron `win.maximize()`, Tauri `"maximized": true`. Kayıtlı yerleşim yalnız normal boyut ve konumu geri yükler, açılış hep kaplayan. Kurulum ve küçük sabit araç pencereleri hariç. `kabuk/pencere-maximize` bulgusu kalmaz.';

function guncelle(kok, cfg) {
  const b = bekliyor(cfg);
  if (!b) return 'UI güncel: son uc ' + ((cfg && cfg.uc && cfg.uc.surum) || 'yok') + ', eklenti ' + surum() + '. Yapılacak güncelleme yok.';
  return [
    'UI güncellemesi (ucupdate) ' + b.eski + ' → ' + b.yeni + '. Tam uc değildir: ekran envanteri, baştan tarama, artık temizliği ve raf kitabı yok. Yalnız aşağıdaki sürüm notlarında bu projeye dokunan maddeleri uygula; projede karşılığı olmayan maddeyi tek satır gerekçeyle geç.',
    ...degisiklikler(b.eski, b.yeni),
    'Adımlar:',
    '1. Tazele: `' + js('setup.js') + ' --apply --project "' + kok + '"`. Üretilmiş `teknesyum-ui/` dosyaları elle düzeltilmez.',
    '2. Uygula: yeni şablon parçası gerekiyorsa `' + js('scaffold.js') + '` ile al, yeni kuralın bulgusunu kapat. Yalnız maddelerin etkilediği dosyalara dokun.',
    '3. Tara: `' + js('scan.js') + ' "' + kok + '"`. Bu sürümlerde eklenen kurallarda açık bulgu kalmaz; eski bulgular bu işin konusu değil, sayısını rapora yaz.',
    '4. Kapı: `' + js('esle.js') + ' --denetle --project "' + kok + '"` 0 fark. Derle ve projenin testlerini koş.',
    '5. Kaydet: `' + js('uc.js') + ' --bitti --project "' + kok + '"`. Sonra projenin kendi sürüm ve yayın yolunu izle.',
    PENCERE,
    'Sahibe sormadan yap; yalnız simge değişikliği ve geri alınamaz adımlar onay ister. Bitince kullanıcının istediği işe geç.',
  ].join('\n');
}

function defterTikla(kok, surumNo) {
  const defter = path.join(kok, '.claude', 'acik.md');
  const onceki = oku(defter);
  if (!onceki) return;
  const yeni = onceki.replace(/^- \[ \] (uc çalıştır: UI|UI güncellemesi:) (\S+ → \S+)(.*?)( — teknesyum-ui)?$/gm, (_, ad, ok, orta) => '- [x] ' + ad + ' ' + ok + orta + ' — ' + surumNo + ' ile uygulandı');
  if (yeni !== onceki) fs.writeFileSync(defter, yeni, 'utf8');
}

function bitti(kok) {
  const cfg = ayar(kok);
  if (!cfg) return { hata: 'proje bağlı değil: .claude/teknesyum-ui.json yok' };
  const farklar = require('./esle').denetle({ proje: kok });
  if (farklar.length) return { hata: 'düzen eşleşmesi ' + farklar.length + ' fark; kayıt yazılmadı\n' + farklar.map((f) => '  - ' + f).join('\n') };
  cfg.uc = { surum: surum(), duzen: cfg.duzen || null, commit: git(kok, ['rev-parse', 'HEAD']), tarih: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(path.join(kok, '.claude', 'teknesyum-ui.json'), JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  defterTikla(kok, cfg.uc.surum);
  return { uc: cfg.uc };
}

function toplu(kok, yaz) {
  const simdi = surum();
  const out = [];
  let adlar = [];
  try {
    adlar = fs.readdirSync(kok, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return out;
  }
  for (const ad of adlar) {
    const proje = path.join(kok, ad);
    const cfg = ayar(proje);
    if (!cfg || cfg.off) continue;
    const eski = (cfg.uc && cfg.uc.surum) || null;
    if (eski && simdi && kiyas(eski, simdi) >= 0) continue;
    const satir = { ad, proje, eski, yeni: simdi, yazildi: false };
    if (yaz) {
      const defter = path.join(proje, '.claude', 'acik.md');
      const onceki = oku(defter) || '';
      const t = new Date();
      const zaman = t.toISOString().slice(0, 10) + ' ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
      const is = eski
        ? '- [ ] UI güncellemesi: ' + eski + ' → ' + simdi + ' (oturum başında kendiliğinden uygulanır: `' + js('uc.js') + ' guncelle`) — ' + zaman + ' — teknesyum-ui'
        : '- [ ] uc çalıştır: UI hiç → ' + simdi + ' (`' + js('uc.js') + '` çıktısını izle, bitince `--bitti`) — ' + zaman + ' — teknesyum-ui';
      const acik = /^- \[ \] (?:uc çalıştır: UI|UI güncellemesi:) \S+ → (\S+) .*$/m.exec(onceki);
      if (!acik) {
        fs.mkdirSync(path.dirname(defter), { recursive: true });
        fs.writeFileSync(defter, (onceki && !onceki.endsWith('\n') ? onceki + '\n' : onceki) + is + '\n', 'utf8');
        satir.yazildi = true;
      } else if (simdi && kiyas(acik[1], simdi) < 0) {
        fs.writeFileSync(defter, onceki.replace(acik[0], () => is), 'utf8');
        satir.yazildi = true;
        satir.tazelendi = true;
      }
    }
    out.push(satir);
  }
  return out;
}

function metin(secenek) {
  const s = secenek || {};
  const kok = gitKok(s.cwd) || path.resolve(s.cwd || process.cwd());
  if (/^renk$/i.test(String(s.kapsam || '').trim())) return renk(kok, ayar(kok));
  if (/^(guncelle|güncelle|update|ucupdate)$/i.test(String(s.kapsam || '').trim())) return guncelle(kok, ayar(kok));
  const satirlar = [];
  if (raf.var()) {
    satirlar.push(
      'UI denetimi (uc), teknesyum-ui yönetir. Önce yordamı oku: `' + js('raf.js') + ' ui-denetim`; ölçülen kurallar: `' + js('raf.js') + ' ui-duzeni`. Yordamı sırayla uygula; raf ile eklenti çelişirse eklenti kazanır.'
    );
  } else {
    satirlar.push('UI denetimi (uc), teknesyum-ui yönetir. Bu makinede özel raf yok: yalnız tarayıcının kuralları geçerli, bunu bir kez söyle ve kural uydurma.');
  }
  satirlar.push(
    'uc bir denetim değil, dönüştürme emridir: kullanıcı programın bütün arayüzünü sahibin düzeninde (`ui-duzeni` ve benim.tokens.json) görmek istiyor. Her pencere, panel, sekme, iletişim kutusu ve boş, hata, yükleme hâli düzene geçirilir. Bütün arayüzü dönüştürmeyeceksen, nedeni ne olursa olsun, işe başlamadan ilk mesajında tek cümleyle sor; uzun çalışıp dönüşümsüz rapor getirme.'
  );
  satirlar.push(
    'Bütün uygulamalar aynı düzenden gelir: renk, ölçü, köşe, süre, eğri ve yazı değeri projeye elle yazılmaz, `teknesyum-ui/` altındaki üretilmiş kaynaklara bağlanır; sahip düzeni değiştirince `setup.js --apply` her projeyi günceller. Projenin kendi tema sistemi varsa o da bu token\'lara bağlanır. Marka, destek, güncelleme ve eşitleme yazıları ile pencere başlığı `labels.tr.json`/`labels.en.json` içinden okunur; uygulamada elle yazılmış kopyası kalmaz. Önce ekran envanterini çıkar ve rapora yaz; düzene geçmemiş tek ekran kalırsa iş bitmez.'
  );
  if (!fs.existsSync(path.join(kok, '.claude', 'teknesyum-ui.json')))
    satirlar.push('Proje standarda bağlı değil: önce `' + js('setup.js') + ' --check --project "' + kok + '"`, sonra `--apply --template benim`.');
  else satirlar.push('Başlarken düzeni tazele: `' + js('setup.js') + ' --apply --template benim --project "' + kok + '"`; çıktının sonundaki satır "düzen eşleşmesi 0 fark" olmalı.');
  satirlar.push(
    'Tarama: `' + js('scan.js') + ' "' + kok + '"`. Web kontrastı: `' + js('denetim.js') + ' --snippet` çıktısını sayfada koş. Avalonia/WPF: `' + js('scaffold.js') + ' denetim <Ad>`. Her yazıyı her durumda gerçek zeminine karşı ölç.'
  );
  satirlar.push('Artık: proje gereksiz yer tutmaz. `' + js('artik.js') + ' "' + kok + '"` derleme çıktısı, önbellek, log ve geçici dosyaları ölçer. Ölçtükten sonra aynı komutu `--sil` ile çalıştır: yalnız git\'in yok saydığı ve izlemediği, yeniden üretilebilen kalemleri siler, izlenen hiçbir şeye dokunmaz. Bu turun kanıtı bir kalemin içindeyse önce `docs/ui-denetim/` altına taşı, sonra sil; silmediğin her kalemi tek satır gerekçeyle rapora yaz. Silmeden önceki ve sonraki ölçümü rapora yaz; izlenen büyük dosya ya da `.gitignore`\'da eksik kalem varsa düzelt; `node_modules` ve `trash/` yalnız raporlanır.');
  const onceki = artim(kok, ayar(kok));
  if (onceki) satirlar.push(onceki);
  const bekleyen = raf.bekleyen(kok);
  if (bekleyen.length) satirlar.push('Bekleyen raf kitapları: ' + bekleyen.map((b) => b.ad).join(', ') + '. Denetimle birlikte uydur, `' + js('raf.js') + ' --uydu <ad> --project "' + kok + '"` ile kaydet.');
  satirlar.push(PENCERE);
  satirlar.push(
    'Okunurluk ölçeği: görüntüler 1200x780 pencerede %100/%125/%150 ile alınır; ayrıca 2560x1440, Windows ölçeği %100, ekranı kaplayan pencerede bir çekim al. Ölçü: gövde yazısı etkin ≥20 px, gezinme simgesi ≥ yazı boyutu. Tutmuyorsa uygulama içi ölçeği kur (Avalonia: `scaffold.js ustcubuk` içindeki `UygulamaOlcegi`; diğerlerinde eşdeğeri) ve `okunurluk/simge-taban` uyarılarını kapat; ToolTip ve açılır menü de ölçeği almalı.'
  );
  satirlar.push(
    'Rapor: `docs/ui-denetim/YYYY-MM-DD.md`. Bitiş: düzen eşleşmesi 0 fark (`' + js('esle.js') + ' --denetle --project "' + kok + '"`), sıfır kontrast hatası, sıfır tarayıcı hatası; "çalışıyor" başsız testle, "kullanılabilir" önizleme ile uygulamanın yan yana ekran görüntüsüyle, ayrı kanıt. Bitince kaydet: `' + js('uc.js') + ' --bitti --project "' + kok + '"`; sonraki uc yalnız bu sürümden sonraki değişikliklere bakar.'
  );
  satirlar.push(
    "Simge: programın simgesi (exe, pencere, görev çubuğu, yükleyici) temayla uyumlu değilse yeni bir tasarım hazırla; yalnız rengini token'lara çekmek de yeter. Simgeyi değiştirme kararı sahibindir: yeni simgeyi uygulamadan önce önizlemesini (pencere, görev çubuğu ve masaüstü boyutunda, eskisinin yanında) göster ve açıkça onay iste. Onay gelene kadar simgeyi exe'ye, pencereye, yükleyiciye ya da kısayollara koyma, yayınlama; geri bildirime göre tasarımı yenileyip yeniden göster. Onay bekleyen simge işini `.claude/acik.md`'de açık tut; uc'nin diğer adımları beklemez. Onaydan sonra masaüstündeki ve Başlat menüsündeki kısayolları yeni simgeye güncelle: kısayolun IconLocation'ını yeniden yaz, Windows simge önbelleği eskisini gösterebilir."
  );
  const kapsam = String(s.kapsam || '').trim();
  if (kapsam) satirlar.push('Kapsam: ' + kapsam);
  return satirlar.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node uc.js [--project root] [scope...]\n       node uc.js renk [--project root]\n       node uc.js guncelle [--project root]\n       node uc.js --bitti [--project root]\n       node uc.js --toplu [root] [--yaz]\n\nPrints the UI check instruction that the `uc` mark puts into the turn.\n\n`renk` prints the short refresh path for a palette change: apply, gate,\nsaved theme choice, build, release; no full audit.\n\n`guncelle` prints only what changed since the project\'s last uc: the release\nnotes in between, refresh, new rules, gate, --bitti. The session-start hook\nputs it into the first turn by itself when the plugin is newer than that uc.\n\n--bitti records the finished uc (plugin version, layout, commit) once the\nlayout gate shows 0 differences; the next uc covers only what changed since.\n\n--toplu lists the projects under root (default: the parent folder) whose last\nuc is older than this plugin; --yaz adds one uc line to each project\'s\n.claude/acik.md, once.\n');
    return 0;
  }
  const i = args.indexOf('--project');
  const cwd = i >= 0 ? args[i + 1] : process.cwd();
  const t = args.indexOf('--toplu');
  if (t >= 0) {
    const kok = path.resolve(args[t + 1] && !args[t + 1].startsWith('--') ? args[t + 1] : path.join(process.cwd(), '..'));
    const liste = toplu(kok, args.includes('--yaz'));
    if (!liste.length) process.stdout.write('Güncel olmayan proje yok (' + surum() + ').\n');
    for (const l of liste) process.stdout.write(l.ad + ': ' + (l.eski || 'hiç') + ' → ' + l.yeni + (l.tazelendi ? ' · defterdeki satır tazelendi' : l.yazildi ? ' · deftere yazıldı' : '') + '\n');
    return 0;
  }
  if (args.includes('--bitti')) {
    const r = bitti(gitKok(cwd) || path.resolve(cwd));
    if (r.hata) {
      process.stderr.write(r.hata + '\n');
      return 1;
    }
    process.stdout.write('uc kaydedildi: ' + r.uc.surum + (r.uc.commit ? ' @ ' + r.uc.commit.slice(0, 7) : '') + '\n');
    return 0;
  }
  const kapsam = args.filter((a, n) => i < 0 || (n !== i && n !== i + 1)).join(' ');
  process.stdout.write(metin({ cwd, kapsam }) + '\n');
  return 0;
}

module.exports = { metin, renk, guncelle, bekliyor, bitti, degisiklikler, toplu, surum };

if (require.main === module) process.exitCode = main(process.argv);
