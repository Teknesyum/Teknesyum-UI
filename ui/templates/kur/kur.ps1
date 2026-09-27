# teknesyum-ui template kur/kur.ps1 · düzen 2
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
try { Add-Type -Namespace Kur -Name Dwm -MemberDefinition '[DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr h, int a, ref int v, int s);' } catch {}

function Renk([string]$h, [double]$a = 1) { [System.Drawing.Color]::FromArgb([int][math]::Round(255 * $a), [System.Drawing.ColorTranslator]::FromHtml($h)) }
function Alfa($c, [double]$a) { [System.Drawing.Color]::FromArgb([int][math]::Round(255 * $a), $c) }
function Karistir($a, $b, [double]$p) { [System.Drawing.Color]::FromArgb([int]($a.R * $p + $b.R * (1 - $p)), [int]($a.G * $p + $b.G * (1 - $p)), [int]($a.B * $p + $b.B * (1 - $p))) }
function Aile([string]$zincir) {
  $kurulu = @((New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name })
  $parca = $zincir.Split(",") | ForEach-Object { $_.Trim() }
  foreach ($a in $parca) { if ($kurulu -contains $a) { return $a } }
  $parca[-1]
}
function Yazi([double]$px, [string]$stil, [string]$aile) { New-Object System.Drawing.Font($aile, [single]$px, [System.Drawing.FontStyle]$stil, [System.Drawing.GraphicsUnit]::Pixel) }
function Oval($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = [math]::Min(2 * $r, [math]::Min($w, $h))
  if ($d -lt 1) { $p.AddRectangle((New-Object System.Drawing.RectangleF($x, $y, $w, $h))); return ,$p }
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc(($x + $w - $d), $y, $d, $d, 270, 90)
  $p.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90)
  $p.AddArc($x, ($y + $h - $d), $d, $d, 90, 90)
  $p.CloseFigure()
  ,$p
}

$R = @{
  zemin = Renk "{{RENK_ZEMIN}}"; metin = Renk "{{RENK_METIN}}"; etiket = Renk "{{RENK_ETIKET}}"
  renk1 = Renk "{{RENK_1}}"; renk2 = Renk "{{RENK_2}}"; renk3 = Renk "{{RENK_3}}"; vurgu = Renk "{{RENK_VURGU}}"
  basari = Renk "{{RENK_BASARI}}"; tehlike = Renk "{{RENK_TEHLIKE}}"; edilgen = Renk "{{RENK_EDILGEN}}"
  ustuTehlike = Renk "{{RENK_USTU_TEHLIKE}}"; marka = Renk "{{RENK_MARKA}}"; iz = Renk "{{RENK_IZ}}" {{IZ_ALFA}}
}
$R.bekleyen = Karistir $R.edilgen $R.metin 0.7
$TON = @{ t10 = {{TON_10}}; t20 = {{TON_20}}; t30 = {{TON_30}}; t50 = {{TON_50}}; t60 = {{TON_60}} }
$pencereKenari = "{{PENCERE_KENARI}}"
$O = @{
  fs1 = {{FS_1}}; fs3 = {{FS_3}}; govdeSatir = {{SATIR_GOVDE}}; satir = {{SATIR_MONO}}
  b1 = {{BOSLUK_1}}; b2 = {{BOSLUK_2}}; b3 = {{BOSLUK_3}}; b4 = {{BOSLUK_4}}; b5 = {{BOSLUK_5}}
  cubuk = {{CUBUK_H}}; kontrol = {{KONTROL_W}}; glif = {{IKON_1}}; isaret = {{IKON_3}}
  dugmeY = {{HEDEF_MIN}}; dugmePx = {{DUGME_PX}}; kose = {{KOSE}}; cizgi = {{KENAR_W}}
  genislik = {{PENCERE_W}}; yukseklik = {{PENCERE_H}}
}
$MARKA = "{{MARKA}}"
$MARKA_ADRES = "{{MARKA_ADRES}}"
$sans = Aile "{{YAZI_SANS}}"
$mono = Aile "{{YAZI_MONO}}"
$YZ = @{
  baslik = Yazi $O.fs3 "Bold" $sans; govde = Yazi $O.fs1 "Regular" $sans; guclu = Yazi $O.fs1 "Bold" $sans
  log = Yazi $O.fs1 "Regular" $mono; bag = Yazi $O.fs1 "Underline" $sans
}
$G = @{ goster = 0.0; surukle = $null; alanlar = @(); uzerinde = ""; ps = $null; rs = $null; yuvarlak = $false }

