$hedefVarsayilan = Join-Path $env:LOCALAPPDATA "Programs\{{AD}}"
$adimAdlari = @(@("Yazma izni denetleniyor", 0), @("Sürüm indiriliyor", 6), @("İndirilen dosya doğrulanıyor", 70), @("Dosyalar yerleştiriliyor", 78), @("Kısayollar oluşturuluyor", 92))
$onarVar = $false
#-- is
    function Indir([string]$adres, [string]$yol, [int]$y0, [int]$y1) {
      $istek = [Net.HttpWebRequest]::Create($adres)
      $istek.UserAgent = $S.ad + "-kurulum"
      $istek.Timeout = 30000
      $istek.ReadWriteTimeout = 30000
      try { $yanit = $istek.GetResponse() } catch { throw ("İndirilemedi (" + (Split-Path -Leaf $yol) + "): " + $_.Exception.GetBaseException().Message) }
      $toplam = $yanit.ContentLength
      $akis = $yanit.GetResponseStream()
      $dosya = [IO.File]::Create($yol)
      $alinan = 0L
      try {
        $tampon = New-Object byte[] 262144
        while (($n = $akis.Read($tampon, 0, $tampon.Length)) -gt 0) {
          $dosya.Write($tampon, 0, $n)
          $alinan += $n
          if ($toplam -gt 0) { $S.yuzde = $y0 + [int](($y1 - $y0) * $alinan / $toplam) }
        }
      } finally { $dosya.Close(); $akis.Close(); $yanit.Close() }
      if ($toplam -gt 0 -and $alinan -ne $toplam) { throw "İndirme yarıda kaldı ($alinan / $toplam bayt). Bağlantıyı denetleyip Yeniden dene." }
    }

    $gecici = Join-Path $env:TEMP ("kur-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Force $gecici | Out-Null
    $S.gecici = $gecici
    if ($S.prova) { $hedef = Join-Path $gecici ("prova\" + $S.ad); $S.hedef = $hedef; Yaz "Prova: geçici klasöre kurulur, kısayol yazılmaz" }
    Yaz ("Kaynak: github.com/" + $S.depo + " · " + $S.varlik)
    Yaz "Hedef : $hedef"

    Adim 0 6 "Yazma izni denetleniyor"
    $ust = Split-Path -Parent $hedef
    try {
      New-Item -ItemType Directory -Force $ust -ErrorAction Stop | Out-Null
      $dene = Join-Path $ust (".yazma-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
      [IO.File]::WriteAllText($dene, "")
      Remove-Item -LiteralPath $dene -Force
    } catch { throw "Bu klasöre yazılamıyor: $ust. Değiştir ile kullanıcı klasörünüzde bir yer seçin; yönetici yetkisi gerekmez." }
    Yaz "Yazma izni tamam: $ust"

    Adim 6 12 "Son sürüm soruluyor"
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $api = "https://api.github.com"
    if ($env:KUR_API) { $api = $env:KUR_API.TrimEnd("/"); Yaz "Sınama adresi: $api" }
    $basliklar = @{ "User-Agent" = $S.ad + "-kurulum"; Accept = "application/vnd.github+json" }
    try { $yayin = Invoke-RestMethod -Uri ($api + "/repos/" + $S.depo + "/releases/latest") -Headers $basliklar -TimeoutSec 30 -ErrorAction Stop }
    catch { throw ("GitHub'a ulaşılamadı, depo özel ya da yayımlanmış sürüm yok (" + $S.depo + "): " + $_.Exception.Message) }
    $zip = $yayin.assets | Where-Object { $_.name -eq $S.varlik } | Select-Object -First 1
    $ozet = $yayin.assets | Where-Object { $_.name -eq ($S.varlik + ".sha256") } | Select-Object -First 1
    if (-not $zip) { throw ("Sürüm " + $yayin.tag_name + " içinde " + $S.varlik + " yok.") }
    if (-not $ozet) { throw ("Sürüm " + $yayin.tag_name + " içinde " + $S.varlik + ".sha256 yok; doğrulanamayan dosya kurulmaz.") }
    $S.surum = [string]$yayin.tag_name
    Yaz ("Son sürüm: " + $S.surum + " · " + [math]::Round($zip.size / 1MB, 1) + " MB")

    Adim 12 70 "Sürüm indiriliyor"
    $zipYol = Join-Path $gecici $S.varlik
    Indir $zip.browser_download_url $zipYol 12 70
    Yaz "İndirildi: $($S.varlik)"

    Adim 70 78 "İndirilen dosya doğrulanıyor"
    $ozetYol = $zipYol + ".sha256"
    Indir $ozet.browser_download_url $ozetYol 70 72
    $beklenen = ([regex]::Match([IO.File]::ReadAllText($ozetYol), "\b[0-9a-fA-F]{64}\b")).Value.ToLowerInvariant()
    if (-not $beklenen) { throw ("Doğrulama dosyası okunamadı: " + $ozet.name) }
    $akisH = [IO.File]::OpenRead($zipYol)
    try { $gercek = ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($akisH)) -replace "-", "").ToLowerInvariant() } finally { $akisH.Close() }
    if ($gercek -ne $beklenen) { throw "İndirilen dosya doğrulanamadı: SHA-256 tutmuyor. Dosya bozuk ya da değiştirilmiş; kurulum yapılmadı." }
    Yaz "SHA-256 doğrulandı: $gercek"

    Adim 78 92 "Dosyalar yerleştiriliyor"
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $acik = Join-Path $gecici "acik"
    try { [IO.Compression.ZipFile]::ExtractToDirectory($zipYol, $acik) } catch { throw ("Paket açılamadı: " + $_.Exception.GetBaseException().Message) }
    $ic = @(Get-ChildItem -LiteralPath $acik -Force)
    if ($ic.Count -eq 1 -and $ic[0].PSIsContainer) { $acik = $ic[0].FullName }
    if (-not (Test-Path (Join-Path $acik $S.exe))) { throw ("Paketin içinde " + $S.exe + " yok; yanlış dosya indirilmiş olabilir.") }
    Yaz "Paket geçici klasöre açıldı"
    $S.yuzde = 84
    $eski = $hedef + ".eski"
    if (Test-Path $hedef) {
      Durdur $hedef
      Remove-Item -LiteralPath $eski -Recurse -Force -ErrorAction SilentlyContinue
      try { Rename-Item -LiteralPath $hedef -NewName (Split-Path -Leaf $eski) -ErrorAction Stop }
      catch { throw "Eski kurulum kullanımda, değiştirilemedi: $hedef. Programı kapatıp Yeniden dene." }
      Yaz "Eski sürüm kenara alındı"
    }
    try {
      if ([IO.Path]::GetPathRoot($acik) -eq [IO.Path]::GetPathRoot($hedef)) { Move-Item -LiteralPath $acik -Destination $hedef -ErrorAction Stop }
      else {
        robocopy $acik $hedef /E /MOVE /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
        if ($LASTEXITCODE -ge 8) { throw "robocopy çıkış $LASTEXITCODE" }
      }
    } catch {
      Remove-Item -LiteralPath $hedef -Recurse -Force -ErrorAction SilentlyContinue
      if (Test-Path $eski) { Rename-Item -LiteralPath $eski -NewName (Split-Path -Leaf $hedef) -ErrorAction SilentlyContinue }
      throw ("Dosyalar yerleştirilemedi, eski sürüm geri kondu: " + $_)
    }
    Remove-Item -LiteralPath $eski -Recurse -Force -ErrorAction SilentlyContinue
    Yaz "Yerleştirildi: $hedef"
    @{ tarih = (Get-Date).ToString("s"); surum = $S.surum; depo = $S.depo; varlik = $S.varlik; sha256 = $gercek; hedef = $hedef } | ConvertTo-Json | Set-Content (Join-Path (Split-Path $S.gunluk) "kurulum.json") -Encoding UTF8
    Remove-Item -LiteralPath $gecici -Recurse -Force -ErrorAction SilentlyContinue
