# Runly: Kurulum Ve Güncelleme Paneli Neden Atlandı

Tarih: 2026-09-27. Proje: Runly (.NET 8 WinForms + Win32 başlatıcı). Eklenti: teknesyum-ui 0.11.0.
İş: `uc` denetimi, Runly `docs/ui-denetim/2026-09-27.md`.

## Ne Oldu

- `raf.js --uyan` Runly için `kurulum-paneli` ve `guncelleme-paneli` kitaplarını "hiç uygulanmadı" gösterdi. `uc.js` metni de ikisini "Bekleyen raf kitapları" arasında saydı.
- Ajan (Claude) iki kitabı uygulamadı. Defterde "Runly'de GUI kurulumcu/güncelleme kanalı yok, kurulması sahip kararı" diye açık bıraktı. Raporda "Uygulanmayan Kurallar" altına yazdı ve sahibe "kurulsun mu?" diye sordu.
- Sahibin kuralı ise açık: tema her yüzeye zorla uygulanır, kurulum ve güncelleme de dahil. Soru hiç sorulmamalıydı.

## Kök Neden: Ajanın Kararı

1. **"Yüzey yok" okuması "kitap uygulanmaz" oldu.** Ajan kitabı var olan bir ekranı düzeltme talimatı saydı. Karşılığı olan ekran yoktu, kitap da ona göre "uygulanamaz" kabul edildi. Oysa `--uyan` kitabı projeye uyan diye listelemişti. Uyan bir kitabın yüzeyi yoksa yapılacak iş yüzeyi kurmaktır.
2. **Kapsam kendiliğinden daraltıldı.** Sahibin genel kuralı "kapsamı kendin daraltma, işi yarım bırakma" der. İş yeni bir özellik gibi göründüğü için ajan onu "sahip kararı" etiketiyle erteledi. Bu, kuralın doğrudan ihlali.
3. **Çıkmazın sorumluluğu sahibe devredildi.** Kitap "elle yazılmaz, şablon çağrılır" diyor, ama WinForms şablonu yok (aşağıda 4). Ajan bu çelişkiyi çözmek yerine işi toptan bıraktı. Doğrusu şuydu: şablonun mantığını projeye taşımak, çelişkiyi rapora yazmak, işi bitirmek.

## Eklentideki Kolaylaştırıcılar

1. **SKILL.md tetiği koşullu.** `ui/skills/teknesyum-ui/SKILL.md:37` ve `:78` şöyle diyor: "Asked for an update, auto-update or sync surface: read `guncelleme-paneli`". Kitap yalnız istenince devreye giriyor. Yüzey hiç yoksa ne yapılacağı yazmıyor.
2. **Denetim yordamı var olan ekranları sayıyor.** `ui/scripts/uc.js:36` şöyle: "programın her penceresine, paneline, sekmesine, iletişim kutusuna … eksiksiz uygulanır". Eksik standart yüzeyler (kurulum, güncelleme rozeti) envanterin konusu değil.
3. **`raf.js --uyan` yalnız durum söylüyor.** `ui/scripts/raf.js:234` "hiç uygulanmadı" yazıyor. Yüzeyin kurulması gerektiğini, nasıl kurulacağını söylemiyor.
4. **WinForms şablonu yok.** `ui/scripts/scaffold.js:213-226`:
   - `ustcubuk` ve `durum` yalnız Avalonia, React ya da Electron üretiyor.
   - `.axaml` olmayan bir C# projesinde `durum` sessizce Electron'a düşüyor. Runly'ye `sync.js`, `badge.js` ve `badge.css` kopyalardı.
   - "Elle yazılmaz" kuralıyla birleşince WinForms için yol kapalı.
5. **`kur` şablonu kendi kitabıyla çelişiyor.**
   - **Kaynak:** `ui/templates/kur/kur.ps1:41-160` git clone, SSH deploy anahtarı ve MinGit kullanıyor. `kurulum-paneli` kitabı "Taşınmaz: özel depo, gömülü SSH anahtarı, MinGit ile çekme" diyor; genel kaynak GitHub Releases + sha256.
   - **Kur.bat:** `ui/templates/kur/Kur.bat:2` `-ExecutionPolicy Bypass -WindowStyle Hidden` taşıyor. Aynı kitabın "Antivirüs ve Windows tuzakları" bölümü bunu Defender'ın yakaladığı desen olarak sayıyor.
   - **Renkler:** `kur.ps1:187-188` sabit hex kullanıyor, token değil: `#101115`, `#5aa8ff`, tehlike için pembe `#f0abfc`.
   - **Eksik maddeler:** Kitabın istediği beş adım listesi, "kurulum yeri + Değiştir" satırı, Kur → Kuruluyor düğmesi, sessiz kip (`*_OTOMATIK`) ve "Yeniden dene" şablonda yok. Şablon açılır açılmaz kurmaya başlıyor.
   - **Sonuç:** Şablon olduğu gibi çağrılsa bile kitaba uymayan bir kurulum penceresi çıkıyor. Bu da ajanın "şablon uymuyor, ben de kurmuyorum" sonucuna varmasını kolaylaştırdı.

## Öneriler

