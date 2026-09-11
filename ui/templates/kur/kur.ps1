param([string]$AnahtarAdi = "{{ANAHTAR}}", [switch]$Onar, [switch]$Prova)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$kaynak = Split-Path -Parent $MyInvocation.MyCommand.Path
$betik = $MyInvocation.MyCommand.Path
$S = [hashtable]::Synchronized(@{
  ad = "{{AD}}"
  altbaslik = "{{ALTBASLIK}}"
  depo = "{{DEPO}}"
  anahtarAdi = $AnahtarAdi
  onar = [bool]$Onar
  kaynak = $kaynak
  hedef = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "{{AD}}"
  gunluk = Join-Path $env:LOCALAPPDATA "{{AD}}\kurulum.log"
  yuzde = 0
  tavan = 2
  adim = "Hazırlanıyor"
  log = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
  durum = "calisiyor"
  cevrimdisi = $false
  prova = ([bool]$Prova -or [bool]$env:KUR_PROVA)
  baslat = $null
})

$is = {
  param($S)
  $ErrorActionPreference = "Continue"
  New-Item -ItemType Directory -Force (Split-Path $S.gunluk) | Out-Null
  function Yaz([string]$m) {
    $satir = (Get-Date -Format "HH:mm:ss") + "  " + $m
    [void]$S.log.Add($satir)
    Add-Content -Path $S.gunluk -Value $satir -Encoding UTF8
  }
  function Adim([int]$y, [int]$t, [string]$m) { $S.yuzde = $y; $S.tavan = $t; $S.adim = $m; Yaz $m }
  function Kilitle([string]$yol) { icacls $yol /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null }
  function Coz([string]$yol) { if (Test-Path $yol) { icacls $yol /grant:r "$($env:USERNAME):(F)" | Out-Null } }
  function SshKomut([string]$ssh, [string]$anahtar, [string]$bilinen) {
    '"{0}" -i "{1}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="{2}"' -f ($ssh -replace '\\', '/'), ($anahtar -replace '\\', '/'), ($bilinen -replace '\\', '/')
  }
  function Durdur([string]$kok) {
    Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($kok, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object {
      Yaz ("Kapatılıyor: " + $_.Name)
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 800
  }

  try {
    $kaynak = $S.kaynak
    $hedef = $S.hedef
    $kur = Join-Path $kaynak ".kurulum"
    $depo = $S.depo
    $veriAdi = "veri"
    $gecici = Join-Path $env:TEMP ("kur-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Force $gecici | Out-Null
    Yaz "Kaynak: $kaynak"
    Yaz "Hedef : $hedef"
    if ($S.onar) { Yaz "Onarım: kurulum baştan yapılacak" }

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

    {{ADIMLAR}}

    $surum = (& $git -C $hedef rev-parse --short HEAD) | Select-Object -First 1
    @{ tarih = (Get-Date).ToString("s"); surum = "$surum"; bilgisayar = $env:COMPUTERNAME; cevrimdisi = [bool]$S.cevrimdisi; anahtar = $S.anahtarAdi } | ConvertTo-Json | Set-Content (Join-Path $arac "kurulum.json") -Encoding UTF8
    if (-not $S.prova) { Remove-Item $gecici -Recurse -Force -ErrorAction SilentlyContinue }
    Adim 100 100 "Kurulum tamamlandı · sürüm $surum"
    $S.durum = "bitti"
  } catch {
    Yaz ("HATA: " + $_)
    $S.adim = "Kurulum yarıda kaldı: " + $_
    $S.durum = "hata"
  }
}

function Renk([string]$h, [int]$a = 255) { [System.Drawing.Color]::FromArgb($a, [System.Drawing.ColorTranslator]::FromHtml($h)) }
function Yazi([int]$px, [string]$stil = "Regular", [string]$aile = "Segoe UI") { New-Object System.Drawing.Font($aile, $px, [System.Drawing.FontStyle]$stil, [System.Drawing.GraphicsUnit]::Pixel) }

$R = @{
  zemin = Renk "#08090a"; metin = Renk "#ffffff"; mavi = Renk "#00f3ff"; mor = Renk "#b026ff"
  basari = Renk "#34d399"; tehlike = Renk "#ff54eb"; sonuk = Renk "#71717a"
  kenar = Renk "#00f3ff" 128; iz = Renk "#00f3ff" 77
}
$YZ = @{ baslik = Yazi 24 "Bold"; adim = Yazi 16; kucuk = Yazi 14; log = Yazi 14 "Regular" "Consolas"; dugme = Yazi 14 "Bold" }
$B = @{}
foreach ($k in $R.Keys) { $B[$k] = New-Object System.Drawing.SolidBrush $R[$k] }
$G = @{ goster = 0.0; faz = 0.0; surukle = $null; sonlandi = $false; ikon = $null }

$f = New-Object System.Windows.Forms.Form
$f.Text = $S.ad + " Kurulum"
$f.FormBorderStyle = "None"
$f.StartPosition = "CenterScreen"
$f.ClientSize = New-Object System.Drawing.Size(560, 424)
$f.BackColor = $R.zemin
$f.ForeColor = $R.metin
$f.KeyPreview = $true
$f.GetType().GetProperty("DoubleBuffered", [Reflection.BindingFlags]"Instance,NonPublic").SetValue($f, $true, $null)
$simgeYol = Join-Path $kaynak "{{SIMGE}}"
if (Test-Path $simgeYol) {
  $f.Icon = New-Object System.Drawing.Icon($simgeYol)
  $G.ikon = (New-Object System.Drawing.Icon($simgeYol, 64, 64)).ToBitmap()
}

$f.Add_MouseDown({ if ($_.Button -eq "Left") { $G.surukle = $_.Location } })
$f.Add_MouseMove({ if ($G.surukle) { $f.Location = New-Object System.Drawing.Point(($f.Location.X + $_.X - $G.surukle.X), ($f.Location.Y + $_.Y - $G.surukle.Y)) } })
$f.Add_MouseUp({ $G.surukle = $null })

$f.Add_Paint({
  $cz = $_.Graphics
  $cz.SmoothingMode = "AntiAlias"
  $cz.TextRenderingHint = "ClearTypeGridFit"
  $w = $f.ClientSize.Width
  $h = $f.ClientSize.Height
  $bicim = New-Object System.Drawing.StringFormat
  $bicim.Trimming = "EllipsisCharacter"
  $bicim.FormatFlags = "NoWrap"
  $cz.DrawRectangle((New-Object System.Drawing.Pen($R.kenar, 1)), 0, 0, $w - 1, $h - 1)
  if ($G.ikon) { $cz.DrawImage($G.ikon, 24, 24, 48, 48) }
  $cz.DrawString($S.ad, $YZ.baslik, $B.metin, 84, 20)
  $gen = $cz.MeasureString($S.ad, $YZ.baslik).Width
  $cz.DrawString("Kurulum", $YZ.baslik, $B.mavi, 84 + $gen - 4, 20)
  if ($S.durum -eq "hata") { $alt = "Günlük  ·  " + $S.gunluk }
  elseif ($S.altbaslik) { $alt = $S.altbaslik + "  ·  " + $S.hedef }
  else { $alt = $S.hedef }
  $cz.DrawString($alt, $YZ.kucuk, $B.sonuk, (New-Object System.Drawing.RectangleF(86, 52, ($w - 110), 20)), $bicim)

  $renk = switch ($S.durum) { "bitti" { $R.basari } "hata" { $R.tehlike } default { $R.metin } }
  $yuzdeMetin = [string][math]::Floor($G.goster) + "%"
  $yg = $cz.MeasureString($yuzdeMetin, $YZ.adim).Width
  $alan = New-Object System.Drawing.RectangleF(24, 100, ($w - 60 - $yg), 22)
  $cz.DrawString($S.adim, $YZ.adim, (New-Object System.Drawing.SolidBrush $renk), $alan, $bicim)
  $cz.DrawString($yuzdeMetin, $YZ.adim, $B.mavi, ($w - 24 - $yg), 100)

  $bx = 24; $by = 132; $bw = $w - 48; $bh = 8
  $cz.FillRectangle((New-Object System.Drawing.SolidBrush $R.iz), $bx, $by, $bw, $bh)
  $dolu = [int]($bw * [math]::Min(100, $G.goster) / 100)
  if ($dolu -gt 1) {
    $dik = New-Object System.Drawing.Rectangle($bx, $by, $dolu, $bh)
    if ($S.durum -eq "calisiyor") { $fr = New-Object System.Drawing.Drawing2D.LinearGradientBrush($dik, $R.mavi, $R.mor, 0.0) }
    else { $fr = New-Object System.Drawing.SolidBrush $renk }
    $cz.FillRectangle($fr, $dik)
    for ($i = 1; $i -le 3; $i++) { $cz.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb([int](40 / $i), $renk))), $bx, $by - $i, $dolu, $bh + 2 * $i) }
    if ($S.durum -eq "calisiyor") {
      $px = $bx + (($G.faz % 1.0) * ($dolu + 120)) - 120
      $pr = New-Object System.Drawing.Rectangle([int]$px, $by, 120, $bh)
      $pg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pr, (Renk "#ffffff" 0), (Renk "#ffffff" 0), 0.0)
      $bl = New-Object System.Drawing.Drawing2D.ColorBlend(3)
      $bl.Colors = @((Renk "#ffffff" 0), (Renk "#ffffff" 150), (Renk "#ffffff" 0))
      $bl.Positions = @(0.0, 0.5, 1.0)
      $pg.InterpolationColors = $bl
      $cz.SetClip($dik)
      $cz.FillRectangle($pg, $pr)
      $cz.ResetClip()
    }
  }

  $satirlar = $S.log.ToArray()
  $n = $satirlar.Count
  $bas = [math]::Max(0, $n - 9)
  $y = 160
  for ($i = $bas; $i -lt $n; $i++) {
    $fircaLog = if ($i -eq $n - 1) { $B.mavi } else { $B.sonuk }
    $cz.DrawString($satirlar[$i], $YZ.log, $fircaLog, (New-Object System.Drawing.RectangleF(24, $y, ($w - 48), 20)), $bicim)
    $y += 20
  }
})

