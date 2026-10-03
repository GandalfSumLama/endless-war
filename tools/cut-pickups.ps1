# Pickups (gems, coins, heart, magnet, chests) and enemy projectiles / ward circle -> art/fx
# Sources: pickups.webp, projectiles.webp (transparent WebP; WIC gives alpha in the 4th byte)
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-pickups.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
Add-Type -AssemblyName PresentationCore
$fx = Join-Path $root 'art\fx'
function LoadWebp($name) {
  $s = [IO.File]::OpenRead((Join-Path $root "$name.webp"))
  $f = [Windows.Media.Imaging.BitmapDecoder]::Create($s, [Windows.Media.Imaging.BitmapCreateOptions]::None, [Windows.Media.Imaging.BitmapCacheOption]::OnLoad).Frames[0]
  $im = New-Object Img; $im.W = $f.PixelWidth; $im.H = $f.PixelHeight; $im.P = New-Object byte[] ($im.W * $im.H * 4)
  $f.CopyPixels($im.P, $im.W * 4, 0); $s.Close(); return $im
}
function Save($im, $x, $y, $w, $h, $size, $name) {
  $c = [Cut]::TrimSquare($im.Crop($x, $y, $w, $h), 8, 2)
  if ($c.W -gt $size) { $c = [Cut]::Downscale($c, $size, $size) }
  $c.Save((Join-Path $fx "$name.png")); "$name $($c.W)"
}
function SaveRect($im, $x, $y, $w, $h, $maxW, $name) {   # keeps aspect (arrows, coin frames)
  $k = [Math]::Min(1.0, $maxW / [double]$w)
  $c = [Cut]::Downscale($im.Crop($x, $y, $w, $h), [int]($w * $k), [int]($h * $k))
  $c.Save((Join-Path $fx "$name.png")); "$name $($c.W)x$($c.H)"
}
$a = LoadWebp 'pickups'; $p = 8
Save $a (67-$p) (159-$p) (146+2*$p) (161+2*$p) 48 'gem_blue'
Save $a (238-$p) (161-$p) (145+2*$p) (157+2*$p) 48 'gem_gold'
Save $a (406-$p) (161-$p) (142+2*$p) (156+2*$p) 48 'gem_red'
Save $a (218-$p) (489-$p) (199+2*$p) (180+2*$p) 56 'heart'
Save $a (593-$p) (464-$p) (197+2*$p) (211+2*$p) 56 'magnet'
Save $a (1026-$p) (477-$p) (246+2*$p) (212+2*$p) 96 'chest'
Save $a (1479-$p) (465-$p) (268+2*$p) (230+2*$p) 104 'chest_rare'
# coin spin frames: same height, centered in equal cells (front, 3/4, edge)
foreach ($c in @(@('coin', 830, 1043, 1227), @('green', 1412, 1620, 1802))) {
  $cell = 176; $sheet = New-Object Img; $sheet.W = $cell * 3; $sheet.H = $cell; $sheet.P = New-Object byte[] ($sheet.W * $sheet.H * 4)
  for ($i = 0; $i -lt 3; $i++) { $x0 = $c[1 + $i]; $w = @(161, 120, 66)[$i]; $piece = $a.Crop($x0 - 2, 156, $w + 6, 176); [Cut]::Paste($sheet, $piece, $i * $cell + [int](($cell - $piece.W) / 2), 0) }
  $o = [Cut]::Downscale($sheet, 144, 48); $o.Save((Join-Path $fx ($c[0] + '_spin.png'))); "$($c[0])_spin 144x48"
}
$b = [Cut]::AlphaFloor((LoadWebp 'projectiles'), 115); $q = 14
Save $b (157-$q) (119-$q) (152+2*$q) (182+2*$q) 96 'web'
Save $b (483-$q) (162-$q) (152+2*$q) (97+2*$q) 64 'ebolt_fire'
Save $b (801-$q) (148-$q) (146+2*$q) (128+2*$q) 64 'ebolt_fire2'
Save $b (1125) (70) (125) (240) 64 'ebolt_flame'
SaveRect $b (73-$q) (414-$q) (181+2*$q) (49+2*$q) 72 'earrow'
SaveRect $b (345-$q) (417-$q) (215+2*$q) (46+2*$q) 72 'earrow_red'
SaveRect $b (620-$q) (387-$q) (244+2*$q) (92+2*$q) 80 'earrow_fire'
SaveRect $b (960-$q) (417-$q) (116+2*$q) (58+2*$q) 56 'ebolt_purple'
SaveRect $b (1164-$q) (419-$q) (110+2*$q) (49+2*$q) 56 'ebolt_green'
SaveRect $b (1352-$q) (421-$q) (132+2*$q) (50+2*$q) 56 'ebolt_blue'
Save $b 535 533 468 462 220 'ward_circle'
