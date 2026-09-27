$hedefVarsayilan = $kaynak
$adimAdlari = @({{YEREL_ADIMLAR}})
$onarVar = $false
$yerSecVar = $false
#-- is
    $hedef = $S.kaynak
    $S.hedef = $hedef
    Yaz "Kaynak: bu klasördeki dosyalar"
    Yaz "Hedef : $hedef"

    Adim 0 6 "Dosyalar denetleniyor"
    if ($S.exe -and -not (Test-Path (Join-Path $hedef $S.exe))) { throw ("Kurulum klasöründe " + $S.exe + " yok; paket eksik açılmış. Programı yeniden indirin.") }
    try {
      $dene = Join-Path $hedef (".yazma-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
      [IO.File]::WriteAllText($dene, "")
      Remove-Item -LiteralPath $dene -Force
    } catch { throw "Bu klasöre yazılamıyor: $hedef. Programı kullanıcı klasörünüze yeniden kurun; yönetici yetkisi gerekmez." }
    Yaz "Dosyalar yerinde: $hedef"
