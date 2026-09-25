# Danışma 001: Danışma: Önizleme Ayarlarının Okunurluk İçin Yeniden Değerlenmesi

claude-fable-5-1, 8.571 çıktı token, 136 sn. Girdi: [001-fable-okunurluk-renk-girdi.md](001-fable-okunurluk-renk-girdi.md). Cevap olduğu gibi:

---

Hesap dosyası (WCAG göreli parlaklık, alfa katmanları surface üstüne bindirilip ölçüldü): `C:\Users\ADMINI~1\AppData\Local\Temp\claude\C--Users-Administrator-Desktop-Projeler-Teknesyum-UI\9e21b996-94b4-4304-9150-f9d9c4252969\scratchpad\kontrast-sonuc.txt` (betik: aynı klasörde `kontrast.js`).

| Ayar | Şu an | Öneri | Gerekçe |
|---|---|---|---|
| text | #ffffff | **#f2f3f6** | Saf beyaz koyu zeminde halation yapar; %4 kırık beyaz parlamayı keser, surface'e karşı **17.00:1**. |
| surface | #08090a | **#101115** | Saf siyaha yakın zemin OLED'de metni "yüzdürür"; hafif mavi-gri koyu zemin göze yumuşak, tüm çiftler 7:1 üstünde kalıyor. |
| black (degrade başı, odak iç katmanı) | #000000 | **#0a0b0e** | Saf siyah ile surface arasındaki sıçrama degradede bant yapar; text'e karşı **17.74:1**. |
| glass-base | #0a0a0f | **#14151a** | Surface'in bir tık üstü, cam panel zeminden ayrışsın; text/glass(%85) **16.58:1**. |
| blue (birincil) | #00f3ff | **#3ddbe8** | Tam doygun cyan uzun bakışta yorar; doygunluk düşük, kimlik aynı; siyah yazı üstünde **12.50:1** (black #0a0b0e ile 11.71), surface'e karşı 11.23. |
| pink (ikincil, danger dolgusu) | #ff00ea | **#d236bf** | Tam magenta en yorucu ton; pink-60 üstünde text 7:1 kuralı bunu zorluyor: pink-10/20/30/50/60 → **15.68 / 14.04 / 12.20 / 8.75 / 7.40**. |
| purple (üçüncül) | #b026ff | **#9455ea** | Mor sadece süs/kaydırma; doygunluk kırıldı, purple-10..60 → **15.56 / 13.83 / 12.10 / 8.83 / 7.49**. |
| pink-text | #ff54eb | **#ffa3ee** | Şu anki 7.33 sınırda ve cırtlak; pastel pembe surface'e karşı **10.53:1**, danger-text olarak siyah yazı 11.73. |
| purple-text | #c67eff | **#d4b3ff** | Aynı mantık, lavanta ton surface'e karşı **10.50:1**. |
| success | #34d399 | **#4ade80** | Bir tık daha yeşil, mavi ile karışmaz; siyah yazı **12.05:1**. |
| warning | #fbbf24 | **#fbbf24** (kalsın) | Zaten ideal; siyah yazı 12.58, warning-border(%50)/surface **3.60:1** ≥ 3. |
| disabled | #71717a | **#7c7f88** | Yeni zemin açıldı, gri de bir tık açılsın ki "kapalı" hâlâ okunsun (4.72:1, muaf). |
| border alfa | blue %50 / %60 / %30 | **%40 / %55 / %20** | Neon cyan kenarlık %50'de metinle yarışıyor; %40'ta hâlâ görünür, dekoratif %20 arka plana çekilir. |
| panel alfa | surface %95 | **%96** | Değişiklik gerekmez; çok saydam panel arka plan degradesini metnin altına taşır. |
| glass alfa | glass-base %85 | **%90** | Cam üstünde okunan metin için arkadaki hale daha az sızmalı. |
| glow | %30, blur 20 | **%18, blur 16** | Metne yakın hale zemini lekeler; hâlâ neon hissi verir, okunurluğu bozmaz. |
| arka plan tasarımı | (seçmeli) | **Token degradesi** | Düz yüzey en okunur ama kimliksiz; black→surface degradesi düşük kontrastlı, metinle çakışmıyor. Izgara ve hale metin arkasında doku yaratır, kaçının. |
| degrade durak sayısı | 11 | **16** | 11 durakta bant izi görünebilir; 16 pürüzsüz, 32 gereksiz. |
| degrade açısı | 160° | **160°** | Dikey-ağırlıklı açı gövde metnin satır yönüyle çakışmaz. |
| salınım | açık | **Kapalı** | 48 sn'lik de olsa hareket eden zemin çevresel görüşü sürekli uyarır; okuma odağını bozar. |
| yazı ailesi | Atkinson Hyperlegible Next | **Atkinson Hyperlegible Next** | Harf ayrımı (I/l/1, O/0) en yüksek gövde yazısı; Inter ikinci, Georgia koyu zeminde zayıf. |
| boyut çarpanı | 1.0 | **1.0** | 16 px gövde zaten standart; ölçeği değil, satır yüksekliğini kullanın. |
| fs ölçeği | 14/16/20/24/30 | **14/16/20/24/32** | Hero'yu 32'ye çekmek hiyerarşiyi netleştirir, gövdeye dokunmaz. |
| gövde ağırlığı | 400 | **400** | 300 koyu zeminde inceler ve halation'a en açık ağırlık; 500 uzun metinde şişer. |
| başlık/etiket ağırlığı | 600 | **600** | Etiket 700'de büyük harfle birlikte fazla ağır; 600 yeterli ayrım. |
| kahraman ağırlığı | 900 | **800** | 900 koyu zeminde ışıldar, harf içleri dolar; 800 aynı etkiyi daha temiz verir. |
| lh-body | 1.5 | **1.6** | 65ch ölçüde satır dönüşü için 1.6 daha rahat; koyu tema açık temadan biraz daha fazla hava ister. |
| lh-heading | 1.2 | **1.25** | 24–32 px'te 1.2 iki satırlı başlıkta sıkışır. |
| lh-mono | 1.4 | **1.5** | Kod bloklarında satır ayrımı kolaylaşır. |
| measure | 65ch | **65ch** | İdeal aralıkta (45–75). |
| tr-label | 0.15em | **0.08em** | Büyük harf etiket için 0.15em harfleri dağıtır, kelime bütünlüğü kaybolur; 0.08em hâlâ "etiket" okunur. |
| tr-h3 | 0.05em | **0.02em** | Küçük başlıkta pozitif aralık gerekmez. |
| tr-h2 | 0.02em | **0** | Orta boy başlıkta doğal aralık en okunur. |
| tr-hero | -0.01em | **-0.015em** | 32 px/800 ağırlıkta biraz daha sıkı durmalı. |
| r | 6px | **6px** | Nötr; okunurluğa etkisi yok. |
| r-window | 12px | **12px** | Aynı. |
| focus-w / offset | 2 / 2 | **2 / 2** | Blue odak halkası yeni tonla hâlâ 11:1, kalın gerekmez. |
| kaydırma kalınlığı | 10px | **10px** | 8'in altı yakalanmaz, 12 üstü alanı yer. |
| kaydırma rengi | purple | **purple-text** | Yeni mor surface'e karşı 4.2:1, başparmak çubuğu görünsün diye açık ton (10.5:1). |
| kaydırma davranışı | smooth | **auto** | Smooth kaydırma, okurken satırı bulmayı zorlaştırır; anlık kaydırma göz konumunu korur. |
| hareketi azalt | kapalı | **Açık** | Salınım ve glow geçişleri kapanır; okunurluk için en güvenli varsayılan. |
| input-h / target-min | 40 / 24 | **40 / 24** | Yeterli; değişmesin. |

Genel not:

- Bütün çiftler yeniden hesaplandı, en dar olanı pink-60/text 7.40 ve purple-60/text 7.49; pembe bundan açık seçilirse generate.js reddeder, pembeyi daha canlı istiyorsanız tek çıkış pink-60 basamağına yazı bindirmeyi kuraldan çıkarmak.
- Halation'ın gerçek kaynağı saf beyaz + saf siyah çiftidir; text ve surface değişikliği tek başına farkın çoğunu verir.
- Neon kimlik dolgularda (düğme, kenarlık) korunuyor; doygunluk sadece %15–25 düşürüldü, hue'lar aynı.
- Etiket harf aralığı 0.15em → 0.08em bu listede en çok hissedilecek tipografi değişikliği.
- Arka planda "düz yüzey" seçilirse gradient/black tokenları devre dışı kalır; degrade + salınım kapalı, en okunur olanla kimliği koruyan uzlaşmadır.