function Dugme([string]$metin, [bool]$birincil, [int]$x) {
  $dg = New-Object System.Windows.Forms.Button
  $dg.Text = $metin
  $dg.FlatStyle = "Flat"
  $dg.Font = $YZ.dugme
  $dg.Size = New-Object System.Drawing.Size(160, 36)
  $dg.Location = New-Object System.Drawing.Point($x, 364)
  $dg.Cursor = "Hand"
  if ($birincil) { $dg.BackColor = $R.mavi; $dg.ForeColor = $R.zemin; $dg.FlatAppearance.BorderSize = 0 }
  else { $dg.BackColor = $R.zemin; $dg.ForeColor = $R.mavi; $dg.FlatAppearance.BorderColor = $R.mavi }
  $dg.Visible = $false
  $f.Controls.Add($dg)
  $dg
}
$programAc = Dugme "Programı Aç" $true 24
$gunlukAc = Dugme "Günlüğü Aç" $true 24
$onarDugme = Dugme "Onar" $false 200
$kapat = Dugme "Kapat" $false 376
$programAc.Add_Click({ Start-Process $S.baslat; $f.Close() })
$gunlukAc.Add_Click({ Start-Process notepad.exe $S.gunluk })
$onarDugme.Add_Click({
  $argumanlar = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-STA", "-WindowStyle", "Hidden", "-File", ('"' + $betik + '"'), "-Onar", "-AnahtarAdi", $S.anahtarAdi)
  if ($S.prova) { $argumanlar += "-Prova" }
  Start-Process powershell.exe -ArgumentList $argumanlar
  $f.Close()
})
$kapat.Add_Click({ $f.Close() })
$f.Add_KeyDown({ if ($_.KeyCode -eq "Escape" -and $S.durum -ne "calisiyor") { $f.Close() } })
$f.Add_FormClosing({ if ($S.durum -eq "calisiyor") { $_.Cancel = $true } })

