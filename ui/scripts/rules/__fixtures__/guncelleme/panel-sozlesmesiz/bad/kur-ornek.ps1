$S = [hashtable]::Synchronized(@{ yuzde = 0 })
$S.yuzde = 40
$zaman = New-Object System.Windows.Forms.Timer
$zaman.Interval = 250
