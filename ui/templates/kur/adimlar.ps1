    Adim 76 92 "Program motoru hazırlanıyor"
    if (Test-Path (Join-Path $hedef "package.json")) {
      if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw "Node.js kurulu değil; program motoru kurulamadı" }
      Push-Location $hedef
      & npm.cmd install --no-audit --no-fund 2>&1 | ForEach-Object { Yaz "$_" }
      $npmKod = $LASTEXITCODE
      Pop-Location
      if ($npmKod -ne 0) { throw "npm install başarısız (çıkış $npmKod)" }
      Yaz "Program motoru hazır"
    } else { Yaz "package.json yok, motor adımı atlandı" }

    Adim 92 97 "Masaüstü kısayolu yazılıyor"
    $kisayol = Join-Path ([Environment]::GetFolderPath("Desktop")) ($S.ad + ".lnk")
    $calistir = Join-Path $hedef "node_modules\electron\dist\electron.exe"
    if ($S.prova) { Yaz "Prova: kısayol yazılmadı" }
    elseif (Test-Path $calistir) {
      $lnk = (New-Object -ComObject WScript.Shell).CreateShortcut($kisayol)
      $lnk.TargetPath = $calistir
      $lnk.Arguments = '"' + $hedef + '"'
      $lnk.WorkingDirectory = $hedef
      $ikonYol = Join-Path $hedef "{{SIMGE}}"
      if (Test-Path $ikonYol) { $lnk.IconLocation = $ikonYol }
      $lnk.Save()
      $S.baslat = $kisayol
      Yaz "Kısayol: $kisayol"
    } else { Yaz "Çalıştırılacak dosya bulunamadı, kısayol yazılmadı" }
