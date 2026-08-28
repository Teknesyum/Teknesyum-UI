# K — standart kendi kurallarından geçsin

status: submitted
round: 2

Hedef değişmedi: `node ui/scripts/scan.js <tmp>` çıkış **0**.
Kaldığın yer: üretici düzeltmeleri — `.tk-btn:active` ikinci taşıyıcı, storyboard hedefi, animasyon guard.

## Ek maddeler

1. `colour/tokenized-radius` bad fixture'ı bayat. `--tk-r-window: 12px` token olarak eklendi,
   `border-radius: 12px` artık ihlal değil. Fixture'ı geçerli bir ihlalle güncelle.
2. `ui/scripts/rules/__fixtures__/core/` yok — `core.js`'in 16 kuralı fixture'sız.
   Her biri için bad/good çifti yaz, diğer modüllerin `<rule>/{bad,good}/` düzenini izle.
3. Bittiğinde `node test/all.js` koş, sonucu rapora yaz.

## Kapsam dışı

`ui/scripts/scan.js` dosyasına dokunma — dosya toplama uzantılarını T0 genişletiyor.

## Rapor

28 bulgu karara bağlandı: **8 (a) varlık/üretici**, **15 (b) yanlış pozitif daraltma**,
**5 (c) bilinçli istisna**. Son tarama `node ui/scripts/scan.js <tmp>` **çıkış 0**
(12 dosya, 0 açık). `node test/all.js` **88 passed, 0 failed**;
`__fixtures__/states/_run.js` **27 kural · 56 pass · 0 fail**.

(a) — kaynak düzeltildi:
- `generate.js`: `.tk-btn:active` ikinci taşıyıcı `border-color: var(--tk-border-strong)`.
- `generate.js`: `AppBgRotate` artık `Background.EndPoint` yerine `bgLayer` öğesinin
  `RenderTransform.(RotateTransform.Angle)` özelliğini sürüyor, sweep `motion.bg-sweep-max`
  (20 derece, CSS keyframe'in 150→170 yürüyüşüyle aynı). Aynı bloğa
  `SystemParameters.ClientAreaAnimation` guard şerhi eklendi.
- `forms.css`: `.tk-input:active` basılı hâli eklendi (beşinci durum);
  `.tk-input[readonly]` çerçevesi `--tk-border-decorative` (2.14:1) yerine `--tk-border`,
  taşıyıcı imleç; `--tk-toast-sayac` → `--tk-toast-timer`, `running`/`paused` değerleriyle
  `.tk-toast` üzerinde `animation-play-state` olarak OKUNUYOR.
- `Signature.tsx`: `text-sm` / `tracking-[0.15em]` / `rounded-md` → `--tk-fs-1`,
  `--tk-tr-label`, `--tk-r`. Üç Tailwind varsayılanı da aynı sayıyı ikinci kez sabitliyordu.

(b) — kural daraltıldı, hiçbiri silinmedi:
- `core/hover-without-transition`: taban seçici artık *subject* üzerinden çözülüyor —
  pseudo-sınıflar ve `:not(...)` soyuluyor, pseudo-ELEMENT korunuyor
  (`::-webkit-scrollbar-thumb`), değiştirici sınıf tire önekiyle tabanına bağlanıyor
  (`.tk-btn-primary` → `.tk-btn`), `:disabled` taşıyan iptal kuralları hiç koşmuyor.
- `states/raw-easing`: `ease-[--tk-e-out]` ihlal değil — köşeli parantezin İÇİ token ise
  kural tam olarak istediğini görüyor demektir.
- `colour/tabular-numerals`: doyum araması artık `theme.css` / `Theme.xaml` dahil tüm
  dosyalarda; rapor hâlâ yalnız proje dosyalarında. `.axaml` kapsam dışı — Avalonia'da
  `Typography.NumeralAlignment` yok, karşılığı `FontFeatures="+tnum"` ve `Theme.axaml`
  sürüm doğrulanmadığı için kapalı bırakıldığını kendi şerhinde yazıyor.

(c) — `docs/coverage/exceptions.md` (yeni dosya), ikisi de desen olarak tanımlandı:
- `core/text-glow` — `drop-shadow(var(--*glow-hero))`. Muaf olan seçici değil TOKEN;
  kendi blur/alpha'sını yazan bir hero hâlâ raporlanır.
- `colour/tokenized-radius` — aynı öğede `CornerRadius == Width/2` ya da `Height/2`.
  CSS bunu `50%` yazıp zaten muaf; XAML'de yüzde yok, 16x16 thumb `CornerRadius="8"`
  yazmak zorunda. Muafiyet sayıya değil geometriye bakıyor.

Ek maddeler:
1. `tokenized-radius.bad.css` `12px` → `10px` (`--tk-r-window: 12px` artık geçerli).
   Pinleme için `tokenized-radius.good.xaml` eklendi.
2. `__fixtures__/core/` yazıldı — 16 kuralın hepsi `<rule>/{bad,good}/` düzeninde,
   `forms` fixture'larının düzeni izlendi. 16/16 çift doğru davranıyor.
3. `node test/all.js` → 88 passed, 0 failed.

Silinmesi gerektiğini düşündüğüm kural yok.

### Yol üstünde çıkan iki şey

- `core/installed-unused` sessizce ölüydü: `importedPackages` içe aktarma ararken
  `package.json`'ın kendisini de tarıyordu, `"motion": "^11.0.0"` satırı import
  deseniyle eşleşip her paketi "kullanılıyor" gösteriyordu. Üretimde `scan.js`
  `.json` toplamadığı için görünmüyordu, fixture harness'ı topladığı için ortaya çıktı.
  `MANIFEST_NAME` ile `package.json` / `package-lock.json` arama havuzundan çıkarıldı.
- `forms.css` hâlâ Türkçe — sınıf adları (`tk-toast-yigin`, `tk-toast-ikon`),
  data öznitelikleri (`data-tk-giriyor`, `data-tk-kapaniyor`) ve bütün şerhler.
  BRIEF "her dosya İngilizce" diyor. Bu sözleşmenin kapsamında değildi, dokunmadım.

Geçici tarama çıktısı `trash/K-scan-tmp/` altına taşındı (silme izni yok).

LOG: K | ui-builder | 28 bulgu → 8 (a) / 15 (b) / 5 (c) | scan çıkış 0 | test/all.js 88/0 | states fixture 56/0
