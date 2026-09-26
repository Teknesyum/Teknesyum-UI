# Danışma 002 girdi: Okunurluk Skoruna Göre Renk Ayarı

Ajana giden metin:

---

[[danisma:002]]

# Okunurluk Skoruna Göre Renk Ayarı

## Kullanıcının Cümlesi

"fable ve sen bu skoru baz alarak uygunca bir ayarlayın sonra ben editleyeyim"

## Olgular

- Depo: `C:\Users\Administrator\Desktop\Projeler\Teknesyum-UI`. Renklerin kaynağı `ui/templates/neon.tokens.json` (brand, role, on bölümleri).
- Skor modeli `ui/scripts/skor.js`. `node ui/scripts/skor.js` tabloyu basar; modülde `skorla(T, renk)` var, `renk` bir üstyazı nesnesidir (ör. `{ blue: '#6ab4ff', disabled: '#9a9da6' }`) ve dosyaya dokunmadan puanlar. Adayları bununla ölçebilirsin.
- Model: her parçanın yazı/zemin karşıtlığı log ölçekte puana çevrilir (1:1→0, 3→30, 4.5→50, 7→70, 12→90, 18→100); büyük yazı ×7/4.5 sayılır. Parçalar kullanım sıklığına göre ×1–×10 ağırlıklı, zemin surface.
- Önizlemede kaydedilebilen renk alanları: blue, pink, purple, pink-text, purple-text, surface, black, text, disabled, success, warning. Başka alan değiştirilemez.
- Kurallar: dolgu üstü yazı çiftleri 7:1 altına inemez (generate.js reddeder). Tüm renkler bu 11 alandan türer; yeni renk icat edilmez.
- Kullanıcı daha önce maviyi "daha mavimsi", pembeyi "daha farklı" istedi; şimdiki #5aa8ff ve #c82ee0 onun seçimi. Kimlik (mavi-fuşya-mor neon, koyu zemin) korunmalı.

## Şu Anki Durum: 85 / 100 (İyi)

Paneller: Genel Metin 88, Düğmeler 86, Form 93, Üst Çubuk 82, Rozetler 85, Kurulum Paneli 75, İlerleme 88, Bildirimler 90.

En zayıf parçalar:
- 52 puan, `disabled` (#7c7f88): kurulum alt yazısı ×3, günlük satırları ×5, pasif düğme/giriş/sekme, yerel rozeti.
- 73 puan, `blue` yazı (#5aa8ff, text-label=blue): sekme ×8, etiket ×7, çip ×3, yüzde ×3+×3, eşitleniyor, son günlük satırı, kapat üstünde.
- 75 puan, birincil düğme (black #0a0b0e yazı, blue dolgu, 7.95:1).

## Soru

Bu 11 alandan hangilerini hangi hex değerlerine çekersek genel puan belirgin yükselir, kimlik bozulmaz ve pasif öğeler hâlâ pasif görünür? Somut hex listesi ver, her biri için `skorla` ile ölçtüğün panel puanlarını ve genel puanı yaz; bir "dengeli" bir de "cesur" set öner, hangisini varsayılan önerdiğini söyle. Kod veya dosya değiştirme, yalnız ölç ve öner.