$zaman = New-Object System.Windows.Forms.Timer
$zaman.Interval = 16
$zaman.Add_Tick({
  $hy = [double]$S.yuzde
  if ($G.goster -lt $hy) { $G.goster = [math]::Min($hy, $G.goster + [math]::Max(0.2, ($hy - $G.goster) * 0.08)) }
  elseif ($S.durum -eq "calisiyor" -and $G.goster -lt ($S.tavan - 0.5)) { $G.goster += ($S.tavan - $G.goster) * 0.006 }
  $G.faz += 0.012
  if ($S.durum -ne "calisiyor" -and -not $G.sonlandi) {
    $G.sonlandi = $true
    $kapat.Visible = $true
    $onarDugme.Visible = $true
    if ($S.durum -eq "bitti") {
      if (-not $S.prova -and $S.baslat) { $programAc.Visible = $true; [void]$programAc.Focus() } else { [void]$kapat.Focus() }
    } else { $gunlukAc.Visible = $true; [void]$gunlukAc.Focus() }
  }
  $f.Invalidate()
})

$rs = [runspacefactory]::CreateRunspace()
$rs.ApartmentState = "STA"
$rs.Open()
$ps = [powershell]::Create()
$ps.Runspace = $rs
[void]$ps.AddScript($is).AddArgument($S)
$f.Add_Shown({ [void]$ps.BeginInvoke(); $zaman.Start() })
[System.Windows.Forms.Application]::Run($f)
$zaman.Stop()
$rs.Close()
