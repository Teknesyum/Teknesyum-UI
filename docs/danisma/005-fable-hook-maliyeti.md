# Danışma 005: Teknesyum-UI Eklentisinin Tur Başına Maliyeti

claude-fable-5-1, 2.268 çıktı token, 31 sn. Girdi: [005-fable-hook-maliyeti-girdi.md](005-fable-hook-maliyeti-girdi.md). Cevap olduğu gibi:

---

**Danışma 005 — Kalem Kalem Karar**

1. **Skill açıklaması (~70 token, önbellekli)** — Göze alınır. Sabit, önbellekte, her turda sıfıra yakın maliyet; kaldırmak "uc" tetiğini de öldürür.

2. **SessionStart hook'u** — İkiye bölünmeli. Tarama ve ≤1 satırlık durum notu ("Teknesyum-UI: 3 açık bulgu, `uc` ile denetle") kalsın: oturumda bir kez, olağan turda sıfır. **"İsteğe geçmeden önce skill'i yükle, setup/scan çalıştır, bulguları 0'a indir" emri kaldırılmalı, uc'ya taşınmalı.** Bu emir tek başına kullanıcının istemediği bir tam denetim turunu (skill yükü + tarama + düzeltmeler) sessizce başlatıyor; altın kuralı en çok delen kalem bu. 60 sn'lik node taraması da bekleme maliyeti; delta tarama (0.14.0) varsa kabul, yoksa oturum başında sadece önbellekli sonucu okusun.

3. **PreToolUse hook'u** — Göze alınır. Yalnız arayüz dosyasına dokunulduğunda, tek seferlik, kısa ret; diğer her turda 0 token. Kurulmamış proje reddi ve kitap okutma ikisi de bir hatayı sonradan düzeltmekten ucuz.

4. **Stop hook'u** — Şartlı kalır. Yalnız o turda düzenlenen dosyaları tarıyor, bloğu ≤200 karakter, dosya başına 2 kez tavanı var; arayüze dokunmayan turda sıfır. Tek düzeltme: **tetiklediği ek tur, arayüz dosyasına dokunan turlarda ~%10-15'e kadar ek maliyet** — bu, "her turda maliyet getiren özellik" sınıfına giriyor; kullanıcıya bir kez söylenmeli ve `teknesyum-ui.json` içinde kapatılabilir olmalı (`"stopHook": false`).

**Önerilen son hâl**

- Skill açıklaması: olduğu gibi.
- SessionStart: tarama + tek satır durum notu; "önce denetle" emri yok. Denetim yalnız `uc` ile.
- PreToolUse: olduğu gibi.
- Stop: olduğu gibi, ama json'dan kapatılabilir ve README'de "arayüz dosyası düzenlenen turda bir ek tur açabilir" diye bir satır.

Net etki: olağan tur 0 ek token (skill açıklaması önbellekte); oturum başı bir kez kısa not; ek tur yalnız arayüz dosyasına dokunulduğunda ve kullanıcının isteğiyle.

Yok
