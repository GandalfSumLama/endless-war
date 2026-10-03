# Fire effects sheet (dark background JPG): fireball projectile + 6-frame fire ring animation -> art/fx
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-fire.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$fx = Join-Path $root 'art\fx'
$name = [string]::new([char[]](0x43E,0x433,0x43E,0x43D,0x44C))   # "ogon'"
$f = (Get-ChildItem $root -Filter *.jpg | Where-Object { $_.Name -like "$name*" } | Select-Object -First 1).FullName
$im = [Img]::Load($f)
$k = [Cut]::BlackKey([Cut]::Lift($im, 70), 120, 300, $null)
$m = [Cut]::AlphaMask($k, 40)
# fireball: main piece (head + tail), head looks right
$fb = [Cut]::ExtractMain($k, $m, 105, 400, 190, 95, 8)
$s = 48.0 / $fb.H; $fb = [Cut]::Downscale($fb, [int]($fb.W * $s), 48); $fb.Save((Join-Path $fx 'fireball.png'))
"fireball $($fb.W)x$($fb.H)"
# ring frames: fixed cells so the animation stays centered
$cx = @(475, 688, 900); $ry = @(105, 316); $cw = 210; $ch = 160; $fw = 160; $fh = 122
$sheet = New-Object Img; $sheet.W = $fw * 6; $sheet.H = $fh; $sheet.P = New-Object byte[] ($sheet.W * $sheet.H * 4)
for ($i = 0; $i -lt 6; $i++) {
  $c = $k.Crop($cx[$i % 3] - $cw / 2, $ry[[Math]::Floor($i / 3)], $cw, $ch)
  [Cut]::Paste($sheet, [Cut]::Downscale($c, $fw, $fh), $i * $fw, 0)
}
$sheet.Save((Join-Path $fx 'fire_ring.png')); "ring sheet $($sheet.W)x$($sheet.H)"
