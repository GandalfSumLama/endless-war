# Обложка и иконка игры: promo/cover.png (1280×720), promo/cover_640x360.png (для @BotFather), promo/icon.png (512×512)
# 1) герои в полном разрешении из концепт-листов в корне (те же рамки, что в tools/cut-hero.ps1) -> promo/_work/<id>.png
# 2) композиция рисуется страницей tools/promo.html (арт игры, шрифт логотипа) и снимается безголовым Edge
# Нужен локальный сервер: powershell -ExecutionPolicy Bypass -File serve.ps1 (порт 8080)
# Run: powershell -ExecutionPolicy Bypass -File tools/make-promo.ps1
param([switch]$CutOnly)   # -CutOnly: только вырезать героев
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$work = "$root\promo\_work"; New-Item -ItemType Directory -Force $work | Out-Null
$heroes = @{   # лист, рамка большой фигуры (x, y, w, h), участки, которые не трогать
  wanderer = @('*main hero 1*.png', @(16, 17, 377, 658), @())
  scavenger = @('*main hero 2*.png', @(2, 10, 547, 984), @(, @(352, 790, 200, 210)))
  hunter = @('*main hero 3*.png', @(3, 2, 437, 1250), @())
  guardian = @('*main hero 4*.png', @(436, 6, 235, 397), @())
  minotaur = @('*боссы арт*.png', @(110, 500, 560, 524), @())   # боссы — фоном за героями
  voideye = @('*боссы арт*.png', @(50, 0, 720, 505), @())
}
foreach ($id in $heroes.Keys) {
  $h = $heroes[$id]; $im = [Img]::Load((Get-ChildItem $root -Filter $h[0])[0].FullName); $m = [Cut]::AlphaMask($im, 40)
  foreach ($z in $h[2]) { for ($y = $z[1]; $y -lt $z[1] + $z[3]; $y++) { for ($x = $z[0]; $x -lt $z[0] + $z[2]; $x++) { $m[$y * $im.W + $x] = $true } } }
  $b = $h[1]; $fig = [Cut]::ExtractMain($im, $m, $b[0], $b[1], $b[2], $b[3], 6)
  $k = [Math]::Min(1.0, 700.0 / $fig.H); if ($k -lt 1) { $fig = [Cut]::Downscale($fig, [int]($fig.W * $k), [int]($fig.H * $k)) }
  $fig.Save("$work\$id.png"); "$id $($fig.W)x$($fig.H)"
}
if ($CutOnly) { return }

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
foreach ($s in @(@('cover', 1280, 720), @('icon', 512, 512))) {
  $out = "$root\promo\$($s[0]).png"; if (Test-Path $out) { Remove-Item $out }
  $a = @('--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1', "--user-data-dir=`"$env:TEMP\ewpromo`"",
    "--window-size=$($s[1]),$($s[2])", '--virtual-time-budget=15000', "--screenshot=`"$out`"", "http://localhost:8080/tools/promo.html#$($s[0])")
  Start-Process $edge -ArgumentList $a -WindowStyle Hidden | Out-Null   # через Start-Process служебный вывод Edge в stderr не ломает скрипт
  for ($i = 0; $i -lt 120 -and -not ((Test-Path $out) -and (Get-Item $out).Length -gt 0); $i++) { Start-Sleep -Milliseconds 250 }
  Start-Sleep -Milliseconds 500
  # фоновые процессы безголового Edge сами не завершаются — закрываем только запущенные с нашим профилем
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*ewpromo*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  "$($s[0]): $(Test-Path $out)"
}
# уменьшенная обложка 640×360 для @BotFather
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("$root\promo\cover.png"); $dst = New-Object System.Drawing.Bitmap 640, 360
$g = [System.Drawing.Graphics]::FromImage($dst); $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($src, 0, 0, 640, 360); $g.Dispose()
$dst.Save("$root\promo\cover_640x360.png", [System.Drawing.Imaging.ImageFormat]::Png); $dst.Dispose(); $src.Dispose(); "cover_640x360: ok"
