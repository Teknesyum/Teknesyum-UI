<!-- lang -->

[<img src="assets/badge-lang.tr.svg" alt="Türkçe seçili, switch to English" width="124" height="44">](README.md)

# Teknesyum UI

Claude Code için bir arayüz standardı; modelin okuması gereken bir belge olarak değil,
veri artı bir tarayıcı olarak gelir.

[Teknesyum Core](https://github.com/Teknesyum/Teknesyum-Core) yalnızca bir iş aktarıcısı
olarak kalsın diye Teknesyum Base'den ayrıldı. Core'un görünüm hakkında hiçbir görüşü
yoktur; görüşün tamamı bu projededir.

**Siz istemedikçe kapalıdır.** Standart yalnızca bir `teknesyum-ui.json` bulunan yerde
geçerlidir. Eklentiyi kurmak tek başına hiçbir şeyi değiştirmez.

---

## Fikir

Bir "standart" belgesinin içerdiği şeylerin çoğu ya modelin zaten yaptığı bir şeydir ya da
bir sayıdır. İkisinin de bağlam penceresinde yeri yoktur.

| Kural türü | Nerede yaşar | Ne kadar tutar |
|---|---|---|
| Bir değer — renk, yarıçap, süre, ölçek adımı | projenizdeki üretilmiş token dosyaları | hiç; gerektiğinde birini okursunuz |
| Mekanik olarak denetlenebilir bir kural | `scan.js` | hiç; çalışır, okunmaz |
| Yazılı standardın kendisi, düz metin | özel raf, konu başına bir kitap | hiç; kitap, işi başladığında bir kez okunur |
| Rafa nasıl gidilir ve ne koşulur | `SKILL.md`, 80 satır | bir kez, arayüz işi başladığında |

Base, her arayüz konusu açıldığında `SKILL.md` için yaklaşık 27.000 ve sekiz referans dosyası
için 55.000 token daha harcıyordu. Bu proje 97 tarayıcı kuralı, 80 satırlık tek bir skill ve
iki referans dosyası ile gelir.

## Kurallar nerede yaşar

Standardın düz metin yarısı bu depoda değil.
[Teknesyum Core](https://github.com/Teknesyum/Teknesyum-Core)'un tuttuğu özel rafta duruyor —
`TEKNESYUM_PRIVATE` ya da `<yapılandırma>/teknesyum-private/private/tercihler/` — konu başına
bir kitap. Bir kuralı orada bir kez anlatırsınız; hem skill hem şablon üreteci onu izler.

```bash
node <plugin>/scripts/raf.js                     # kitapları listeler
node <plugin>/scripts/raf.js guncelleme-paneli   # birini okur
```

| İş | Kitap |
|---|---|
| Herhangi bir arayüz değişikliği | `ui-duzeni` |
| Güncelleme, kurulum ya da eşitleme yüzeyi | `guncelleme-paneli` |
| README ya da depo belgesi | `readme-protokolu` |

Bir kitap oturum başına bir kez okunur. Skill bunu söyler, Stop kancası da kendi belleğini
tutar: bir bulguyu dosya başına bir kez söyler ve sohbet compact edilene kadar tekrarlamaz.

## Kurulum

```bash
/plugin marketplace add Teknesyum/Teknesyum-Core
```

Tek marketplace iki eklentiyi de taşır: Core'un marketplace'i bu eklentiyi, bu deponun `ui/`
klasörünü gösteren bir `git-subdir` kaynağı olarak listeler; buradaki
`.claude-plugin/marketplace.json` ise yalnızca deponun yerel geliştirme için tek başına bir
marketplace olarak eklenebilmesini sağlar. Sonra `/plugin install teknesyum-ui@teknesyum`.

Ardından, istediğiniz projede:

```bash
node <plugin>/scripts/setup.js
```

Kendi terminalinizde çalıştırırsanız sorularını kendisi sorar ve hiçbir şeye mal olmaz.
Claude Code içinde çalıştırırsanız neye ihtiyacı olduğunu yazdırır, model bir kez sorar ve
yanıtlarla `--apply` çağırır.

`<proje>/.claude/teknesyum-ui.json` dosyasını yazar ve seçtiğiniz hedefler için temayı
`<proje>/teknesyum-ui/` altına üretir: `css`, `react`, `wpf`, `avalonia`, `winforms`. Avalonia imzası `Signature.axaml.example` olarak gelir: bir
yerelleştirme uzantısı ve `Click` işleyicisi ister, kendi görünümünüze kopyalayın.

Neon hazır yanıttır, tek yanıt değil — `--template custom` üç marka rengi ve bir yüzey alır,
gerisini aynı formüllerle türetir.

## İşinizi denetleyin

```bash
node <plugin>/scripts/scan.js <proje-kökü>
```

`0` temiz, `1` bulgu var, `2` yapılandırılmamış ya da kapalı. Makine çıktısı için `--json`,
güvenle otomatikleştirilebilen onarımlar için `--fix`, neyi uyguladığını görmek için
`--list-rules`, proje çapı kurallar bütün ağacı okurken yalnız dokunulan dosyaları raporlaması için
`--files a.css,b.tsx`. `--fix` sonsuz
bir animasyonun süresine dokunmaz, yalnız raporlar: döngünün düzeltmesi süresi değil tekrarıdır.

Arayüz dosyaları değiştiğinde bir Stop kancası aynı taramayı çalıştırır ve ihlalde durdurur.
Yapılandırma yoksa ya da `off: true` ayarlıysa hiç iş yapmadan çıkar; aynı dosyada iki
engelden sonra geri çekilir, böylece gerçek bir anlaşmazlık işi değil kapıyı durdurur.
Yalnız o turda değişen dosyaları tarar, yalnız açık bulguları sayar (`ignored` ya da `fixed`
olanları asla) ve aynı sohbette söylediği bulguyu bir daha söylemez.

### Kontrast

Token'lardaki her dolgunun bir `on` eşi vardır: üstüne gelen yazı rengi. `generate.js` her
eşi ölçer, saydam dolguyu önce yüzeyin üstüne bindirir, 7:1'in altındaki ilk eşte durur ve eşi
oranıyla yazar. Eşler CSS'e `--tk-on-*`, XAML'e `On*` fırçaları olarak çıkar.

`okunurluk/pair-contrast` kuralı aynı öğedeki dolguyu ve yazı rengini bulup ölçer. Hex,
`var(--tk-*)`, Tailwind sınıfları (keyfi değerler dahil), başka dosyadaki Static ve Dynamic
kaynaklarla XAML `Background`/`Foreground`, stil setter'ları ve tetikleri, C# çizimi (boyama
yöntemindeki `FillPath`/`FillRectangle` ve `TextRenderer.DrawText`) ve WinForms
`BackColor`/`ForeColor` eşlerini okur. Bulgu şöyle görünür: `bg X on fg Y — 2.1:1, below 7:1`.
`core/contrast` artık yazı olarak kullanılan dolgu renklerini de ölçer; yalnız onaylı yazı
kesimleri muaftır.

Tarayıcı çalışma anında hesaplanan rengi göremez. Onun için çalışan sayfayı denetleyin:

```bash
node <plugin>/scripts/denetim.js http://localhost:5173 [--esik 7] [--hedef 24] [--snippet out.js]
```

Bağımsız bir betik basar. Ajan bu betiği açık sayfada tarayıcının `javascript_tool`'una
verir (Claude in Chrome ya da önizleme paneli). Betik her görünen yazıyı, üst zincir boyunca
bindirilmiş gerçek zeminine karşı ölçer ve eşiğin altındaki eşleri, 24 px'ten küçük tıklanır
hedefleri JSON olarak döndürür. axe-core yok, kurulum yok.

Masaüstü uygulaması için `scaffold.js denetim <Namespace>` pencereyi açıp her yazıyı aynı
biçimde ölçen başsız bir xUnit testi yazar (bkz. Şablonlar).

## Şablonlar

```bash
node <plugin>/scripts/scaffold.js kur <UygulamaAdı> [--simge app/simge.ico] [--anahtar usb-01]
node <plugin>/scripts/scaffold.js ustcubuk
node <plugin>/scripts/scaffold.js durum
node <plugin>/scripts/scaffold.js denetim <Namespace> [--wpf|--avalonia] [--pencere MainWindow] [--esik 7]
```

| Hedef | Yazdığı | Ne olduğu |
|---|---|---|
| `kur` | `Kur.bat`, `kur-<ad>.ps1` | USB kurulum penceresi: adım içinde ilerleyen çubuk, canlı günlük, bitiş ve hata ekranları, `-Prova` deneme kipi. Yerinde günceller; `-Onar` ya da bitiş ekranındaki Onar düğmesi baştan kurar. Her USB kendi deploy anahtarını `.kurulum/anahtar/` altında taşır. |
| `ustcubuk` | `teknesyum-ui/ustcubuk/` | React başlık çubuğu: logo, iki parçalı ad, dil yuvası, sponsor ve marka bağlantıları, pencere düğmeleri, Electron ve Tauri için sürükleme alanı. |
| `durum` | `teknesyum-ui/durum/` | Başlık çubuğu rozetli Electron git eşitlemesi: eşitleniyor, saatiyle eşitlendi, çevrimdışı; tıklayınca hemen eşitler. |
| `denetim` | `teknesyum-ui/denetim/KontrastTests.cs` | Başsız kontrast testi: projede `.axaml` varsa Avalonia.Headless.XUnit (test projesi xunit v3 ister), yoksa STA iş parçacığında `VisualTreeHelper` ile WPF. Her yazı parçasını ve simgeyi, her düğmeyi dinlenik, üstünde, basılı, odakta ve edilgen hâlde, degrade zeminin en kötü durağını ölçer; `tmp/uc/kontrast-*.txt` ile %100/125/150 pencere görüntülerini yazar ve eşiğin altındaki her eşi sayarak başarısız olur. |

Her hedef, yazdığı şeyi yöneten raf kitabının adını söyleyerek biter; raf ya da kitap yoksa
bunu açıkça söyler. Var olan dosyanın üzerine asla yazılmaz. Projeye özgü kurulum adımları `--adimlar <dosya>`
ile girer; varsayılan npm paketlerini ve bir masaüstü kısayolunu kurar. `.kurulum/` ve
`.araclar/` projenin git'ine girmesin.

## Önizleme

```bash
node ui/scripts/onizleme.js [--tarayici [--port 4317] [--no-open]]
```

Kendi Electron penceresinde açılır (`ui/onizleme/masaustu/`, Electron ilk açılışta oraya
kurulur); `--tarayici` aynı sayfayı `127.0.0.1` üstünden sunar. Token'a dokunmadan önce yeni
marka renklerini denemek için bir sayfa.
`ui/templates/neon.tokens.json` değerleriyle açılır ve tarayıcıya olduğu gibi sunulan,
`scan.js`'in kullandığı `kontrast.js` ile ölçer. Sol panel mavi, pembe, yazı kesimleri,
mor, yüzey ve arka planı (düz, token degradesi, cam, ızgara, hale; durak ve açı), yazı
ailesini, boyut ölçeğini, ağırlıkları, yarıçapı, kaydırma çubuğu kalınlığı ve rengini,
kaydırma davranışını ve hareket azaltmayı ayarlar. Sağ taraf her tone-scale kademesini,
text-scale kesimini ve `on` eşini hex'i ve yüzey üstündeki oranıyla gösterir (7:1 altı
işaretlenir); mavi ve pembeyi yan yana, beş durumuyla düğmeleri, rozet, çip, giriş kutusu,
seçili satır, başlık çubuğu, ilerleme, uzun kayan liste, tipografi ölçeği ve panel, kart,
camı gösterir. "Uygulama Parçaları" sekmesi standardın kendi CSS'iyle hazır parçaları çizer:
üst çubuk, senkron ve güncelleme rozetleri, üç durumda kurulum paneli, ilerleme çubukları,
düğmeler, bildirimler, onay penceresi ve form alanları. Önce / Sonra kipi token değerlerini şimdikilerin yanına koyar. Dışa aktarma
yalnız değişen alanları `neon.tokens.json` biçiminde kopyalar ya da indirir. **Kaydet**
bunları yayınlar: değişiklikleri ve sonraki sürümü gösteren onaydan sonra
`ui/scripts/kaydet.js` token kaynağını ve kopyasını yazar, her `on` çiftini ve oran geçen
gerekçeyi yeniden ölçer, kurulum betiği ile fixture'lardaki eski hex'i değiştirir,
`generate.js` ve testleri (tarayıcı dahil) çalıştırır, küçük sürümü artırır, CHANGELOG'u
yazar; ardından commit, etiket, push ve `gh release create` yapar. İlerleme kurulum
panelinde görünür; commit'ten önceki her hata tüm dosyaları geri yükler. Ekran görüntüleri: `docs/onizleme/`.

