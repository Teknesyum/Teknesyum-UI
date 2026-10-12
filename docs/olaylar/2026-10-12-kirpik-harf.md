# Kırpık Harf: Geçişli Yazıda Kuyruklu Harflerin Altı Kesiliyor

Tarih: 2026-10-12. Kaynak: 46 slaytlık bir deste, eklenti 0.36.0, düzen `benim`.

## Ne Oldu

Geçişli renkle (gradient) boyanmış başlıklarda g, ğ, y, p, ç, ş harflerinin alt kısmı boyasız kaldı. 46 slaytın 26'sında aynı kusur vardı. `scan.js` ve `esle.js --denetle` temiz çıktı (`0 error(s)`, `0 fark`); kusuru kullanıcı gözle buldu.

## Neden

Yazı `background-clip:text` ile boyanıyor; boya, öğenin kutusu kadar yer kaplar. Satır yüksekliği 1.05–1.10 olunca kutu, yazı tipinin gövdesinden (çıkıntı + kuyruk) kısa kalıyor. Kuyruk kutunun altına taşıyor, taşan kısımda boya yok.

Düz renkli yazıda aynı satır yüksekliği sorun çıkarmaz; harf kutudan taşsa da boyanır. Kusur yalnız geçişli yazıda görünür, bu yüzden gözden kaçıyor.

## Ölçüm

Tarayıcıda, her geçişli yazı için:

1. `measureText` ile yazının gerçek kuyruk derinliği (`actualBoundingBoxDescent`) ve yazı tipinin gövdesi (`fontBoundingBoxAscent + fontBoundingBoxDescent`) alınır.
2. Taban çizgisinin altındaki boyalı pay hesaplanır: `(satır yüksekliği − gövde) / 2 + fontBoundingBoxDescent + padding-bottom`.
3. Kuyruk derinliği bu paydan 0.5 px'ten fazla büyükse kusur vardır. Üst taraf (Ç, İ, Ö şapkaları) aynı yolla ölçülür.

| Yazı Boyu | Satır Yüksekliği | Kesik | Adet |
|---|---|---|---|
| 128 px | 1.05 | 6.8 px | 2 |
| 72 px | 1.10 | 2.3–3.9 px | 24 |

Uygulaması: `SlaytEdit/tools/olcum.js` içindeki `kirpik` denetimi.

## Giderme

Yerleşimi oynatmadan: Kesik kadar alt iç boşluk, aynı kadar eksi dış boşluk (`padding-bottom:Npx; margin-bottom:-Npx`). Boya alanı büyür, kutunun dış ölçüsü değişmez. 26 başlıkta uygulandı; yeniden ölçümde 0 kusur.

## Öneri

1. **Kural.** `ui-duzeni` kitabına: Geçişli yazıda satır yüksekliği en az 1.3 ya da en az 0.12em alt iç boşluk.
2. **Statik tarama.** `scan.js`: Aynı bildirimde `background-clip:text` ile 1.25'ten küçük `line-height` varsa ve `padding-bottom` yoksa uyarı.
3. **Canlı denetim.** `ui-denetim` betiğine yukarıdaki ölçüm; yazı tipine göre kesin sonuç verir.
4. **Aynı ailenin diğer kusurları.** Aynı destede ölçümle bulunanlar: Yazının kenar boşluğuna girmesi (kutuya sığmayan tek satır başlık), `overflow:hidden` kutudan taşan yazı. Üçü de "harf tam görünmüyor" başlığında tek denetimde toplanabilir.