$L = @{ durum = $O.cubuk + $O.b4 }
$L.adimlar = $L.durum + $O.govdeSatir + $O.b3
$L.ilerleme = $L.adimlar + $S.adimlar.Count * ($O.isaret + $O.b1) - $O.b1 + $O.b3
$L.alt = $O.yukseklik - $O.b4 - $O.dugmeY

$f = New-Object System.Windows.Forms.Form
$f.Text = $S.ad + " Kurulum"
$f.FormBorderStyle = "None"
$f.StartPosition = "CenterScreen"
$f.ClientSize = New-Object System.Drawing.Size($O.genislik, $O.yukseklik)
$f.BackColor = $R.zemin
$f.ForeColor = $R.metin
$f.KeyPreview = $true
$f.GetType().GetProperty("DoubleBuffered", [Reflection.BindingFlags]"Instance,NonPublic").SetValue($f, $true, $null)
$simgeYol = Join-Path $kaynak "{{SIMGE}}"
if (Test-Path $simgeYol) { $f.Icon = New-Object System.Drawing.Icon($simgeYol) }

function SuAnkiAdim {
  $i = 0
  for ($k = 0; $k -lt $S.adimlar.Count; $k++) { if ($S.yuzde -ge $S.adimlar[$k][1]) { $i = $k } }
  $i
}

function Alan([string]$eylem, [string]$tur, [string]$metin, [bool]$birincil, [bool]$etkin, $alan) { @{ eylem = $eylem; tur = $tur; metin = $metin; birincil = $birincil; etkin = $etkin; alan = $alan } }

function DurumCumlesi {
  switch ($S.durum) {
    "hazir" { "Program bu bilgisayara kurulacak." }
    "calisiyor" { "Kuruluyor, pencereyi kapatmayın." }
    "bitti" { if ($S.prova) { "Prova bitti, bilgisayarda hiçbir şey değişmedi." } else { "Hazır. Masaüstündeki " + $S.ad + " kısayolundan da açabilirsiniz." } }
    default { "Kurulum yarıda kaldı. İnterneti kontrol edip yeniden deneyin." }
  }
}