## Testler

```bash
npm test
```

225 assertion, bağımlılık yok. Yedisi maliyet assertion'ıdır: bir kanca `additionalContext`
ya da `systemMessage` yazmaya başlarsa, `SKILL.md` 150 satırı geçerse ya da bir slash komutu
yeniden belirirse başarısız olurlar.

## Düzen

```
ui/skills/teknesyum-ui/   SKILL.md, references/, assets/
ui/scripts/setup.js       kurulum ve üretim
ui/scripts/generate.js    token -> theme.css, Theme.xaml, Theme.axaml, Palette.cs
ui/scripts/raf.js         özel rafı okur
ui/scripts/scan.js        tarayıcı
ui/scripts/rules/*.js     kurallar, her alan için bir modül
ui/scripts/scaffold.js    bir şablonu projeye kopyalar
ui/templates/             kurulum, başlık çubuğu, eşitleme rozeti, ilerleme çubuğu
ui/hooks/guard.js         Stop kancası
ui/roles/ui-builder.md    bir ajanın arayüz kurmak için okuduğu rol
docs/DECISIONS.md         neden bu biçimde
docs/RULE-API.md          bir kural nasıl yazılır
docs/EXTRACT.md           eski standardın her kuralı ve nereye gittiği
docs/coverage/            tarayıcının neyi uyguladığı, neyi uygulamadığı
```

