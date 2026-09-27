    Adim 92 98 "Kısayollar oluşturuluyor"
    $calistir = Join-Path $hedef $S.exe
    $S.baslat = $calistir
    if ($S.prova) { Yaz "Prova: kısayol yazılmadı" }
    else {
      $kabuk = New-Object -ComObject WScript.Shell
      foreach ($klasor in @($S.masaustu, $S.menu)) {
        New-Item -ItemType Directory -Force $klasor | Out-Null
        $kisayol = Join-Path $klasor ($S.ad + ".lnk")
        $lnk = $kabuk.CreateShortcut($kisayol)
        $lnk.TargetPath = $calistir
        $lnk.WorkingDirectory = $hedef
        $lnk.IconLocation = $calistir + ",0"
        $lnk.Save()
        Yaz "Kısayol: $kisayol"
      }
      $S.kisayol = Join-Path $S.masaustu ($S.ad + ".lnk")
    }