function Alanlar {
  $w = $f.ClientSize.Width
  $olc = [System.Windows.Forms.TextRenderer]
  $liste = @()
  $calisiyor = $S.durum -eq "calisiyor"
  $liste += Alan "kapat" "kontrol" "" $false (-not $calisiyor) (New-Object System.Drawing.Rectangle(($w - $O.kontrol), 0, $O.kontrol, $O.cubuk))
  $liste += Alan "kucult" "kontrol" "" $false $true (New-Object System.Drawing.Rectangle(($w - 2 * $O.kontrol), 0, $O.kontrol, $O.cubuk))
  if ($MARKA) {
    $mg = $olc::MeasureText($MARKA, $YZ.guclu).Width + 2 * $O.b2
    $liste += Alan "marka" "marka" $MARKA $false $true (New-Object System.Drawing.Rectangle(($w - 2 * $O.kontrol - $O.b3 - $mg), 0, $mg, $O.cubuk))
  }
  $alt = @(switch ($S.durum) {
    "hazir" { @((Alan "kur" "dugme" "Kur" $true $true $null)) }
    "calisiyor" { @((Alan "yok" "dugme" "Kuruluyor" $false $false $null)) }
    "bitti" {
      $d = @()
      if ($onarVar) { $d += Alan "onar" "dugme" "Onar" $false $true $null }
      if ($S.prova -or -not $S.baslat) { $d += Alan "kapat" "dugme" "Kapat" $true $true $null }
      else { $d += Alan "kapat" "dugme" "Kapat" $false $true $null; $d += Alan "ac" "dugme" "Programı aç" $true $true $null }
      $d
    }
    default { @((Alan "gunluk" "dugme" "Günlüğü aç" $false $true $null), (Alan "yeniden" "dugme" "Yeniden dene" $true $true $null)) }
  })
  $x = $w - $O.b5
  for ($i = $alt.Count - 1; $i -ge 0; $i--) {
    $gen = $olc::MeasureText($alt[$i].metin, $YZ.govde).Width + 2 * $O.dugmePx
    $x -= $gen
    $alt[$i].alan = New-Object System.Drawing.Rectangle($x, $L.alt, $gen, $O.dugmeY)
    $x -= $O.b2
  }
  if ($S.durum -eq "hazir" -or $S.durum -eq "hata") {
    $gen = $olc::MeasureText("Değiştir", $YZ.bag).Width
    $x = $x + $O.b2 - $O.b3 - $gen
    $liste += Alan "degistir" "bag" "Değiştir" $false $true (New-Object System.Drawing.Rectangle($x, $L.alt, $gen, $O.dugmeY))
  }
  $liste + $alt
}

