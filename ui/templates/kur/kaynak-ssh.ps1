$hedefVarsayilan = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "{{AD}}"
$adimAdlari = @(@("Git hazırlanıyor", 0), @("GitHub bağlantısı sınanıyor", 6), @("Sürüm indiriliyor", 12), @("Ayarlar yazılıyor", 52), @("Program hazırlanıyor", 76))
$onarVar = $true
#-- is
    function Kilitle([string]$yol) { icacls $yol /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null }
    function Coz([string]$yol) { if (Test-Path $yol) { icacls $yol /grant:r "$($env:USERNAME):(F)" | Out-Null } }
    function SshKomut([string]$ssh, [string]$anahtar, [string]$bilinen) {
      '"{0}" -i "{1}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="{2}"' -f ($ssh -replace '\\', '/'), ($anahtar -replace '\\', '/'), ($bilinen -replace '\\', '/')
    }
    $kaynak = $S.kaynak
    $hedef = $S.hedef
    $kur = Join-Path $kaynak ".kurulum"
    $depo = $S.depo
    $veriAdi = "veri"
    $gecici = Join-Path $env:TEMP ("kur-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Force $gecici | Out-Null
    Yaz "Kaynak: $kaynak"
    Yaz "Hedef : $hedef"

    Adim 2 6 "Git hazırlanıyor"
    $sistemGit = Get-Command git.exe -ErrorAction SilentlyContinue
    $usbGit = Join-Path $kur "git\cmd\git.exe"
    if ($sistemGit) { $git = $sistemGit.Source; $ssh = "ssh"; Yaz "Bilgisayarda Git var" }
    elseif (Test-Path $usbGit) { $git = $usbGit; $ssh = Join-Path $kur "git\usr\bin\ssh.exe"; Yaz "Bilgisayarda Git yok, taşınabilir Git kullanılacak" }
    else { throw "Git bulunamadı: ne bilgisayarda ne USB'de (.kurulum\git)" }

    $anahtarUsb = Join-Path $kur ("anahtar\" + $S.anahtarAdi)
    if (-not (Test-Path $anahtarUsb)) { throw "Erişim anahtarı yok: $anahtarUsb" }
    if ($S.prova) { $sshKlasor = $gecici } else { $sshKlasor = Join-Path $env:USERPROFILE ".ssh" }
    New-Item -ItemType Directory -Force $sshKlasor | Out-Null
    $anahtar = Join-Path $sshKlasor $S.anahtarAdi
    $bilinen = Join-Path $sshKlasor "known_hosts"
    Coz $anahtar
    Copy-Item $anahtarUsb $anahtar -Force
    Kilitle $anahtar
    Yaz "Erişim anahtarı: $anahtar"
    $env:GIT_SSH_COMMAND = SshKomut $ssh $anahtar $bilinen
    $env:GIT_TERMINAL_PROMPT = "0"

    Adim 6 12 "GitHub bağlantısı sınanıyor"
    $uzak = & $git ls-remote $depo HEAD 2>&1
    if ($LASTEXITCODE -eq 0) { Yaz "GitHub erişimi tamam" }
    else { $S.cevrimdisi = $true; Yaz ("GitHub'a ulaşılamadı: " + ($uzak | Select-Object -Last 1)) }

    Adim 12 16 "Eski kurulum aranıyor"
    $mevcut = Test-Path $hedef
    $gitli = Test-Path (Join-Path $hedef ".git")
    if (-not $mevcut) { Yaz "Eski kurulum yok" }
    elseif ($S.onar) {
      Adim 16 24 "Eski kurulum kaldırılıyor"
      if ($S.prova) { Yaz "Prova: silinmedi" }
      else {
        Durdur $hedef
        $yedekKok = Join-Path $env:LOCALAPPDATA ($S.ad + "\yedek\" + (Get-Date -Format "yyyyMMdd-HHmmss"))
        foreach ($d in @($hedef) + @(Get-ChildItem -LiteralPath $hedef -Directory -ErrorAction SilentlyContinue | ForEach-Object FullName)) {
          $v = Join-Path $d $veriAdi
          if (Test-Path $v) {
            $yv = Join-Path $yedekKok (Split-Path $d -Leaf)
            robocopy $v $yv /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
            Yaz "Veri yedeklendi: $yv"
          }
        }
        if ($gitli -and -not $S.cevrimdisi) {
          & $git -C $hedef add -A -- ":(glob)**/$veriAdi/**" 2>&1 | Out-Null
          & $git -C $hedef -c user.name=$env:USERNAME -c "user.email=$env:USERNAME@$env:COMPUTERNAME" commit -m "veri (onarım öncesi, $env:COMPUTERNAME)" 2>&1 | Out-Null
          & $git -C $hedef -c user.name=$env:USERNAME -c "user.email=$env:USERNAME@$env:COMPUTERNAME" pull --no-rebase --no-edit -X ours $depo main 2>&1 | Out-Null
          & $git -C $hedef push $depo HEAD:main 2>&1 | Out-Null
          if ($LASTEXITCODE -eq 0) { Yaz "Eski kurulumdaki veri GitHub'a gönderildi" } else { Yaz "Eski veri gönderilemedi, yedekte duruyor" }
        }
        Remove-Item -LiteralPath $hedef -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path $hedef) { throw "Eski kurulum silinemedi (açık bir dosya olabilir): $hedef" }
        Yaz "Silindi: $hedef"
      }
    }
    elseif (-not $gitli) { throw "Kurulum klasörü bozuk görünüyor ($hedef). Onar düğmesiyle baştan kurun." }
    else {
      Yaz "Kurulum var, yerinde güncellenecek"
      if (-not $S.prova) { Durdur $hedef }
    }

    $yerinde = $mevcut -and $gitli -and -not $S.onar -and -not $S.prova
    if ($S.prova) { $hedef = Join-Path $gecici $S.ad; $S.hedef = $hedef; Yaz "Prova hedefi: $hedef" }

    if ($yerinde) {
      Adim 24 52 "Güncel sürüm çekiliyor"
      if ($S.cevrimdisi) { Yaz "Çevrimdışı: güncelleme ilk bağlantıya kaldı" }
      else {
        & $git -C $hedef pull --no-rebase --no-edit 2>&1 | ForEach-Object { Yaz "$_" }
        if ($LASTEXITCODE -ne 0) { Yaz "Güncelleme çekilemedi; kurulu sürümle devam ediliyor" }
      }
    } else {
      if (-not $S.cevrimdisi) {
        Adim 24 52 "Güncel sürüm GitHub'dan indiriliyor"
        & $git clone --quiet $depo $hedef 2>&1 | ForEach-Object { Yaz "$_" }
        if ($LASTEXITCODE -ne 0) { $S.cevrimdisi = $true; Remove-Item -LiteralPath $hedef -Recurse -Force -ErrorAction SilentlyContinue }
      }
      if ($S.cevrimdisi) {
        Adim 24 52 "USB'deki sürüm kopyalanıyor"
        robocopy $kaynak $hedef /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /MT:16 /XD .kurulum .araclar trash node_modules /XF Kur.bat | Out-Null
        if ($LASTEXITCODE -ge 8) { throw "Kopyalama başarısız (robocopy $LASTEXITCODE)" }
        Yaz "Çevrimdışı kuruldu; program ilk bağlantıda kendini günceller"
      }
    }
    if (-not (Test-Path (Join-Path $hedef ".git"))) { throw "Kurulum klasörü eksik: $hedef" }

    Adim 52 56 "Git ayarları yazılıyor"
    $arac = Join-Path $hedef ".araclar"
    New-Item -ItemType Directory -Force $arac | Out-Null
    $kaliciSsh = $ssh
    if (-not $sistemGit) {
      Adim 56 76 "Taşınabilir Git kuruluyor"
      robocopy (Join-Path $kur "git") (Join-Path $arac "git") /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /MT:16 | Out-Null
      if ($LASTEXITCODE -ge 8) { throw "Git kopyalanamadı (robocopy $LASTEXITCODE)" }
      $git = Join-Path $arac "git\cmd\git.exe"
      $kaliciSsh = Join-Path $arac "git\usr\bin\ssh.exe"
    }
    & $git -C $hedef config core.sshCommand ((SshKomut $kaliciSsh $anahtar $bilinen) -replace '"', '\"')
    & $git -C $hedef config remote.origin.url $depo
    & $git -C $hedef config user.name $env:USERNAME
    & $git -C $hedef config user.email "$env:USERNAME@$env:COMPUTERNAME"
    & $git -C $hedef config core.quotepath false
    if ($LASTEXITCODE -ne 0) { throw "Git ayarları yazılamadı (çıkış $LASTEXITCODE)" }
    Yaz "Git ayarları yazıldı"

    $surum = (& $git -C $hedef rev-parse --short HEAD) | Select-Object -First 1
    $S.surum = "$surum"
    @{ tarih = (Get-Date).ToString("s"); surum = "$surum"; bilgisayar = $env:COMPUTERNAME; cevrimdisi = [bool]$S.cevrimdisi; anahtar = $S.anahtarAdi } | ConvertTo-Json | Set-Content (Join-Path $arac "kurulum.json") -Encoding UTF8
    if (-not $S.prova) { Remove-Item $gecici -Recurse -Force -ErrorAction SilentlyContinue }
