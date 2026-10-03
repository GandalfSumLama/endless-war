# Evolution icons (25, white background) -> art/icons/<evo id>.png. Order = EVOLUTIONS order in data.js.
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-icons4.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$icons = Join-Path $root 'art\icons'
$src = Join-Path $root 'icons3.png'
if (-not (Test-Path $src)) {
  Add-Type -AssemblyName PresentationCore
  $s = [IO.File]::OpenRead((Join-Path $root 'icons3.webp'))
  $d = [Windows.Media.Imaging.BitmapDecoder]::Create($s, 'None', 'OnLoad')
  $e = New-Object Windows.Media.Imaging.PngBitmapEncoder
  $e.Frames.Add($d.Frames[0]); $o = [IO.File]::Create($src); $e.Save($o); $o.Close(); $s.Close()
}
$im = [Img]::Load($src); $am = [Cut]::AlphaMask($im, 60)
"sheet $($im.W)x$($im.H) alpha: $([Cut]::AlphaHist($im) -join ",")"
$ids = @('aegis', 'arcane_storm', 'thousand_blades', 'blood_aura', 'sun_vortex', 'soul_reaper', 'heaven_wrath', 'inferno',
  'cyclone', 'absolute_zero', 'prism', 'armageddon', 'drone_swarm', 'steam_burst', 'storm_orbs', 'blood_forest',
  'pestilence', 'shuriken_storm', 'fortress', 'frost_star', 'blade_dance', 'rift', 'meteor_shower', 'hurricane', 'night_flock')
$rows = @(0, 228, 420, 592, $im.H); $m40 = [Cut]::AlphaMask($im, 40)
$boxes = @(); for ($rr = 0; $rr -lt 4; $rr++) { $n = if ($rr -eq 3) { 1 } else { 8 }; $r = [Cut]::SplitRow($m40, $im.W, 0, $rows[$rr], $im.W, $rows[$rr + 1] - $rows[$rr], $n, 2); for ($q = 0; $q -lt $r.Length; $q += 4) { $boxes += ,@($r[$q], $r[$q + 1], $r[$q + 2], $r[$q + 3]) } }
"found $($boxes.Count)"
for ($i = 0; $i -lt [Math]::Min($boxes.Count, $ids.Count); $i++) {
  $b = $boxes[$i]; $p = 0
  $x = [Math]::Max(0, $b[0] - $p); $y = [Math]::Max(0, $b[1] - $p)
  $w = [Math]::Min($im.W - $x, $b[2] + 2 * $p); $h = [Math]::Min($im.H - $y, $b[3] + 2 * $p)
  $k = $im.Crop($x, $y, $w, $h)
  $t = [Cut]::TrimSquare($k, 50, 3)
  ([Cut]::Downscale($t, 128, 128)).Save((Join-Path $icons ($ids[$i] + '.png')))
  "$($ids[$i]): box $($b -join ',')"
}