$f.Add_Paint({
  $cz = $_.Graphics
  $cz.SmoothingMode = "AntiAlias"
  $cz.TextRenderingHint = "ClearTypeGridFit"
  $w = $f.ClientSize.Width
  $h = $f.ClientSize.Height
  $P = $O.b5
  $ic = $w - 2 * $P
  $bicim = New-Object System.Drawing.StringFormat
  $bicim.Trimming = "EllipsisCharacter"
  $bicim.FormatFlags = "NoWrap"
  $bicim.LineAlignment = "Center"
  $orta = New-Object System.Drawing.StringFormat
  $orta.Alignment = "Center"
  $orta.LineAlignment = "Center"
  $firca = { param($c) New-Object System.Drawing.SolidBrush $c }
  if ($pencereKenari -and -not $G.yuvarlak) { $cz.DrawRectangle((New-Object System.Drawing.Pen((Renk $pencereKenari {{PENCERE_ALFA}}), $O.cizgi)), 0, 0, $w - 1, $h - 1) }

  $G.alanlar = Alanlar
  $ad = $S.ad + " "
  $ag = [System.Windows.Forms.TextRenderer]::MeasureText($ad, $YZ.baslik, [System.Drawing.Size]::Empty, [System.Windows.Forms.TextFormatFlags]::NoPadding).Width
  $cz.DrawString($ad, $YZ.baslik, (& $firca $R.metin), (New-Object System.Drawing.RectangleF($O.b4, 0, $ag, $O.cubuk)), $bicim)
  $cz.DrawString("Kurulum", $YZ.baslik, (& $firca $R.vurgu), (New-Object System.Drawing.RectangleF(($O.b4 + $ag), 0, ($w / 2), $O.cubuk)), $bicim)

  foreach ($a in $G.alanlar) {
    $ka = $a.alan
    $ustte = $G.uzerinde -eq ($a.eylem + $a.tur)
    switch ($a.tur) {
      "kontrol" {
        $gc = $R.metin
        if ($ustte -and $a.etkin) {
          if ($a.eylem -eq "kapat") { $cz.FillRectangle((& $firca $R.tehlike), $ka); $gc = $R.ustuTehlike }
          else { $cz.FillRectangle((& $firca (Alfa $R.renk3 $TON.t30)), $ka) }
        }
        if (-not $a.etkin) { $gc = $R.edilgen }
        $kalem = New-Object System.Drawing.Pen($gc, $O.cizgi)
        $cx = $ka.X + ($ka.Width - $O.glif) / 2
        $cy = $ka.Y + ($ka.Height - $O.glif) / 2
        if ($a.eylem -eq "kapat") { $cz.DrawLine($kalem, $cx, $cy, ($cx + $O.glif), ($cy + $O.glif)); $cz.DrawLine($kalem, ($cx + $O.glif), $cy, $cx, ($cy + $O.glif)) }
        else { $cz.DrawLine($kalem, $cx, ($cy + $O.glif / 2), ($cx + $O.glif), ($cy + $O.glif / 2)) }
      }
      "marka" {
        if ($ustte) { $mf = $R.metin } else { $mf = $R.marka }
        $cz.DrawString($a.metin, $YZ.guclu, (& $firca $mf), (New-Object System.Drawing.RectangleF($ka.X, $ka.Y, $ka.Width, $ka.Height)), $orta)
      }
      "bag" {
        if ($ustte) { $bf = $R.renk1 } else { $bf = $R.etiket }
        $cz.DrawString($a.metin, $YZ.bag, (& $firca $bf), (New-Object System.Drawing.RectangleF($ka.X, $ka.Y, ($ka.Width + $O.b1), $ka.Height)), $bicim)
      }
      "dugme" {
        $yol = Oval $ka.X $ka.Y ($ka.Width - 1) ($ka.Height - 1) $O.kose
        if ($a.etkin) {
          if ($a.birincil) {
            if ($ustte) { $dol = $TON.t20; $ken = $TON.t50 } else { $dol = $TON.t10; $ken = $TON.t30 }
            $cz.FillPath((& $firca (Alfa $R.renk1 $dol)), $yol)
            $cz.DrawPath((New-Object System.Drawing.Pen((Alfa $R.renk1 $ken), $O.cizgi)), $yol)
          } elseif ($ustte) { $cz.FillPath((& $firca (Alfa $R.renk1 $TON.t10)), $yol) }
          $df = $R.metin
        } else { $df = $R.edilgen }
        $cz.DrawString($a.metin, $YZ.govde, (& $firca $df), (New-Object System.Drawing.RectangleF($ka.X, $ka.Y, $ka.Width, $ka.Height)), $orta)
      }
    }
  }

  $cz.DrawString((DurumCumlesi), $YZ.govde, (& $firca $R.etiket), (New-Object System.Drawing.RectangleF($P, $L.durum, $ic, $O.govdeSatir)), $bicim)

  $suan = SuAnkiAdim
  $ay = $L.adimlar
  $adX = $P + $O.isaret + $O.b3
  for ($i = 0; $i -lt $S.adimlar.Count; $i++) {
    if ($S.durum -eq "bitti" -or ($S.durum -ne "hazir" -and $i -lt $suan)) { $tur = "bitti" }
    elseif ($S.durum -eq "hata" -and $i -eq $suan) { $tur = "hata" }
    elseif ($S.durum -eq "calisiyor" -and $i -eq $suan) { $tur = "suren" }
    else { $tur = "" }
    $kutu = New-Object System.Drawing.RectangleF($P, $ay, ($O.isaret - 1), ($O.isaret - 1))
    switch ($tur) {
      "bitti" { $kc = $R.basari; $ac = $R.metin; $isaret = [string][char]0x2713; $ay2 = $YZ.guclu }
      "hata" { $kc = $R.tehlike; $ac = $R.tehlike; $isaret = "!"; $ay2 = $YZ.guclu }
      "suren" { $kc = $R.renk1; $ac = $R.renk1; $isaret = [string]($i + 1); $ay2 = $YZ.guclu; $cz.FillEllipse((& $firca (Alfa $R.renk1 $TON.t20)), $kutu) }
      default { $kc = $R.bekleyen; $ac = $R.bekleyen; $isaret = [string]($i + 1); $ay2 = $YZ.govde }
    }
    $cz.DrawEllipse((New-Object System.Drawing.Pen($kc, $O.cizgi)), $kutu)
    $cz.DrawString($isaret, $YZ.govde, (& $firca $kc), $kutu, $orta)
    $cz.DrawString($S.adimlar[$i][0], $ay2, (& $firca $ac), (New-Object System.Drawing.RectangleF($adX, $ay, ($w - $adX - $P), $O.isaret)), $bicim)
    $ay += $O.isaret + $O.b1
  }

  $logUst = $L.ilerleme
  if ($S.durum -ne "hazir") {
    $yuzdeMetin = [string][math]::Floor($G.goster) + "%"
    $yg = [System.Windows.Forms.TextRenderer]::MeasureText("100%", $YZ.log).Width
    $sag = New-Object System.Drawing.StringFormat
    $sag.Alignment = "Far"
    $sag.LineAlignment = "Center"
    $cz.DrawString($yuzdeMetin, $YZ.log, (& $firca $R.metin), (New-Object System.Drawing.RectangleF(($w - $P - $yg), $L.ilerleme, $yg, $O.govdeSatir)), $sag)
    $bx = $P; $bw = $ic - $yg - $O.b3; $bh = $O.b1; $by = $L.ilerleme + [int](($O.govdeSatir - $bh) / 2)
    $cz.FillPath((& $firca $R.iz), (Oval $bx $by $bw $bh ($bh / 2)))
    $dolu = [int]($bw * [math]::Min(100, $G.goster) / 100)
    if ($dolu -gt $bh) {
      if ($S.durum -eq "hata") { $fr = & $firca $R.tehlike }
      else {
        $fr = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Rectangle($bx, $by, $bw, $bh)), $R.renk1, $R.renk2, 0.0)
        $karisim = New-Object System.Drawing.Drawing2D.ColorBlend(3)
        $karisim.Colors = @($R.renk1, $R.renk3, $R.renk2)
        $karisim.Positions = @([single]0, [single]0.5, [single]1)
        $fr.InterpolationColors = $karisim
      }
      $cz.FillPath($fr, (Oval $bx $by $dolu $bh ($bh / 2)))
    }
    $logUst = $L.ilerleme + $O.govdeSatir + $O.b3
  }

  $logAlt = $L.alt - $O.b3
  if ($S.durum -eq "hata" -and $S.hata) {
    $hy = 2 * $O.govdeSatir
    $sar = New-Object System.Drawing.StringFormat
    $sar.Trimming = "EllipsisWord"
    $cz.DrawString($S.hata, $YZ.govde, (& $firca $R.tehlike), (New-Object System.Drawing.RectangleF($P, ($logAlt - $hy), $ic, $hy)), $sar)
    $logAlt -= $hy + $O.b3
  }
  $satirlar = @($S.log.ToArray() | Where-Object { -not ($S.hata -and $_.EndsWith([string]$S.hata)) })
  $sigan = [math]::Max(0, [math]::Floor(($logAlt - $logUst) / $O.satir))
  $n = $satirlar.Count
  $bas = [math]::Max(0, $n - $sigan)
  $gorunen = $n - $bas
  $ly = $logAlt - $gorunen * $O.satir
  for ($i = $bas; $i -lt $n; $i++) {
    $sira = $i - $bas
    if ($i -eq $n - 1) { $lr = $R.metin } else { $lr = $R.etiket }
    if ($gorunen -eq $sigan -and $sira -eq 0) { $lr = Alfa $lr $TON.t30 }
    elseif ($gorunen -eq $sigan -and $sira -eq 1) { $lr = Alfa $lr $TON.t60 }
    $cz.DrawString($satirlar[$i], $YZ.log, (& $firca $lr), (New-Object System.Drawing.RectangleF($P, $ly, $ic, $O.satir)), $bicim)
    $ly += $O.satir
  }

  $yolSag = ($G.alanlar | Where-Object { $_.tur -eq "bag" -or $_.tur -eq "dugme" } | ForEach-Object { $_.alan.X } | Measure-Object -Minimum).Minimum
  $yolBicim = New-Object System.Drawing.StringFormat
  $yolBicim.Trimming = "EllipsisPath"
  $yolBicim.FormatFlags = "NoWrap"
  $yolBicim.LineAlignment = "Center"
  $cz.DrawString($S.hedef, $YZ.govde, (& $firca $R.metin), (New-Object System.Drawing.RectangleF($P, $L.alt, ($yolSag - $P - $O.b3), $O.dugmeY)), $yolBicim)
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
  $sec.Description = $S.ad + " bu klasörün içine kurulur."
  $sec.SelectedPath = Split-Path -Parent $S.hedef
  if ($sec.ShowDialog($f) -eq "OK") {
    if ((Split-Path -Leaf $sec.SelectedPath) -eq $S.ad) { $S.hedef = $sec.SelectedPath } else { $S.hedef = Join-Path $sec.SelectedPath $S.ad }
    if ($S.durum -eq "hata") { $S.durum = "hazir"; $S.log.Clear(); $S.yuzde = 0; $G.goster = 0.0 }
  }
}