## Kapatmak

```bash
node <plugin>/scripts/setup.js --off
```

## Katkı

Kod yazmadan önce bir issue açın; böylece kimse zaten sürmekte olan bir işe akşamını
harcamaz. Pull request'i tek konuda tutun — bir düzeltme ile bir özellik aynı dalda olmaz —
ve çevredeki koda uyun.

Depo dili İngilizcedir: kod, commit mesajları, README ve issue'lar. Pull request açmadan önce
`npm test` çalıştırın; kırmızı hiçbir şey birleşmez.

Katkılar projenin kendi lisansı olan AGPL-3.0-or-later altında kabul edilir. Her commit,
[`DCO`](DCO) içinde yer alan Developer Certificate of Origin 1.1 ile imzalanmalıdır —
`git commit -s` ile ekleyin. Bunların uzun hali [`CONTRIBUTING.md`](CONTRIBUTING.md)
içindedir.

## Lisans

AGPL-3.0-or-later. Bkz. [LICENSE](LICENSE).

<div align="center">

<a href="https://github.com/sponsors/Teknesyum"><img src="assets/badge-sponsor.svg" alt="Teknesyum'u destekle" height="38"></a>
&nbsp;
<a href="LICENSE"><img src="assets/badge-license.svg" alt="Lisans AGPL-3.0" height="38"></a>

</div>
