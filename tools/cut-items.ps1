# Вырезает иконки предметов из листа «предметы.png» (сетка 4×4 карточек на тёмном фоне) в art/icons/<id>.png.
# Фон карточки убирается заливкой от краёв области; замки на закрытых предметах закрашиваются.
# Запуск: powershell -ExecutionPolicy Bypass -File tools/cut-items.ps1   (файл в UTF-8 с BOM)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$out = Join-Path $root 'art\icons'
New-Item -ItemType Directory -Force $out | Out-Null
$im = [Img]::Load((Join-Path $root 'предметы.png'))

$cols = @(72, 412, 755, 1099); $rows = @(118, 355, 590, 825); $cw = 277; $ch = 158   # область картинки внутри карточки (без подписи)
$ids = @('power', 'tome', 'candle', 'bracer', 'duration', 'amount', 'heart', 'armor', 'boots', 'magnet', 'clover', 'regen', 'crown', 'greed', 'ward')
$locks = @{ amount = 1; greed = 1 }   # на этих карточках нарисован замок (справа внизу)
for ($i = 0; $i -lt $ids.Count; $i++) {
  $x = $cols[$i % 4]; $y = $rows[[Math]::Floor($i / 4)]
  $c = $im.Crop($x, $y, $cw, $ch)
  $s = ((4 * $c.W) + 4) * 4                         # цвет фона карточки — у левого верхнего угла области
  $m = [Cut]::BgMask($c, 34, $c.P[$s + 2], $c.P[$s + 1], $c.P[$s])
  if ($locks[$ids[$i]]) { for ($yy = 95; $yy -lt $ch; $yy++) { for ($xx = 222; $xx -lt $cw; $xx++) { $m[$yy * $cw + $xx] = $true } } }
  [Cut]::ApplyAlpha($c, $m, 34, $c.P[$s + 2], $c.P[$s + 1], $c.P[$s])
  $e = [Cut]::ExtractMain($c, $m, 0, 0, $cw, $ch, 6)
  $k = [Math]::Min(1.0, 128.0 / [Math]::Max($e.W, $e.H))
  $e = [Cut]::Downscale($e, [int]($e.W * $k), [int]($e.H * $k))
  $e.Save((Join-Path $out ($ids[$i] + '.png')))
  "$($ids[$i]): $($e.W)x$($e.H)"
}
