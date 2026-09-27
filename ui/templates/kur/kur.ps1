# teknesyum-ui template kur/kur.ps1
param([string]$AnahtarAdi = "{{ANAHTAR}}", [switch]$Onar, [switch]$Prova, [switch]$Otomatik, [string]$Hedef = "")

$kaynak = Split-Path -Parent $MyInvocation.MyCommand.Path
$kok = $env:KUR_KOK

{{KAYNAK_AYAR}}

if ($kok) {
  $hedefVarsayilan = Join-Path $kok ("Programlar\" + "{{AD}}")
  $masaustu = Join-Path $kok "Masaustu"
  $menu = Join-Path $kok "BaslatMenusu"
  $gunluk = Join-Path $kok "Gunluk\kurulum.log"
} else {
  $masaustu = [Environment]::GetFolderPath("Desktop")
  $menu = [Environment]::GetFolderPath("Programs")
  $gunluk = Join-Path $env:LOCALAPPDATA "{{AD}}\kurulum.log"
}
if ($Hedef) { $hedefVarsayilan = $Hedef }

$S = [hashtable]::Synchronized(@{
  ad = "{{AD}}"
  altbaslik = "{{ALTBASLIK}}"
  depo = "{{DEPO}}"
  varlik = "{{VARLIK}}"
  exe = "{{EXE}}"
  anahtarAdi = $AnahtarAdi
  onar = [bool]$Onar
  kaynak = $kaynak
  hedef = $hedefVarsayilan
  masaustu = $masaustu
  menu = $menu
  gunluk = $gunluk
  sonuc = $env:KUR_SONUC
  adimlar = $adimAdlari
  yuzde = 0
  tavan = 0
  adim = "Kurulum yerini seç ve Kur düğmesine bas."
  log = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
  durum = "hazir"
  hata = $null
  surum = ""
  kisayol = $null
  cevrimdisi = $false
  prova = ([bool]$Prova -or [bool]$env:KUR_PROVA)
  otomatik = ([bool]$Otomatik -or [bool]$env:KUR_OTOMATIK)
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
    if ($S.otomatik) { [Console]::Out.WriteLine($satir) }
  }
  function Adim([int]$y, [int]$t, [string]$m) { $S.yuzde = $y; $S.tavan = $t; $S.adim = $m; Yaz $m }
  function Durdur([string]$kok) {
    Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($kok, [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object {
      Yaz ("Kapatılıyor: " + $_.Name)
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 800
  }

  try {
    $hedef = $S.hedef
    if ($S.onar) { Yaz "Onarım: kurulum baştan yapılacak" }

{{KAYNAK_IS}}

    {{ADIMLAR}}

    if ($S.surum) { $son = "Kurulum tamamlandı · sürüm " + $S.surum } else { $son = "Kurulum tamamlandı" }
    Adim 100 100 $son
    $S.durum = "bitti"
  } catch {
    Yaz ("HATA: " + $_)
    $S.hata = [string]$_
    $S.adim = "Kurulum yarıda kaldı: " + $_
    $S.durum = "hata"
  }
  if ($S.gecici -and -not $S.prova) { Remove-Item -LiteralPath $S.gecici -Recurse -Force -ErrorAction SilentlyContinue }
  if ($S.sonuc) {
    @{ durum = $S.durum; hedef = $S.hedef; surum = $S.surum; kisayol = $S.kisayol; hata = $S.hata; prova = [bool]$S.prova } | ConvertTo-Json | Set-Content -LiteralPath $S.sonuc -Encoding UTF8
  }
}

if ($S.otomatik) {
  $S.durum = "calisiyor"
  & $is $S
  if ($S.durum -eq "bitti") { exit 0 } else { exit 1 }
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function Renk([string]$h, [double]$a = 1) { [System.Drawing.Color]::FromArgb([int][math]::Round(255 * $a), [System.Drawing.ColorTranslator]::FromHtml($h)) }
function Aile([string]$zincir) {
  $kurulu = @((New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name })
  $parca = $zincir.Split(",") | ForEach-Object { $_.Trim() }
  foreach ($a in $parca) { if ($kurulu -contains $a) { return $a } }
  $parca[-1]
}
function Yazi([double]$px, [string]$stil, [string]$aile) { New-Object System.Drawing.Font($aile, [single]$px, [System.Drawing.FontStyle]$stil, [System.Drawing.GraphicsUnit]::Pixel) }

$R = @{
  zemin = Renk "{{RENK_ZEMIN}}"; metin = Renk "{{RENK_METIN}}"; etiket = Renk "{{RENK_ETIKET}}"
  renk1 = Renk "{{RENK_1}}"; renk2 = Renk "{{RENK_2}}"; vurgu = Renk "{{RENK_VURGU}}"
  basari = Renk "{{RENK_BASARI}}"; tehlike = Renk "{{RENK_TEHLIKE}}"; edilgen = Renk "{{RENK_EDILGEN}}"
  ustu1 = Renk "{{RENK_USTU_1}}"; kenar = Renk "{{RENK_KENAR}}" {{KENAR_ALFA}}; iz = Renk "{{RENK_IZ}}" {{IZ_ALFA}}
  suren = Renk "{{RENK_1}}" {{SUREN_ALFA}}
}
$pencereKenari = "{{PENCERE_KENARI}}"
$O = @{
  fs1 = {{FS_1}}; fs2 = {{FS_2}}; fs4 = {{FS_4}}; satir = {{SATIR_MONO}}; baslikSatir = {{SATIR_BASLIK}}
  b2 = {{BOSLUK_2}}; b3 = {{BOSLUK_3}}; b4 = {{BOSLUK_4}}; b5 = {{BOSLUK_5}}
  ikon = {{IKON}}; isaret = {{HEDEF_MIN}}; dugmeY = {{DUGME_Y}}; dugmePx = {{DUGME_PX}}
  cizgi = {{KENAR_W}}; genislik = {{PENCERE_W}}
}
$sans = Aile "{{YAZI_SANS}}"
$mono = Aile "{{YAZI_MONO}}"
$YZ = @{
  baslik = Yazi $O.fs4 "Bold" $sans; govde = Yazi $O.fs2 "Regular" $sans; guclu = Yazi $O.fs2 "Bold" $sans
  log = Yazi $O.fs2 "Regular" $mono; isaret = Yazi $O.fs2 "Bold" $mono; dugme = Yazi $O.fs2 "Bold" $sans
}
$B = @{}
foreach ($k in $R.Keys) { $B[$k] = New-Object System.Drawing.SolidBrush $R[$k] }
$G = @{ goster = 0.0; surukle = $null; ikon = $null; dugmeler = @(); ps = $null; rs = $null }
$LOG_SATIRI = 5

$y = $O.b5
$L = @{ baslik = $y }
$y += $O.ikon + $O.b4; $L.adimlar = $y
$y += $S.adimlar.Count * ($O.isaret + $O.b2) - $O.b2 + $O.b4; $L.cubuk = $y
$y += [int]($O.fs2 * $O.baslikSatir) + $O.b3; $L.log = $y
$y += $LOG_SATIRI * $O.satir + $O.b4; $L.yer = $y
$y += $O.dugmeY + $O.b5; $L.dugme = $y
$y += $O.dugmeY + $O.b5; $L.yukseklik = $y

$f = New-Object System.Windows.Forms.Form
$f.Text = $S.ad + " Kurulum"
$f.FormBorderStyle = "None"
$f.StartPosition = "CenterScreen"
$f.ClientSize = New-Object System.Drawing.Size($O.genislik, $L.yukseklik)
$f.BackColor = $R.zemin
$f.ForeColor = $R.metin
$f.KeyPreview = $true
$f.GetType().GetProperty("DoubleBuffered", [Reflection.BindingFlags]"Instance,NonPublic").SetValue($f, $true, $null)
$simgeYol = Join-Path $kaynak "{{SIMGE}}"
if (Test-Path $simgeYol) {
  $f.Icon = New-Object System.Drawing.Icon($simgeYol)
  $G.ikon = (New-Object System.Drawing.Icon($simgeYol, 256, 256)).ToBitmap()
}

function SuAnkiAdim {
  $i = 0
  for ($k = 0; $k -lt $S.adimlar.Count; $k++) { if ($S.yuzde -ge $S.adimlar[$k][1]) { $i = $k } }
  $i
}

function Dugme([string]$eylem, [string]$metin, [bool]$birincil, [bool]$etkin) { @{ eylem = $eylem; metin = $metin; birincil = $birincil; etkin = $etkin; alan = $null } }

function Dugmeler {
  $w = $f.ClientSize.Width
  $calisiyor = $S.durum -eq "calisiyor"
  $alt = @(switch ($S.durum) {
    "hazir" { @((Dugme "kapat" "Kapat" $false $true), (Dugme "kur" "Kur" $true $true)) }
    "calisiyor" { @((Dugme "kapat" "Kapat" $false $false), (Dugme "yok" "Kuruluyor" $true $false)) }
    "bitti" {
      $d = @()
      if ($onarVar) { $d += Dugme "onar" "Onar" $false $true }
      $d += Dugme "kapat" "Kapat" $false $true
      if (-not $S.prova -and $S.baslat) { $d += Dugme "ac" "Programı aç" $true $true }
      $d
    }
    default { @((Dugme "gunluk" "Günlüğü aç" $false $true), (Dugme "kapat" "Kapat" $false $true), (Dugme "yeniden" "Yeniden dene" $true $true)) }
  })
  $olc = [System.Windows.Forms.TextRenderer]
  $x = $w - $O.b5
  for ($i = $alt.Count - 1; $i -ge 0; $i--) {
    $gen = $olc::MeasureText($alt[$i].metin, $YZ.dugme).Width + 2 * $O.dugmePx
    $x -= $gen
    $alt[$i].alan = New-Object System.Drawing.Rectangle($x, $L.dugme, $gen, $O.dugmeY)
    $x -= $O.b3
  }
  $degistir = Dugme "degistir" "Değiştir" $false ($S.durum -eq "hazir" -or $S.durum -eq "hata")
  $gen = $olc::MeasureText($degistir.metin, $YZ.dugme).Width + 2 * $O.dugmePx
  $degistir.alan = New-Object System.Drawing.Rectangle(($w - $O.b5 - $gen), $L.yer, $gen, $O.dugmeY)
  @($degistir) + $alt
}

$f.Add_Paint({
  $cz = $_.Graphics
  $cz.SmoothingMode = "AntiAlias"
  $cz.TextRenderingHint = "ClearTypeGridFit"
  $w = $f.ClientSize.Width
  $h = $f.ClientSize.Height
  $P = $O.b5
  $bicim = New-Object System.Drawing.StringFormat
  $bicim.Trimming = "EllipsisCharacter"
  $bicim.FormatFlags = "NoWrap"
  $bicim.LineAlignment = "Center"
  $sarBicim = New-Object System.Drawing.StringFormat
  $sarBicim.Trimming = "EllipsisWord"
  $orta = New-Object System.Drawing.StringFormat
  $orta.Alignment = "Center"
  $orta.LineAlignment = "Center"
  if ($pencereKenari) { $cz.DrawRectangle((New-Object System.Drawing.Pen((Renk $pencereKenari {{PENCERE_ALFA}}), $O.cizgi)), 0, 0, $w - 1, $h - 1) }

  $metinX = $P
  if ($G.ikon) { $cz.DrawImage($G.ikon, $P, $L.baslik, $O.ikon, $O.ikon); $metinX = $P + $O.ikon + $O.b3 }
  $baslikY = [int]($O.fs4 * $O.baslikSatir)
  $cz.DrawString($S.ad, $YZ.baslik, $B.renk1, (New-Object System.Drawing.RectangleF($metinX, $L.baslik, ($w - $metinX - $P), $baslikY)), $bicim)
  $gen = [System.Windows.Forms.TextRenderer]::MeasureText($S.ad, $YZ.baslik).Width
  $cz.DrawString("Kurulum", $YZ.baslik, $B.vurgu, (New-Object System.Drawing.RectangleF(($metinX + $gen), $L.baslik, ($w - $metinX - $gen - $P), $baslikY)), $bicim)
  if ($S.durum -eq "hata") { $alt = "Günlük  ·  " + $S.gunluk; $altFirca = $B.tehlike }
  elseif ($S.surum) { $alt = "Sürüm " + $S.surum; $altFirca = $B.metin }
  elseif ($S.altbaslik) { $alt = $S.altbaslik; $altFirca = $B.metin }
  else { $alt = "github.com/" + $S.depo; $altFirca = $B.metin }
  $cz.DrawString($alt, $YZ.govde, $altFirca, (New-Object System.Drawing.RectangleF($metinX, ($L.baslik + $baslikY + $O.b2), ($w - $metinX - $P), [int]($O.fs2 * $O.baslikSatir))), $bicim)

  $suan = SuAnkiAdim
  $ay = $L.adimlar
  for ($i = 0; $i -lt $S.adimlar.Count; $i++) {
    if ($S.durum -eq "bitti" -or ($S.durum -ne "hazir" -and $i -lt $suan)) { $tur = "bitti" }
    elseif ($S.durum -eq "hata" -and $i -eq $suan) { $tur = "hata" }
    elseif ($S.durum -eq "calisiyor" -and $i -eq $suan) { $tur = "suren" }
    else { $tur = "" }
    $kutu = New-Object System.Drawing.Rectangle($P, $ay, $O.isaret, $O.isaret)
    switch ($tur) {
      "bitti" { $kalem = $R.basari; $yazi = $B.basari; $isaret = [string][char]0x2713 }
      "hata" { $kalem = $R.tehlike; $yazi = $B.tehlike; $isaret = "!" }
      "suren" { $kalem = $R.renk1; $yazi = $B.renk1; $isaret = [string]($i + 1); $cz.FillRectangle((New-Object System.Drawing.SolidBrush $R.suren), $kutu) }
      default { $kalem = $R.kenar; $yazi = $B.metin; $isaret = [string]($i + 1) }
    }
    $cz.DrawRectangle((New-Object System.Drawing.Pen($kalem, $O.cizgi)), $kutu.X, $kutu.Y, $kutu.Width - 1, $kutu.Height - 1)
    $cz.DrawString($isaret, $YZ.isaret, $yazi, (New-Object System.Drawing.RectangleF($kutu.X, $kutu.Y, $kutu.Width, $kutu.Height)), $orta)
    if ($tur -eq "suren") { $adYazi = $YZ.guclu } else { $adYazi = $YZ.govde }
    $cz.DrawString($S.adimlar[$i][0], $adYazi, $yazi, (New-Object System.Drawing.RectangleF(($P + $O.isaret + $O.b3), $ay, ($w - 2 * $P - $O.isaret - $O.b3), $O.isaret)), $bicim)
    $ay += $O.isaret + $O.b2
  }

  $renk = switch ($S.durum) { "bitti" { $R.basari } "hata" { $R.tehlike } default { $R.renk1 } }
  $yuzdeMetin = [string][math]::Floor($G.goster) + "%"
  $yg = [System.Windows.Forms.TextRenderer]::MeasureText("100%", $YZ.isaret).Width
  $satirY = [int]($O.fs2 * $O.baslikSatir)
  $sag = New-Object System.Drawing.StringFormat
  $sag.Alignment = "Far"
  $sag.LineAlignment = "Center"
  $cz.DrawString($yuzdeMetin, $YZ.isaret, (New-Object System.Drawing.SolidBrush $renk), (New-Object System.Drawing.RectangleF(($w - $P - $yg), $L.cubuk, $yg, $satirY)), $sag)
  $bx = $P; $bw = $w - 2 * $P - $yg - $O.b3; $bh = $O.b2; $by = $L.cubuk + [int](($satirY - $bh) / 2)
  $cz.FillRectangle($B.iz, $bx, $by, $bw, $bh)
  $dolu = [int]($bw * [math]::Min(100, $G.goster) / 100)
  if ($dolu -gt 1) {
    $dik = New-Object System.Drawing.Rectangle($bx, $by, $dolu, $bh)
    if ($S.durum -eq "calisiyor") { $fr = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Rectangle($bx, $by, $bw, $bh)), $R.renk1, $R.renk2, 0.0) }
    else { $fr = New-Object System.Drawing.SolidBrush $renk }
    $cz.FillRectangle($fr, $dik)
  }

  $satirlar = @($S.log.ToArray())
  if (-not $satirlar.Count) { $satirlar = @($S.adim) }
  $n = $satirlar.Count
  $hataVar = $S.durum -eq "hata"
  $sigan = $LOG_SATIRI
  if ($hataVar) { $sigan = $LOG_SATIRI - 2 }
  $bas = [math]::Max(0, $n - $sigan)
  $ly = $L.log
  for ($i = $bas; $i -lt $n; $i++) {
    $sira = $i - $bas
    $gorunen = $n - $bas
    $yuk = $O.satir
    $bc = $bicim
    if ($i -eq $n - 1) {
      if ($hataVar) { $lr = $R.tehlike; $yuk = $O.satir * 3; $bc = $sarBicim } else { $lr = $R.metin }
    } else { $lr = $R.etiket }
    if (-not $hataVar -and $gorunen -eq $LOG_SATIRI -and $sira -eq 0) { $lr = [System.Drawing.Color]::FromArgb([int](255 * {{SOLAN_1}}), $lr) }
    elseif (-not $hataVar -and $gorunen -eq $LOG_SATIRI -and $sira -eq 1) { $lr = [System.Drawing.Color]::FromArgb([int](255 * {{SOLAN_2}}), $lr) }
    $cz.DrawString($satirlar[$i], $YZ.log, (New-Object System.Drawing.SolidBrush $lr), (New-Object System.Drawing.RectangleF($P, $ly, ($w - 2 * $P), $yuk)), $bc)
    $ly += $yuk
  }

  $G.dugmeler = Dugmeler
  $degistir = $G.dugmeler[0]
  $etiketMetin = "Kurulum yeri"
  $eg = [System.Windows.Forms.TextRenderer]::MeasureText($etiketMetin, $YZ.guclu).Width
  $cz.DrawString($etiketMetin, $YZ.guclu, $B.etiket, (New-Object System.Drawing.RectangleF($P, $L.yer, $eg, $O.dugmeY)), $bicim)
  $yolX = $P + $eg + $O.b3
  $yolBicim = New-Object System.Drawing.StringFormat
  $yolBicim.Trimming = "EllipsisPath"
  $yolBicim.FormatFlags = "NoWrap"
  $yolBicim.LineAlignment = "Center"
  $cz.DrawString($S.hedef, $YZ.log, $B.metin, (New-Object System.Drawing.RectangleF($yolX, $L.yer, ($degistir.alan.X - $yolX - $O.b3), $O.dugmeY)), $yolBicim)

  foreach ($d in $G.dugmeler) {
    $a = $d.alan
    if ($d.birincil -and $d.etkin) {
      $cz.FillRectangle($B.renk1, $a)
      $df = $B.ustu1
    } else {
      if ($d.etkin) { $kr = $R.renk1; $df = $B.metin } else { $kr = $R.edilgen; $df = $B.edilgen }
      $cz.DrawRectangle((New-Object System.Drawing.Pen($kr, $O.cizgi)), $a.X, $a.Y, $a.Width - 1, $a.Height - 1)
    }
    $cz.DrawString($d.metin, $YZ.dugme, $df, (New-Object System.Drawing.RectangleF($a.X, $a.Y, $a.Width, $a.Height)), $orta)
  }
})

function Baslat {
  $S.log.Clear()
  $S.yuzde = 0
  $S.tavan = 2
  $S.hata = $null
  $S.durum = "calisiyor"
  $G.goster = 0.0
  if ($G.ps) { $G.ps.Dispose() }
  $G.ps = [powershell]::Create()
  $G.ps.Runspace = $G.rs
  [void]$G.ps.AddScript($is).AddArgument($S)
  [void]$G.ps.BeginInvoke()
}

function YerSec {
  $sec = New-Object System.Windows.Forms.FolderBrowserDialog
  $sec.Description = "Kurulum yeri: " + $S.ad + " bu klasörün içine kurulur."
  $sec.SelectedPath = Split-Path -Parent $S.hedef
  if ($sec.ShowDialog($f) -eq "OK") {
    if ((Split-Path -Leaf $sec.SelectedPath) -eq $S.ad) { $S.hedef = $sec.SelectedPath } else { $S.hedef = Join-Path $sec.SelectedPath $S.ad }
    if ($S.durum -eq "hata") { $S.durum = "hazir"; $S.log.Clear(); $S.yuzde = 0; $G.goster = 0.0; $S.adim = "Kurulum yeri değişti. Kur düğmesine bas." }
  }
}

function Eylem([string]$e) {
  switch ($e) {
    "kur" { Baslat }
    "yeniden" { Baslat }
    "onar" { $S.onar = $true; Baslat }
    "degistir" { YerSec }
    "kapat" { $f.Close() }
    "ac" { Start-Process $S.baslat; $f.Close() }
    "gunluk" { Start-Process notepad.exe $S.gunluk }
  }
}

function Vurulan($nokta) {
  foreach ($d in $G.dugmeler) { if ($d.alan -and $d.alan.Contains($nokta)) { return $d } }
  $null
}

$f.Add_MouseDown({
  if ($_.Button -ne "Left") { return }
  if (-not (Vurulan $_.Location)) { $G.surukle = $_.Location }
})
$f.Add_MouseMove({
  if ($G.surukle) { $f.Location = New-Object System.Drawing.Point(($f.Location.X + $_.X - $G.surukle.X), ($f.Location.Y + $_.Y - $G.surukle.Y)); return }
  $d = Vurulan $_.Location
  if ($d -and $d.etkin) { $f.Cursor = "Hand" } else { $f.Cursor = "Default" }
})
$f.Add_MouseUp({
  if ($G.surukle) { $G.surukle = $null; return }
  $d = Vurulan $_.Location
  if ($d -and $d.etkin) { Eylem $d.eylem }
})
$f.Add_KeyDown({
  if ($_.KeyCode -eq "Escape" -and $S.durum -ne "calisiyor") { $f.Close() }
  if ($_.KeyCode -eq "Return") {
    $d = $G.dugmeler | Where-Object { $_.birincil -and $_.etkin } | Select-Object -First 1
    if ($d) { Eylem $d.eylem }
  }
})
$f.Add_FormClosing({ if ($S.durum -eq "calisiyor") { $_.Cancel = $true } })

$zaman = New-Object System.Windows.Forms.Timer
$zaman.Interval = 16
$zaman.Add_Tick({
  $hy = [double]$S.yuzde
  if ($G.goster -lt $hy) { $G.goster = [math]::Min($hy, $G.goster + [math]::Max(0.2, ($hy - $G.goster) * 0.08)) }
  elseif ($S.durum -eq "calisiyor" -and $G.goster -lt ($S.tavan - 0.5)) { $G.goster += ($S.tavan - $G.goster) * 0.006 }
  $f.Invalidate()
})

$G.rs = [runspacefactory]::CreateRunspace()
$G.rs.ApartmentState = "STA"
$G.rs.Open()
$f.Add_Shown({ $zaman.Start(); if ($env:KUR_BASLA) { Baslat } })
[System.Windows.Forms.Application]::Run($f)
$zaman.Stop()
$G.rs.Close()
