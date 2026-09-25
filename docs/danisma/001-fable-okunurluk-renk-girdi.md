# Danışma 001 girdi: Danışma: Önizleme Ayarlarının Okunurluk İçin Yeniden Değerlenmesi

Ajana giden metin:

---

[[danisma:001]]

# Danışma: Önizleme Ayarlarının Okunurluk İçin Yeniden Değerlenmesi

## Kullanıcının cümlesi (aynen)

"şimdi standart renklerimize önizleme adlı bir program yaptık bunu http://127.0.0.1:4317/ açabiliyoruz burdaki tüm ayarları senin fable a danışarak okunabilirliği ön planda tutarak yapmanı istiyorum renk körlüğünü ihmal ediyoruz normal insanların en iyi okuyacağı renkler şeklinde modifiye et burdaki değerleri ve yeniden açayım ayrıca 127 gibi bişeyde değil elektron tabanlı bir arayüzde yapalım"

## Bağlam

Teknesyum-UI bir arayüz standardı. Tek kaynak `ui/templates/neon.tokens.json`; `generate.js`
ondan theme.css / Theme.xaml / Theme.axaml / Palette.cs üretir. Tema yalnız koyu (meta.dark = true).
Önizleme programı bu token'ları okuyup canlı ayarlatır; kullanıcı "burdaki tüm ayarlar"ın
varsayılanlarını okunurluk için yeniden seçmemizi istiyor. Renk körlüğü hesaba katılmıyor.

## Kırılmaz kurallar (generate.js ve tarayıcı zorlar)

- Metin/zemin çifti en az 7:1 (WCAG göreli parlaklık). Yarı saydam dolgu önce surface üstüne
  bindirilir, sonra ölçülür. 7:1 altı → üretim reddedilir.
- `on` tablosu: blue→black yazı, success→black, danger-text→black, panel/glass→text(beyaz),
  blue-10/20/30→text, blue-50/60→yazı taşımaz, pink-10..60→text, purple-10..60→text,
  pink/purple/danger dolgusu yazı taşımaz. (Ton basamakları: taban rengin %10,20,30,50,60 alfası surface üstünde.)
- warning-border (warning %50 alfa) surface'e karşı ≥ 3:1.
- Orta gri yok: ikincil metin için gri değil, metni silmek. Tek istisna `disabled` (#71717a), 7:1'den muaf.
- Marka üçlüsü: blue (birincil: birincil düğme dolgusu, başlık, etiket, odak halkası),
  pink (ikincil; danger rolü de pembeye bağlı), purple (üçüncül: süs, kaydırma çubuğu, hayalet düğme).
  pink-text / purple-text: bu renklerin METİN kesimleri (7:1'i geçen açık tonları).

## Şu anki değerler

brand: blue #00f3ff · pink #ff00ea · purple #b026ff · pink-text #ff54eb · purple-text #c67eff ·
surface #08090a · black #000000 (degrade başı, odak halkasının iç katmanı) · glass-base #0a0a0f
role: success #34d399 · warning #fbbf24 · text #ffffff · disabled #71717a · danger→pink · danger-text→pink-text · text-label→blue
derived: panel = surface %95 · glass = glass-base %85 · border = blue %50 · border-strong = blue %60 ·
border-decorative = blue %30 · glow (blue/pink/purple %30, blur 20) · bg-gradient: black→surface, 11 durak
size: fs 14/16/20/24/30 px · lh-body 1.5 · lh-heading 1.2 · lh-mono 1.4 · measure 65ch ·
tr-label 0.15em · tr-h3 0.05em · tr-h2 0.02em · tr-hero -0.01em · fw-body 400 · fw-semi 600 · fw-hero 900
shape: r 6px · r-window 12px · focus-w 2 · focus-offset 2
metric: scrollbar-w 10px · input-h 40 · target-min 24
font: sans = Atkinson Hyperlegible Next → Segoe UI → system-ui ; mono = Cascadia Mono → Consolas

## Önizlemedeki ayarlar (hepsi için varsayılan istiyoruz)

1. Renkler: blue, pink, pink-text, purple, purple-text, surface, black, glass-base (hex).
2. Arka plan: tasarım (düz yüzey / token degradesi / cam panel hale üstünde / ızgara / neon hale),
   degrade durak sayısı (2–32), açı (0–360°, şu an 160), salınım açık/kapalı (150–170°, 48 sn).
3. Yazı: aile (Token Sans=Atkinson Hyperlegible Next / Token Mono / Segoe UI / system-ui / Inter / Georgia),
   boyut çarpanı (0.8–1.4), gövde ağırlığı (300/400/500), başlık-etiket ağırlığı (500/600/700),
   kahraman ağırlığı (700/800/900).
4. Köşe yarıçapı: r (0–20), pencere (0–24).
5. Kaydırma: kalınlık (4–20 px), renk (purple / blue / pink / purple-text), davranış (smooth / auto).
6. Hareketi azalt: açık/kapalı.

Token'da olmayan ama değiştirilebilecekler de sayılır: success, warning, text, disabled,
alfa oranları (border, panel, glass, glow), harf aralıkları, satır yüksekliği, fs ölçeği.

## Soru

Normal görüşlü biri için en rahat okunan sonucu verecek şekilde, yukarıdaki HER ayar için tek bir
değer öner (hex, sayı ya da seçenek) ve her birine bir cümle gerekçe yaz. Özellikle:

- Saf beyaz metin (#ffffff) saf-siyaha yakın zeminde (#08090a) halation/parlama yapar mı; metni
  hafif kırık beyaza, zemini koyu griye çekmek daha mı okunur? 7:1'i koruyarak somut hex ver.
- Neon doygunluktaki cyan / magenta / mor, uzun süre bakınca yorar mı; kimliği koruyup doygunluğu
  düşürmek gerekir mi? Somut hex ver; blue üstünde siyah yazı 7:1'i geçmeli.
- pink-text / purple-text kesimleri, yeni zeminde 7:1'i geçen en az yorucu tonlar ne olmalı?
- Arka plan tasarımı: okunurluk için hangisi (degrade/düz/ızgara/hale) ve salınım açık mı kapalı mı?
- Yazı ailesi, çarpan, ağırlıklar, harf aralıkları (özellikle tr-label 0.15em büyük harf etiket).
- Kenarlık alfa, glow yoğunluğu okunurluğu bozuyor mu?

Cevabı tek tablo olarak ver: ayar | şu an | öneri | gerekçe. Sonra en fazla 5 satır genel not.
Önerdiğin her renk çiftinin kontrast oranını hesapla ve yaz (7:1 altında olan kabul edilmez).
