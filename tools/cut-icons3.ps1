# Sheet of 12 ability icons (4x3) on black background -> art/icons/<id>.png
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-icons3.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$icons = Join-Path $root 'art\icons'
$src = Join-Path $root 'icons2.png'
if (-not (Test-Path $src)) {
  # webp -> png via WIC (Windows WebP codec)
  Add-Type -AssemblyName PresentationCore
  $s = [IO.File]::OpenRead((Join-Path $root 'icons2.webp'))
  $d = [Windows.Media.Imaging.BitmapDecoder]::Create($s, 'None', 'OnLoad')
  $e = New-Object Windows.Media.Imaging.PngBitmapEncoder
  $e.Frames.Add($d.Frames[0]); $o = [IO.File]::Create($src); $e.Save($o); $o.Close(); $s.Close()
}
$im = [Img]::Load($src)
$ids = @('beam', 'frost', 'swords', 'lances', 'turret', 'starfall', 'tornado', 'batswarm', 'plague', 'shuriken', 'spikes', 'drone_swarm')
$cw = [int]($im.W / 4); $ch = [int]($im.H / 3)
for ($i = 0; $i -lt 12; $i++) {
  $cx = ($i % 4) * $cw; $cy = [Math]::Floor($i / 4) * $ch
  $cell = $im.Crop($cx, $cy, [Math]::Min($cw, $im.W - $cx), [Math]::Min($ch, $im.H - $cy))
  $k = [Cut]::BlackKey($cell, 40, 1500, $null)
  $t = [Cut]::TrimSquare($k, 50, 4)
  $o = [Cut]::Downscale($t, 128, 128)
  $o.Save((Join-Path $icons ($ids[$i] + '.png')))
  "$($ids[$i]): $($t.W)"
}