1. **Kural:** `ui-denetim` yordamına ve SKILL.md'ye şu cümle girsin: "Projeye uyan bir raf kitabının yüzeyi yoksa yüzey kurulur. 'Yüzey yok' uygulamama gerekçesi değildir, sahibe sorulmaz."
2. **`uc.js`:** Envanter maddesine "eksik standart yüzeyler (kurulum penceresi, güncelleme rozeti ve paneli, standart üst çubuk) envantere 'yok → kurulacak' diye yazılır" eklensin.
3. **`raf.js --uyan`:** Bir kitap "hiç uygulanmadı" durumundaysa ve projede karşılığı yoksa satır "yüzey yok, kur: `scaffold.js <hedef>`" desin.
4. **Tarayıcı kuralı:** Yayımlanan bir masaüstü uygulamasında kurulum ya da güncelleme yüzeyi yoksa hata verilsin (`kabuk/kurulum-yok`, `kabuk/guncelleme-yok`). Yayın işareti: GitHub Releases iş akışı, `install.ps1`, `*.sha256`.
5. **WinForms şablonu:** `scaffold.js durum --winforms` ve `kur` WinForms paneli için şablon eklensin. `.axaml` olmayan C# projesinde sessiz Electron düşüşü kaldırılsın, kullanım hatası versin. Runly'deki taşıma (`src/Runly.Settings/Dialogs/UpdatePanel.cs`) şablona kaynak olabilir.
6. **`kur` şablonu kitaba çekilsin:**
   - Varsayılan kaynak GitHub Releases + sha256 olsun; git/SSH yolu yalnız "özel depo istisnası" bayrağıyla gelsin.
   - `Kur.bat`'tan `Bypass` ve `Hidden` çıksın.
   - Renkler `theme.tokens.json`'dan üretilsin.
   - Kitabın düzen maddeleri şablona girsin: beş adım, kurulum yeri + Değiştir, Kur → Kuruluyor, sessiz kip, Yeniden dene.

## Runly'de Yapılanlar

Bu rapordan sonra aynı oturumda Runly'ye uygulandı; ayrıntı Runly `docs/plan.md` ve `CHANGELOG.md` içinde.

- **Güncelleme kanalı:** `UpdateService` (Releases API, sha256, `.old` takası), `UpdateController`, başlık çubuğunda sarı/yeşil iki adımlı rozet ve `UpdatePanel` (Var / İniyor / Hazır / Yenileniyor / Hata). İndirme düşük öncelikli iş parçacığında.
- **`NeonProgressBar`:** Tavan kuralı birebir: fark×0.08 (en az 0.2) yaklaşma, fark×0.006 sürünme, 16 ms, geri gitmez; mavi→pembe geçiş ve tarama ışığı.
- **Kurulum penceresi:** `scripts/install.ps1` kitabın düzenine göre yeniden yazıldı. Beş adım, çubuk + yüzde, sönen günlük, kurulum yeri + Değiştir, Kur → Kuruluyor → Kapat / Yeniden dene. `-Silent` (`RUNLY_OTOMATIK`), `-Rehearsal` (`RUNLY_PROVA`) var. Kaynak Releases + sha256; sha256 açmadan önce doğrulanıyor. `Kur.bat` gönderilmedi (Bypass/Hidden yasak).
- **İki renkli başlık:** "Runly" mavi, pencere adı pembe, bütün Ayarlar pencerelerinde.
- **Ölçüm:** UiAudit %100/125/150'de güncelleme ekranları dahil 1947 öğe geçti ya da muaf. Kurulum penceresinin renkleri `elle-hesap.js`'te elle hesaplandı, hepsi ≥7:1 (en düşük eski günlük satırı, beyaz alfa 150 = 7.10:1). Kitabın edilgen renkli günlük/alt başlığı Runly'nin 7:1 kuralını geçmediği için alfa ≥150 beyaz kullanıldı.
- **Tarama:** `scan.js` `UpdatePanel.cs`'yi `kabuk/sablon-imzasiz` ile yakaladı; WinForms şablonu olmadığı gerekçesiyle yoksayıldı.

## Yol Üstünde Çıkan Ek Zayıflıklar

1. **`raf.js --uydu` hiçbir şey doğrulamıyor.** Kitap uygulanmadan da "recorded" yazıyor. İş yapılmadan kayıt atılabilir ve `--uyan` kitabı artık göstermez. Öneri: `--uydu` en azından `scan.js`'i o kitabın kurallarıyla çalıştırsın ya da kitabın imza dosyasını arasın.
2. **PowerShell büyük/küçük harf tuzağı.** Kurulum penceresinde animasyon durumu `$G`, çizim işleyicisindeki Graphics `$g` ile gölgelendi; çubuk ve yüzde hep 0 çizildi, hata da vermedi. `kur` şablonuna ve kitaba "PowerShell değişken adları harf duyarsızdır; `$g`/`$G` gibi çiftler yasak" notu girsin.
3. **GitHub API sınır aşımı (403).** Denemeler sırasında `api.github.com` 403 döndü. Kurulumcu yalnız API'ye dayanıyorsa kurulum düşer. Runly'de `releases/latest` yönlendirmesinden etiket okuyan yedek yol eklendi. `kurulum-paneli` kitabına ve `kur` şablonuna aynı yedek girsin.
