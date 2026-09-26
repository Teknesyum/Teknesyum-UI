# Danışma 004 girdi: Danışma 003 Girdisi: On Tema Tasarımı

Ajana giden metin:

---

[[danisma:004]]

# Danışma 003 Girdisi: On Tema Tasarımı

## Kullanıcının Cümlesi

"uygulamalarımıza standart eklenecek 10 tema eklemek istiyorum 5 i light 5 i dark olacak piyasadaki programların arayüzün deki renk kombinasyonlarını arkaplanlarını vb incele ve bunlara göre kendi 10 varyasyonumuzu oluşturalım varsayılan temelimiz olan neon light temamızı okunabilirlik üzerinden inşa etmiştik revizyon gerekiyorsa fable ile revize edebilirsin"

## Bağlam

Teknesyum UI tek bir token dosyasından (`ui/templates/neon.tokens.json`) CSS, WPF XAML, Avalonia ve C# paleti üretir. Varsayılan tema "Neon" koyudur. Bir tema bu dosyadaki 12 rengi ve `meta.dark` bayrağını değiştirir; geri kalan her şey (ton basamakları, cam, parlama, ön plan eşleri) bu 12 renkten türetilir.

Piyasa araştırması: `docs/arastirma/temalar.md` (20 koyu, 16 açık palet, kaynaklar ve desenler). Önce onu oku.

## 12 Renk Ve Görevleri (Neon Değerleriyle)

| Anahtar | Neon | Görev |
|---|---|---|
| blue | #5aa8ff | Birincil marka: birincil düğme dolgusu, başlık, etiket, odak halkası. Yazı olarak da kullanılır. |
| pink | #c82ee0 | İkincil marka DOLGUSU; yazı taşımaz. |
| pink-text | #f0abfc | Pembenin YAZI kesimi; zemin üstünde yazı. |
| purple | #9455ea | Üçüncül marka: süs, kaydırma çubuğu, hayalet düğme kenarı. Dolgu. |
| purple-text | #d4b3ff | Morun YAZI kesimi. |
| surface | #101115 | Zemin ve panel tabanı; tüm kontrast ölçümleri buna karşı. |
| black | #0a0b0e | Arka plan geçişinin açılış ucu ve odak halkasının iç katmanı. Açık temada "black" adı tarihsel; zeminle aynı aileden, geçişin öbür ucu. Ayrıca dolgu üstü yazı adayıdır (blue üstünde yazı şu an black). |
| glass-base | #14151a | Cam yüzeyin taban rengi (yarı saydam türetilir). |
| text | #f2f3f6 | Gövde yazısı. Ara gri yok. |
| disabled | #7c7f88 | Pasif; 7:1 kuralından muaf tek renk ama okunurluk puanına girer. |
| success | #4ade80 | Başarı; dolgu olarak da kullanılır (üstünde black yazı). |
| warning | #fbbf24 | Yalnız yazı, kenar, ikon; dolgu yok. |

## Kurallar

- **7:1 kapısı:** her yazı/zemin eşi 7:1 (WCAG AAA). Otomatik ön plan seçici her dolgu için black, text, surface arasından en yüksek oranı seçer; hiçbiri 7:1 geçmezse o dolgu yazı taşımaz (bu kapıyı düşürmez ama puanı düşürür). Yani: blue, success ve pink-text/purple-text gibi yazı renkleri surface üstünde ≥7:1 olmalı; blue dolgusu üstünde black ya da surface ≥7:1 olmalı.
- **Okunurluk puanı** (`ui/scripts/skor.js`): kullanım ağırlıklı ortalama, 0–100. Neon şu an 85. Her tema **≥85** hedefliyor. Puan kontrast oranına bağlı: 7:1 → 70, 12:1 → 90, 21:1 → 100.
- Açık temalarda `meta.dark = false`. Açık temada text koyu, surface açık; blue, success, warning, pink-text, purple-text surface üstünde yazı olacağı için koyulaşmalı (açık zeminde 7:1 için genelde L* ≤ 35 civarı).
- Açık temada "black" açık bir renk olur (geçiş ucu), dolgu üstü yazı için text ya da surface seçilir.
- Kopya değil esin: her tema piyasadaki bir ailenin ruhunu taşısın ama kendi değerleri olsun; ad ve başlık bize ait (marka adı yok).
- Teknesyum kimliği: mavi–pembe–mor üçlüsü her temada tanınır kalmalı (ton kayabilir: indigo, fuşya, lavanta vb.), ama her tema belirgin bir karaktere sahip olsun.

## Senden İstenen

1. **5 koyu, 5 açık tema.** Her biri için: `ad` (küçük harf, tire), `baslik` (Türkçe, Title Case), `esin` (hangi piyasa ailesinden, tek cümle), 12 hex. Çeşitlilik: soğuk mavimsi, nötr grafit, sıcak, yüksek kontrast, yumuşak pastel gibi; açıkta saf beyaz, kırık beyaz, sıcak kâğıt, soğuk gri, yüksek kontrast.
2. Her temada surface üstünde text, blue, pink-text, purple-text, success, warning oranlarını kendin hesapla ve yaz; 7:1 altı olan varsa düzelt.
3. **Neon revizyonu:** araştırmaya bakarak Neon'da değişmesi gereken bir şey görüyor musun? Varsa değer ve gerekçe; yoksa "değişiklik yok" de.
4. Çıktının sonunda tüm temaları tek bir JSON dizisi olarak ver: `[{"ad":..,"baslik":..,"tur":"koyu"|"acik","esin":..,"renk":{12 anahtar}}]`.

Kısa yaz; gerekçeler tema başına en çok iki cümle.