function Eylem([string]$e) {
  switch ($e) {
    "kur" { Baslat }
    "yeniden" { Baslat }
    "onar" { $S.onar = $true; Baslat }
    "degistir" { YerSec }
    "kapat" { $f.Close() }
    "kucult" { $f.WindowState = "Minimized" }
    "marka" { if ($MARKA_ADRES) { Start-Process $MARKA_ADRES } }
    "ac" { Start-Process $S.baslat; $f.Close() }
    "gunluk" { Start-Process notepad.exe $S.gunluk }
  }
}

function Vurulan($nokta) {
  foreach ($d in $G.alanlar) { if ($d.alan -and $d.alan.Contains($nokta)) { return $d } }
  $null
}

$f.Add_MouseDown({
  if ($_.Button -ne "Left") { return }
  if (-not (Vurulan $_.Location)) { $G.surukle = $_.Location }
})
$f.Add_MouseMove({
  if ($G.surukle) { $f.Location = New-Object System.Drawing.Point(($f.Location.X + $_.X - $G.surukle.X), ($f.Location.Y + $_.Y - $G.surukle.Y)); return }
  $d = Vurulan $_.Location
  if ($d) { $G.uzerinde = $d.eylem + $d.tur } else { $G.uzerinde = "" }
  if ($d -and $d.etkin) { $f.Cursor = "Hand" } else { $f.Cursor = "Default" }
})
$f.Add_MouseLeave({ $G.uzerinde = "" })
$f.Add_MouseUp({
  if ($G.surukle) { $G.surukle = $null; return }
  $d = Vurulan $_.Location
  if ($d -and $d.etkin) { Eylem $d.eylem }
})
$f.Add_KeyDown({
  if ($_.KeyCode -eq "Escape" -and $S.durum -ne "calisiyor") { $f.Close() }
  if ($_.KeyCode -eq "Return") {
    $d = $G.alanlar | Where-Object { $_.birincil -and $_.etkin } | Select-Object -First 1
    if ($d) { Eylem $d.eylem }
  }
})
$f.Add_FormClosing({ if ($S.durum -eq "calisiyor") { $_.Cancel = $true } })
$f.Add_HandleCreated({
  try {
    $v = 2
    $G.yuvarlak = [Kur.Dwm]::DwmSetWindowAttribute($f.Handle, 33, [ref]$v, 4) -eq 0
    if ($G.yuvarlak) {
      if ($pencereKenari) { $c = Renk $pencereKenari; $v = $c.R -bor ($c.G -shl 8) -bor ($c.B -shl 16) } else { $v = -2 }
      [void][Kur.Dwm]::DwmSetWindowAttribute($f.Handle, 34, [ref]$v, 4)
    }
  } catch { $G.yuvarlak = $false }
})

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
