# Plan: On Tema, Sade Parlama, Akıcılık Ve Yeni Önizleme

Kullanıcının cümleleri:

- "uygulamalarımıza standart eklenecek 10 tema eklemek istiyorum 5 i light 5 i dark olacak piyasadaki programların arayüzün deki renk kombinasyonlarını arkaplanlarını vb incele ve bunlara göre kendi 10 varyasyonumuzu oluşturalım varsayılan temelimiz olan neon light temamızı okunabilirlik üzerinden inşa etmiştik revizyon gerekiyorsa fable ile revize edebilirsin"
- "devam et, temaları bitir ayrıca scroll vb gibi etrafında parlama efektleri çoğu zaman kötü gözüküyor tüm uygulamaları bu ui düzeninde ki verilerden yapacağımızdan herşey çok düzgün olmalı amacımız animatif ve smooth kalabilmek hızlı başla yavaşla hızlı bitir gibi smooth metodları da seçeneklerim arasında olmalı smoothluk için ayrı bir gösterim istiyorum bu madde önemli fps imiz hep yüksek hissettirecek hem animatif hem hızlı tepkili olacağız teknik bir panelimiz olacak dilediğin kadar araştırma yapabilirsin bara tıklayınca bar örnekleri gelecek arka plana tıklayınca arkaplan gözükecek bu şekilde sonucu görebileceğim bir tasarıma geç ayrıca seçeneklerimi çoğalt"

## İş Bölümü

**Ana oturum (token ve üretim tarafı):**

1. Temalar: `docs/arastirma/temalar.md` → fable danışması 003 → `ui/templates/temalar/*.json` (5 koyu, 5 açık) → `node ui/scripts/tema.js denetle` hepsi 7:1 geçer, okunurluk ≥ 85.
2. Parlama: kaydırma çubuğu parlaması kalkar (generate.js); düğme ve ilerleme parlaması token'dan (`derived.glow`, `glow-button`, `glow-hero`) ayarlanır.
3. Eğriler: `easing` bölümüne `in-out`, `fast-slow-fast`, `emphasized`, `sharp`, `linear` eklenir; CSS'te `--tk-e-<ad>` olarak çıkar.
4. Kaydet genişler: `easing.<ad>.bezier` (4 sayı, x 0–1), `duration.<instant|fast|base|slow>.ms` (0–2000 tamsayı), `derived.<glow|glow-button|glow-hero>.alpha` (0–1) ve `.blur` (0–48 tamsayı).

**Önizleme ajanı (`ui/onizleme/*` yalnız):**

5. Yeni düzen: solda bileşen listesi (Renkler, Düğmeler, Formlar, Üst Çubuk, İlerleme Çubuğu, Kaydırma Çubuğu, Arka Plan, Rozetler, Bildirimler, Kurulum Paneli, Modal, Tipografi, Akıcılık, Okunurluk, Teknik); tıklanan bileşenin tüm örnekleri ve durumları ortada; ayarlar sağda.
6. Akıcılık sayfası: her eğrinin grafiği ve canlı demosu, süre karşılaştırması, "tekrar oynat".
7. Teknik panel: FPS, kare süresi (ort/p95/en kötü), düşen kare, uzun görev, bellek, DPR, yenileme hızı tahmini, GPU adı, yük testi.
8. Seçenekler çoğalır: parlama düzeyi, eğri ve süre seçimi, yoğunluk, kenar kalınlığı, cam bulanıklığı, gölge gücü.

## Kapılar

- `node test/all.js` ve `node ui/scripts/scan.js .` temiz.
- Animasyonlar yalnız `transform` ve `opacity`; önizleme 60 FPS altına düşmez (Teknik panelde ölçülür).
- Kısayolla açılan pencerede ekran görüntüsüyle doğrulama.
