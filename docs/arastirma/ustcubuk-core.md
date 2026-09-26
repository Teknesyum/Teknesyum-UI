# Üst Çubuk İçin Core UI Araştırması Özeti

Kaynaklar: `Teknesyum-Core/docs/ajan/ui-tarama/*`, `docs/ajan/2026-09-23-teknesyum-ui-raporu.md`, `Teknesyum-Base/docs/taramalar/ui-bilesen.md` ve `KARARLAR-ui-2026-08-23.md`. Özeti bir sonnet ajanı çıkardı (2026-09-26); madde başlıkları ve kaynak satırları ajanın cevabından olduğu gibi alındı.

## 1. Üst Çubuk

- Sürükleme bölgesi başlık kabının tamamıdır. İçindeki düğmeler sürüklemeden açıkça çıkarılır. Kaynak: `masaustu.md:43`.
- Windows'ta büyütme düğmesi Snap Layout menüsünü açar. Kaynak: `masaustu.md:41-42`.
- Başlık alanı genişletmesi pencere gösterilmeden önce kurulur. Kaynak: `masaustu.md:45-46`.
- Etkin olmayan pencerede başlığı soldurma önerisi 7:1 kuralıyla çatışıyor; bu yüzden alınmadı. Kaynak: `token-onerileri.md:72-73`.
- Pencere gizli açılır; ilk kare temanın zemin rengiyle gelir. Kaynak: `masaustu.md:31-32`.
- En küçük pencere genişliği Snap bölgesine sığar. Kaynak: `masaustu.md:51-52`.
- Hiçbir kaynakta somut bir başlık çubuğu yüksekliği yok. Sayı uydurulmadı. Kaynak: `brif.md:10-12`.

## 2. Düğme Ve Sekme Durumları

- `:hover` taşıyan her seçicinin bir `:focus-visible` eşi vardır. `outline: none` yalnız yerine görünür bir halka konmuşsa yazılır. Kaynak: `rehber.md:39`.
- `transition: all` yazılmaz; yalnız `transform` ve `opacity` canlanır. Kaynak: `rehber.md:43`, `ui-bilesen.md:126`.
- Görsel durum `data-*` nitelikleriyle verilir. Kaynak: `ui-bilesen.md:69-73`.
- Açılır öğenin büyüme yönü `transform-origin` ile taşınır. Kaynak: `hareket.md:71-77`, `ui-bilesen.md:75-79`.
- Gösterge animasyonu `transition` ile yapılır, `@keyframes` ile değil. Kesilirse o anki konumundan devam eder. Kaynak: `hareket.md:79-88`.
- Düğme sıradüzeni beşi geçmez ve bir ekranda tek bir dolgulu birincil düğme olur. Kaynak: `sistem.md:87-93`.
- Tıklanabilir hedef en az 24×24 pikseldir. Kaynak: `davranis.md:77-80`, `rehber.md:37-38`.

## 3. Hizalama Ve Simetri

- Kenarlık, yüzeyleri ayırmanın son çaresidir; önce ton farkı ya da boşluk denenir. Kaynak: `sistem.md:81-85` (Refactoring UI, "Use fewer borders").
- Koyu temada katmanlar gölgeyle değil, üst katmanın daha açık tonuyla ayrılır. Kaynak: `sistem.md:54-62`.
- Sayılar `tabular-nums` ile dizilir. Kaynak: `sistem.md:44-52`, `KARARLAR-ui-2026-08-23.md:27`.
- Yoğunluk kipi yalnız satır yüksekliğini, iç boşluğu ve simge boyutunu değiştirir. Kaynak: `sistem.md:64-71`.
- Yarıçaplar tek bir kök değişkenden türetilir. Kaynak: `ui-bilesen.md:55-61`.

## 4. Hareket

- Süre role göre kademelenir: geri bildirim 100–160 ms, menü 150–250 ms, panel 200–500 ms. Kaynak: `hareket.md:34-45`.
- Eğri harekete göre seçilir. Giren ve çıkan öğe hızlı başlayıp yavaşlar, yer değiştiren öğe yavaş–hızlı–yavaş gider, döngü doğrusaldır. Kaynak: `hareket.md:47-59`.
- Giren öğe sıfırdan değil, hafif küçük ve saydam başlar (`scale-enter` 0.9–0.97). Kaynak: `hareket.md:61-69`.
- `will-change` yalnız animasyondan hemen önce verilir. Kaynak: `hareket.md:118-135`.
- `prefers-reduced-motion` karşılığı her animasyonda vardır. Kaynak: `rehber.md:41-42`.
- Klavyeyle sık tetiklenen eylemlerde animasyonun kaldırılması önerisi var. Karar sahibe bırakıldı. Kaynak: `hareket.md:145-157`.

## 5. Token Önerileri

- Önerilen eğriler: `e-out` `cubic-bezier(0.23,1,0.32,1)` ve `e-in-out` `cubic-bezier(0.77,0,0.175,1)`. Kaynak: `token-onerileri.md:26-29`.
- Diğer önerilen değerler: `scale-enter` 0.9–0.97, `typeahead-reset` 750 ms, `state-save-throttle` 600 ms, `inp-budget` 200 ms. Kaynak: `token-onerileri.md:15-20`.

## Uygulananlar (2026-09-26)

- Üst çubuktaki sekme ve düğmelerin anahattı kaldırıldı ("Use fewer borders"). Hover'da renk değişir ve metnin altında ortadan açılan bir gösterge belirir. Gösterge `transform: scaleX` ile ve `transition` kullanılarak canlanır, yani kesilebilir.
- İstisna olarak `.tk-titlebar__chip--outlined` eklendi. Çubukta dikey olarak tam ortada durur.
- Her öğe aynı yüksekliktedir ve `line-height: 1` ile tek bir orta çizgiye hizalanır.
