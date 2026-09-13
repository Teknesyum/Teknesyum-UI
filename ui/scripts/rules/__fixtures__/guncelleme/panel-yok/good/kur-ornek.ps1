$S = [hashtable]::Synchronized(@{ yuzde = 0; tavan = 2; adim = "Hazırlanıyor" })
function Adim([int]$y, [int]$t, [string]$m) { $S.yuzde = $y; $S.tavan = $t; $S.adim = $m }
Adim 2 6 "Git hazırlanıyor"
$zaman = New-Object System.Windows.Forms.Timer
$zaman.Interval = 16
