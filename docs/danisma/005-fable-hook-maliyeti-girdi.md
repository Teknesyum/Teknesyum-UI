# Danışma 005 girdi: Teknesyum-UI Eklentisinin Tur Başına Maliyeti

Ajana giden metin:

---

[[danisma:005]]

# Teknesyum-UI Eklentisinin Tur Başına Maliyeti

## Olgular
Teknesyum-UI bir Claude Code eklentisi (React, Electron, WPF, Avalonia arayüz standardı). Kullanıcı "uc" yazınca tam dönüştürme ve denetim başlar. Kullanıcı eklentinin yalnız uc yazınca çalıştığını sanıyordu. Gerçekte şu parçalar uc dışında da devrede:

1. Skill açıklaması: ~70 token. Her oturumda bağlamda duruyor ve önbellekte.
2. SessionStart hook'u. Bağlı bir projede oturum açılırken tarama çalışıyor (node, 60 sn'ye kadar). Proje kurulmamışsa, denetlenmemişse, düzen değişmişse ya da açık bulgu varsa ~150-250 tokenlık bir not ekliyor. Not modele şunu diyor: "kullanıcının isteğine geçmeden ÖNCE skill'i yükle, setup/scan çalıştır, bulguları 0'a indir, iki satır rapor ver". Yani uc yazılmadan tam bir denetim/düzeltme turu başlatabiliyor.
3. PreToolUse hook'u, Write/Edit üzerinde:
   - Kurulmamış projede arayüz dosyası yazılmaya çalışılırsa yazmayı reddediyor ve önce setup istiyor.
   - Özel raftaki bir kitabın konusu olan dosyaya ilk dokunuşta bir kez reddediyor ve kitabı okutuyor.
   - Diğer durumlarda sessiz, 0 token.
4. Stop hook'u. O turda arayüz dosyası düzenlendiyse yalnız o dosyaları tarıyor. Bulgu varsa ≤200 karakterlik bir blok gönderiyor, bu da bir tur daha demek. Dosya başına en çok 2 kez, aynı kural+dosya için bir kez.

Arayüze dokunmayan turda 2, 3 ve 4 çıktı vermiyor, token harcamıyor.

Kullanıcının kuralı: maliyet altın kural. Olağan tur ek maliyet taşımamalı. Her turda maliyet getiren özellikler önceden söylenmeli.

## Soru
Hangi tüketim göze alınmalı, hangisi önemsiz, hangisi kaldırılmalı ya da uc'ya taşınmalı? Her kalem için tek satır karar ve gerekçe. Sonunda önerilen son hâli yaz. Türkçe, kısa.
