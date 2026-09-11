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
| Modelin varsayılanına ters düşen ya da tarayıcının göremediği | `SKILL.md`, 132 satır | bir kez, arayüz işi başladığında |

Base, her arayüz konusu açıldığında `SKILL.md` için yaklaşık 27.000 ve sekiz referans dosyası
için 55.000 token daha harcıyordu. Bu proje 88 tarayıcı kuralı, 132 satırlık tek bir skill ve
tek bir platform referansı ile gelir.

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
`<proje>/teknesyum-ui/` altına üretir: `css`, `react`, `wpf`, `avalonia`, `winforms`.

Neon hazır yanıttır, tek yanıt değil — `--template custom` üç marka rengi ve bir yüzey alır,
gerisini aynı formüllerle türetir.

## İşinizi denetleyin

```bash
node <plugin>/scripts/scan.js <proje-kökü>
```

`0` temiz, `1` bulgu var, `2` yapılandırılmamış ya da kapalı. Makine çıktısı için `--json`,
güvenle otomatikleştirilebilen onarımlar için `--fix`, neyi uyguladığını görmek için
`--list-rules`.

Arayüz dosyaları değiştiğinde bir Stop kancası aynı taramayı çalıştırır ve ihlalde durdurur.
Yapılandırma yoksa ya da `off: true` ayarlıysa hiç iş yapmadan çıkar; aynı dosyada iki
engelden sonra geri çekilir, böylece gerçek bir anlaşmazlık işi değil kapıyı durdurur.

## Şablonlar

```bash
node <plugin>/scripts/scaffold.js kur <UygulamaAdı> [--simge app/simge.ico] [--anahtar usb-01]
node <plugin>/scripts/scaffold.js ustcubuk
node <plugin>/scripts/scaffold.js durum
```

| Hedef | Yazdığı | Ne olduğu |
|---|---|---|
| `kur` | `Kur.bat`, `kur-<ad>.ps1` | USB kurulum penceresi: adım içinde ilerleyen çubuk, canlı günlük, bitiş ve hata ekranları, `-Prova` deneme kipi. Yerinde günceller; `-Onar` ya da bitiş ekranındaki Onar düğmesi baştan kurar. Her USB kendi deploy anahtarını `.kurulum/anahtar/` altında taşır. |
| `ustcubuk` | `teknesyum-ui/ustcubuk/` | React başlık çubuğu: logo, iki parçalı ad, dil yuvası, sponsor ve marka bağlantıları, pencere düğmeleri, Electron ve Tauri için sürükleme alanı. |
| `durum` | `teknesyum-ui/durum/` | Başlık çubuğu rozetli Electron git eşitlemesi: eşitleniyor, saatiyle eşitlendi, çevrimdışı; tıklayınca hemen eşitler. |

Var olan dosyanın üzerine asla yazılmaz. Projeye özgü kurulum adımları `--adimlar <dosya>`
ile girer; varsayılan npm paketlerini ve bir masaüstü kısayolunu kurar. `.kurulum/` ve
`.araclar/` projenin git'ine girmesin.

## Testler

```bash
npm test
```

116 assertion, bağımlılık yok. Yedisi maliyet assertion'ıdır: bir kanca `additionalContext`
ya da `systemMessage` yazmaya başlarsa, `SKILL.md` 150 satırı geçerse ya da bir slash komutu
yeniden belirirse başarısız olurlar.

## Düzen

```
ui/skills/teknesyum-ui/   SKILL.md, references/platform.md, assets/
ui/scripts/setup.js       kurulum ve üretim
ui/scripts/generate.js    token -> theme.css, Theme.xaml, Theme.axaml, Palette.cs
ui/scripts/scan.js        tarayıcı
ui/scripts/rules/*.js     kurallar, her alan için bir modül
ui/scripts/scaffold.js    bir şablonu projeye kopyalar
ui/templates/             kurulum, başlık çubuğu, eşitleme rozeti
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
