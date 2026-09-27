# Plan — Kur Şablonuna Releases Kaynağı

İstek: DustyBytes oturumu, 2026-09-27. Şablon `ui/templates/kur` yalnız USB/SSH Asistan desenini taşıyor.

## Adımlar

1. `kur.ps1` ortak pencere + `{{KAYNAK_IS}}` yuvası; iş gövdesi `kaynak-ssh.ps1` (bugünkü) ve
   `kaynak-releases.ps1` (yeni) olarak ayrılır.
2. Releases işi: yazma izni → `releases/latest` → zip + `.sha256` indir (gerçek yüzde) → doğrula →
   `ZipFile.ExtractToDirectory` geçiciye → çalışanı kapat → eskiyi `.eski` yap, Move-Item → kısayol.
   Hedef `%LOCALAPPDATA%\Programs\<Ad>`, yönetici yok.
3. Pencere (kitap `kurulum-paneli` Düzen): beş adım listesi ✓/!/numara, gradyan çubuk + yüzde,
   solan mono günlük, kurulum yeri + Değiştir, Kur → Kuruluyor → Kapat + Programı aç / Yeniden dene.
4. Renkler yalnız token: `{{RENK_*}}` scaffold anında projenin `theme.tokens.json`'undan, yoksa
   eklentinin varsayılanından.
5. Sessiz kip `KUR_OTOMATIK` / `-Otomatik` (pencere yok, çıkış kodu), prova `KUR_PROVA`, deneme
   kökü `KUR_KOK`, sonuç dosyası `KUR_SONUC`.
6. `scaffold.js kur --kaynak releases --depo owner/repo --varlik <zip> --exe <exe>`; yardım ve testler.
7. DustyBytes'a yeniden kur, prova + sessiz koşu, pencere görüntüsü, README Kurulum bölümü.
