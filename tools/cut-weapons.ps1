# Вырезает иконки оружия (art/icons/<id>.png) и спрайты для боя (art/fx/<name>.png) из листов с прозрачным фоном.
# Запуск: powershell -ExecutionPolicy Bypass -File tools/cut-weapons.ps1
# Файл сохранён в UTF-8 с BOM — так PowerShell 5.1 правильно читает русские имена файлов.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$icons = Join-Path $root 'art\icons'; $fx = Join-Path $root 'art\fx'
New-Item -ItemType Directory -Force $icons, $fx | Out-Null

# лист, область (x, y, w, h; 0 = весь лист), куда: icon/fx, имя, размер (макс. сторона)
$jobs = @(
  @('дрон, магическая стрела.png', @(960, 0, 814, 887), 'icon', 'bolt', 128, 90),
  @('дрон, магическая стрела.png', @(960, 0, 814, 887), 'fx', 'arrow', 110, 90),
  @('дрон, магическая стрела.png', @(0, 0, 950, 887), 'icon', 'drone', 128, 90),
  @('дрон, магическая стрела.png', @(0, 0, 950, 887), 'fx', 'drone', 96, 90),
  @('лунная коса.png', 0, 'icon', 'whip', 128),
  @('лунная коса.png', 0, 'fx', 'scythe', 200),
  @('кружащие сферы.png', 0, 'icon', 'orbit', 128),
  @('кружащие сферы.png', @(820, 165, 230, 230), 'fx', 'fire_orb', 64, 10, 'circle'),
  @('огненная бомба.png', 0, 'icon', 'bomb', 128),
  @('огненная бомба.png', 0, 'fx', 'bomb', 80),
  @('метеор.png', 0, 'icon', 'meteor', 128),
  @('метеор.png', 0, 'fx', 'meteor', 140),
  @('щиты-хранители.png', 0, 'icon', 'shield', 128),
  @('бумеранг.png', 0, 'icon', 'boomerang', 128),
  @('цепная молния.png', @(40, 150, 840, 700), 'icon', 'lightning', 128, 170)
)
$cache = @{}
foreach ($j in $jobs) {
  $f = Join-Path $root $j[0]
  $thr = if ($j.Count -gt 5) { $j[5] } else { 10 }   # Ð¿Ð¾ÑÐ¾Ð³ Ð¿ÑÐ¾Ð·ÑÐ°ÑÐ½Ð¾ÑÑÐ¸ (Ð²ÑÑÐµ â Ð¾ÑÑÐµÐ·Ð°ÐµÑ ÑÐµÑÑÑ Ð´ÑÐ¼ÐºÑ)
  $ck = "$f|$thr"
  if (-not $cache[$ck]) { if (-not $cache[$f]) { $cache[$f] = [Img]::Load($f) }; $cache[$ck] = [Cut]::AlphaMask($cache[$f], $thr) }
  $im = $cache[$f]; $m = $cache[$ck]
  $q = if ($j[1] -is [array]) { $j[1] } else { @(0, 0, $im.W, $im.H) }
  if ($j.Count -gt 6 -and $j[6] -eq 'circle') { $e = [Cut]::CircleCrop($im.Crop($q[0], $q[1], $q[2], $q[3]), 0.98) }
  else { $e = [Cut]::ExtractMain($im, $m, $q[0], $q[1], $q[2], $q[3], 12) }
  $k = [Math]::Min(1.0, $j[4] / [Math]::Max($e.W, $e.H))
  $e = [Cut]::Downscale($e, [int]($e.W * $k), [int]($e.H * $k))
  $dir = if ($j[2] -eq 'icon') { $icons } else { $fx }
  $e.Save((Join-Path $dir ($j[3] + '.png')))
  "$($j[2]) $($j[3]): $($e.W)x$($e.H)"
}
