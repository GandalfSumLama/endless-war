# Cuts hero sprites out of hero concept sheets into art/heroes/ and writes js/art-meta-heroes.js.
# Usage: powershell -ExecutionPolicy Bypass -File tools/cut-hero.ps1
# (ASCII only in code: PowerShell 5.1 reads files without BOM as ANSI; sheets are found by the ASCII part of the name.)
#
# Two kinds of sheets:
#   rows  - animation strips: name = x, y, w, h, frames  (+ optional cuts = frame borders, relative x)
#   rects - separate poses:   name = list of frame rectangles x, y, w, h
# bg = 'white' (remove white background) or 'alpha' (background already transparent)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$out = Join-Path $root 'art\heroes'
New-Item -ItemType Directory -Force $out | Out-Null
$W = 254

$heroes = [ordered]@{
  wanderer = @{
    file = "*main hero 1*.png"; bg = "alpha"; scale = 0.5
    rects = [ordered]@{
      idle = @(, @(388, 366, 141, 247))
      run = @(@(560, 392, 267, 221), @(769, 391, 214, 210))
      attack = @(@(351, 629, 228, 153), @(583, 623, 183, 165), @(756, 638, 210, 141))
    }
    big = @(16, 17, 377, 658)
    blank = @()
  }
  scavenger = @{
    file = '*main hero 2*.png'; bg = 'alpha'; scale = 0.5
    rects = [ordered]@{
      idle = @(, @(441, 29, 168, 389))
      run = @(@(337, 802, 217, 193), @(508, 481, 214, 270), @(1138, 783, 168, 197))
      attack = @(@(733, 473, 278, 272), @(991, 511, 357, 243), @(600, 755, 311, 242))
    }
    big = @(2, 10, 547, 984)
    blank = @(, @(352, 790, 200, 210))   # dash pose next to the portrait boots
  }
  hunter = @{
    file = "*main hero 3*.png"; bg = "alpha"; scale = 0.6
    rects = [ordered]@{
      idle = @(, @(448, 786, 109, 203))
      run = @(@(461, 1042, 154, 151), @(641, 1035, 109, 150))
      attack = @(@(594, 788, 150, 199), @(761, 1048, 172, 147), @(1038, 795, 186, 194))
    }
    big = @(3, 2, 437, 1250)
    blank = @()
    extras = @{ boomerang = @(563, 554, 258, 214) }   # weapon sprite -> art/fx/<name>.png
  }
  vampire = @{
    file = "*main hero 6*.png"; bg = "alpha"; scale = 0.7
    rects = [ordered]@{
      idle = @(@(126, 330, 92, 141), @(240, 330, 107, 142))
      run = @(@(735, 338, 82, 133), @(832, 343, 106, 126), @(977, 341, 135, 126))
      attack = @(@(179, 496, 100, 118), @(15, 494, 146, 120), @(625, 498, 172, 122))
      death = @(@(340, 806, 63, 97), @(426, 807, 76, 92), @(490, 864, 94, 36), @(589, 875, 100, 25))
    }
    big = @(426, 20, 144, 284)
    blank = @()
  }
  guardian = @{
    file = "*main hero 4*.png"; bg = "alpha"; scale = 0.6
    rects = [ordered]@{
      idle = @(, @(436, 6, 235, 397))
      run = @(@(11, 409, 131, 145), @(304, 416, 151, 135), @(454, 407, 156, 144))
      attack = @(@(339, 553, 215, 125), @(549, 548, 245, 130), @(808, 552, 200, 130))
    }
    fscale = @{ idle = 0.4 }   # the stand pose is drawn much bigger than the action poses
    big = @(436, 6, 235, 397)
    blank = @()
  }
}

