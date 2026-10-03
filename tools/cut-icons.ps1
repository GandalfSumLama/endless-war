# Cuts skill icons out of effect sheets into art/icons/ (and optionally a full-size copy for the in-game effect into art/fx/).
# Glow effects drawn on a light (checkerboard) background are made transparent by Cut.Unglow.
# Usage: powershell -ExecutionPolicy Bypass -File tools/cut-icons.ps1
# (ASCII only in code: PowerShell 5.1 reads files without BOM as ANSI; Cyrillic names are built from char codes.)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$out = Join-Path $root 'art\icons'
$fxDir = Join-Path $root 'art\fx'
New-Item -ItemType Directory -Force $out, $fxDir | Out-Null

$auraWord = "$([char]0x0430)$([char]0x0443)$([char]0x0440)$([char]0x0430)"   # "aura" in Russian
# icon id = sheet name prefix, area x, y, w, h, glow color r, g, b, fx = name of the full-size effect copy
$icons = [ordered]@{
  aura = @{ sheet = "$auraWord*"; rect = @(70, 700, 340, 360); color = @(40, 110, 255); fx = 'aura_ring' }   # swirling ring
}

foreach ($id in $icons.Keys) {
  $ic = $icons[$id]
  $im = [Img]::Load((Get-ChildItem $root -Filter *.png | Where-Object { $_.Name -like $ic.sheet })[0].FullName)
  $q = $ic.rect; $c = $ic.color
  $e = [Cut]::Unglow($im, $q[0], $q[1], $q[2], $q[3], $c[0], $c[1], $c[2])
  if ($ic.fx) {
    $e.Save((Join-Path $fxDir ($ic.fx + '.png')))
    "$id effect -> art/fx/$($ic.fx).png ($($e.W)x$($e.H))"
  }
  $k = 128.0 / [Math]::Max($e.W, $e.H)
  $e = [Cut]::Downscale($e, [int]($e.W * $k), [int]($e.H * $k))
  $e.Save("$out\$id.png")
  "$id -> art/icons/$id.png ($($e.W)x$($e.H))"
}
