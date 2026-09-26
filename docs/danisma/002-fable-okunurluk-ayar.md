# Danışma 002: Okunurluk Skoruna Göre Renk Ayarı

claude-fable-5-1, 5.881 çıktı token, 212 sn. Girdi: [002-fable-okunurluk-ayar-girdi.md](002-fable-okunurluk-ayar-girdi.md). Cevap olduğu gibi:

---

## Cevap (Danışma 002)

Ölçümler `skorla(T, renk)` ile alındı; betik: `C:\Users\ADMINI~1\AppData\Local\Temp\claude\C--Users-Administrator-Desktop-Projeler-Teknesyum-UI\9e21b996-94b4-4304-9150-f9d9c4252969\scratchpad\olc.js`. Hiçbir depo dosyasına dokunulmadı.

### Bulgu: puanı taşıyan yalnız iki alan var

Tek tek denendi. Tablo genel puanı gösteriyor (mevcut 85.0):

| Alan | Aday | Oran (surface üstü) | Parça puanı | Genel |
|---|---|---|---|---|
| disabled | #7c7f88 (mevcut) | 4.72 | 52 | 85.0 |
| disabled | #9497a0 | 6.46 | 66 | 86.1 |
| disabled | #9a9da6 | 6.96 | 70 | 86.4 |
| disabled | #a0a3ac | 7.48 | 72 | 86.6 |
| blue | #5aa8ff (mevcut) | 7.62 yazı / 7.95 düğme | 73 / 75 | 85.0 |
| blue | #6ab2ff | 8.47 / 8.83 | 77 / 79 | 86.1 |
| blue | #78baff | 9.22 / 9.62 | 80 / 82 | 87.0 |
| blue | #80beff | 9.64 / 10.05 | 82 / 83 | 87.4 |
| surface | #0e0f13 | — | — | 85.5 |
| black | #06070a | — | — | 85.1 |
| text | #f8f9fb | — | — | 85.5 |
| pink-text | #f5c0ff | — | — | 85.8 |
| success | #5ce68f | — | — | 85.2 |

pink, purple, purple-text, warning: puana giren parçaları zaten 85+; dokunmanın getirisi yok, kimlik riski var. Bu yüzden iki set de yalnız `disabled` ve `blue`'ya (cesurda bir de `surface`'a) dokunuyor.

### Dengeli set (varsayılan önerim)

- `disabled`: #7c7f88 → **#9a9da6**
- `blue`: #5aa8ff → **#6ab2ff**

Ölçüm: **Genel 87.4** — Metin 89, Düğmeler 88, Form 94, Üst Çubuk 85, Rozetler 87, Kurulum 81, İlerleme 89, Bildirimler 91. En zayıf parça: pasif düğme 70 (52'den).

Neden bu: disabled 6.96:1 ile 7:1 eşiğinin hemen altında kalıyor, yani "pasif" statüsünü (7:1 muafiyeti) yasal olarak koruyor ve gövde yazısıyla arasında hâlâ 2.44:1 fark var, pasif olduğu göze çarpıyor. Mavi bir adım açılıyor (ton 212°→211°, aynı hue), kullanıcının "daha mavimsi" seçimi bozulmuyor; birincil düğme 7.95→8.83.

### Cesur set

- `disabled`: → **#a0a3ac**
- `blue`: → **#78baff**
- `surface`: #101115 → **#0e0f13**

Ölçüm: **Genel 89.2** — Metin 91, Düğmeler 90, Form 95, Üst Çubuk 87, Rozetler 88, Kurulum 84, İlerleme 92, Bildirimler 92. Pasif düğme 74.

Bedeli: disabled 7.48:1 ile 7:1'i geçiyor, yani artık teknik olarak "pasif" görünmüyor, sadece gri; text ile farkı 2.27:1'e düşüyor. Mavi #78baff belirgin biçimde gökyüzü mavisine kayıyor, neon kimliği yumuşuyor. Surface'i koyultmak her şeyi yükseltir ama panel/glass türevleri de kayar, gözle kontrol ister.

### Tavan

Tüm 11 alanla bile ~90 sınırı: kalan parçalar (pink-text 10.7:1, success 11.3:1, warning 11.3:1) log ölçekte 85-90 bandında ve 100 için 18:1 gerekir, bu da neon renkleri beyaza çevirmek demek. 87-89 bu kimlikle dürüst tavan.

**Öneri: Dengeli.** İki hex değişikliği, +2.4 puan, pasif hâlâ pasif, mavi hâlâ mavi.

Yok