$meta = @()
foreach ($id in $heroes.Keys) {
  $h = $heroes[$id]
  $im = [Img]::Load((Get-ChildItem $root -Filter $h.file)[0].FullName)
  if ($h.bg -eq 'alpha') { $m = [Cut]::AlphaMask($im, 40) }
  else {
    $m = [Cut]::BgMask($im, 30, $W, $W, $W)
    [Cut]::FillHoles($im, $m, 8, 3, $W, $W, $W)
    [Cut]::Defringe($im, $m, 70, 2, $W, $W, $W)
    [Cut]::ApplyAlpha($im, $m, 60, $W, $W, $W)
  }
  # every animation -> list of frame images (tight crops)
  $anims = [ordered]@{}
  if ($h.rows) {
    foreach ($a in $h.rows.Keys) {
      $r = $h.rows[$a]
      $cuts = if ($h.cuts -and $h.cuts[$a]) { [int[]]$h.cuts[$a] } else { $null }
      $f = [Cut]::SplitByComp($m, $im.W, $r[0], $r[1], $r[2], $r[3], $r[4], $cuts); $map = [Cut]::SlotMap
      $list = @()
      for ($i = 0; $i -lt $f.Length; $i += 4) {
        # StripSlots copies only pixels of this frame (slot i); a strip of i+1 cells, the frame sits in the last one
        $boxes = New-Object int[] ($i + 4); for ($k = 0; $k -lt 4; $k++) { $boxes[$i + $k] = $f[$i + $k] }
        $s = [Cut]::StripSlots($im, $boxes, $f[$i + 2], $f[$i + 3], $map, $r[0], $r[1], $r[2])
        $list += , $s.Crop(($i / 4) * $f[$i + 2], 0, $f[$i + 2], $f[$i + 3])
      }
      $anims[$a] = $list
    }
  } else {
    foreach ($a in $h.rects.Keys) {
      $list = @(); foreach ($q in $h.rects[$a]) { $list += , [Cut]::ExtractMain($im, $m, $q[0], $q[1], $q[2], $q[3], 5) }
      if ($h.fscale -and $h.fscale[$a]) { $k0 = $h.fscale[$a]; $list = @($list | ForEach-Object { [Cut]::Downscale($_, [int]($_.W * $k0), [int]($_.H * $k0)) }) }
      $anims[$a] = $list
    }
  }
  $cw = 0; $ch = 0
  foreach ($a in $anims.Keys) { foreach ($fr in $anims[$a]) { $cw = [Math]::Max($cw, $fr.W); $ch = [Math]::Max($ch, $fr.H) } }
  $maxN = ($anims.Values | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
  $sheet = New-Object Img; $sheet.W = $cw * $maxN; $sheet.H = $ch * $anims.Count; $sheet.P = New-Object byte[] ($sheet.W * $sheet.H * 4)
  $ri = 0; $counts = @()
  foreach ($a in $anims.Keys) {
    $ci = 0
    foreach ($fr in $anims[$a]) { [Cut]::Paste($sheet, $fr, $ci * $cw + [int](($cw - $fr.W) / 2), $ri * $ch + $ch - $fr.H); $ci++ }   # по центру, по низу ячейки
    $counts += "$($a): $($anims[$a].Count)"; $ri++
  }
  if ($h.scale -lt 1) {
    $sheet = [Cut]::Downscale($sheet, [int]($sheet.W * $h.scale), [int]($sheet.H * $h.scale))
    $cw = [int]($cw * $h.scale); $ch = [int]($ch * $h.scale)
  }
  $sheet.Save("$out\$id.png")
  # big portrait: main figure of the area (caption areas masked out), downscaled to 320 px height
  $b = $h.big
  foreach ($z in $h.blank) { for ($y = $z[1]; $y -lt $z[1] + $z[3]; $y++) { for ($x = $z[0]; $x -lt $z[0] + $z[2]; $x++) { $m[$y * $im.W + $x] = $true } } }
  $fig = [Cut]::ExtractMain($im, $m, $b[0], $b[1], $b[2], $b[3], 6)
  $k = [Math]::Min(1.0, 320.0 / $fig.H)
  $fig = [Cut]::Downscale($fig, [int]($fig.W * $k), [int]($fig.H * $k))
  $fig.Save("$out\${id}_big.png")
  if ($h.extras) {                                   # extra sprites (weapons, effects) -> art/fx/<name>.png
    New-Item -ItemType Directory -Force (Join-Path $root 'art\fx') | Out-Null
    foreach ($ex in $h.extras.Keys) {
      $q = $h.extras[$ex]; $e = [Cut]::ExtractMain($im, $m, $q[0], $q[1], $q[2], $q[3], 4)
      $k2 = [Math]::Min(1.0, 72.0 / $e.H); $e = [Cut]::Downscale($e, [int]($e.W * $k2), [int]($e.H * $k2))
      $e.Save((Join-Path $root "art\fx\$ex.png"))
    }
  }
  $meta += "  $($id): { cw: $cw, ch: $ch, $($counts -join ', ') },"
}
$js = "// Generated by tools/cut-hero.ps1 - do not edit by hand`n// rows in art/heroes/<id>.png in this order`nconst ART_META_HEROES = {`n" + ($meta -join "`n") + "`n};`n"
[IO.File]::WriteAllText((Join-Path $root 'js\art-meta-heroes.js'), $js)
$js
