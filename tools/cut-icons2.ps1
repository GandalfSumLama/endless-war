# Icons on black background (JPG): knife, fireball, holy water, axe -> art/icons, plus fx sprites for axe / holy water.
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-icons2.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$icons = Join-Path $root 'art\icons'; $fx = Join-Path $root 'art\fx'
$files = Get-ChildItem $root -Filter *.jpg
function Src($n) { ($files | Where-Object { $_.Name -like "$n*" } | Select-Object -First 1).FullName }
$ru = @{ knife = [string]::new([char[]](0x43A,0x438,0x43D,0x436)); fire = [string]::new([char[]](0x43E,0x433,0x43D)); holy = [string]::new([char[]](0x441,0x432,0x44F,0x442)); axe = [string]::new([char[]](0x431,0x43E,0x435,0x432)) }
# name, source, thr, minHole, core ellipses, [icon size, fx name, fx size]
$jobs = @(
  @('knife', $ru.knife, 45, 4000, $null, 128, $null, 0),
  @('fireball', $ru.fire, 40, 99999999, $null, 128, $null, 0),
  @('holywater', $ru.holy, 40, 0, @(442, 570, 222, 290, 442, 310, 95, 70, 442, 150, 92, 115, 442, 835, 140, 40), 128, 'holywater', 44),
  @('axe', $ru.axe, 16, 3000, $null, 128, 'axe', 72)
)
foreach ($j in $jobs) {
  $im = [Img]::Load((Src $j[1]))
  if ($j[0] -eq 'holywater') { $im = $im.Crop(70, 80, 884, 884) }   # shorter rays, bigger flask
  $core = if ($j[4]) { [int[]]$j[4] } else { $null }
  $k = [Cut]::BlackKey($im, $j[2], $j[3], $core)
  $t = [Cut]::TrimSquare($k, 60, 6)
  $s = [Cut]::Downscale($t, $j[5], $j[5]); $s.Save((Join-Path $icons ($j[0] + '.png')))
  $t.Save((Join-Path $env:TEMP ('cut_' + $j[0] + '.png')))
  if ($j[6]) {
    # fx: only the solid object (no glow haze)
    $t2 = if ($j[0] -eq 'holywater') { $k.Crop(210, 30, 470, 850) } else { [Cut]::TrimSquare($k, 200, 2) }   # flask only, without rays
    $fw = [int]($j[7] * $t2.W / [Math]::Max($t2.W, $t2.H)); $fh = [int]($j[7] * $t2.H / [Math]::Max($t2.W, $t2.H))
    $f = [Cut]::Downscale($t2, $fw, $fh); $f.Save((Join-Path $fx ($j[6] + '.png')))
  }
  "$($j[0]): trimmed $($t.W)"
}
