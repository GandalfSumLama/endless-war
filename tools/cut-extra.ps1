# Extra monsters from other sheets: bat (two wing poses from the vampire sheet) -> art/enemies2/bat.png
# Usage: powershell -ExecutionPolicy Bypass -File tools/cut-extra.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
$im = [Img]::Load((Get-ChildItem $root -Filter '*main hero 6*.png')[0].FullName)
$m = [Cut]::AlphaMask($im, 60)
$a = [Cut]::ExtractMain($im, $m, 1405, 160, 105, 70, 3)      # wings spread
$b = [Cut]::ExtractMain($im, $m, 1455, 225, 60, 52, 3)       # wings raised
$b = [Cut]::Downscale($b, [int]($b.W * 1.0), [int]($b.H * 1.0))
$frames = @($a, $b)
$cw = ($frames | ForEach-Object { $_.W } | Measure-Object -Maximum).Maximum
$ch = ($frames | ForEach-Object { $_.H } | Measure-Object -Maximum).Maximum
$sheet = New-Object Img; $sheet.W = $cw * 2; $sheet.H = $ch * 2; $sheet.P = New-Object byte[] ($sheet.W * $sheet.H * 4)
for ($i = 0; $i -lt 2; $i++) { $f = $frames[$i]; [Cut]::Paste($sheet, $f, $i * $cw + [int](($cw - $f.W) / 2), [int](($ch - $f.H) / 2)) }   # row 0: flap
[Cut]::Paste($sheet, $a, [int](($cw - $a.W) / 2), $ch + [int](($ch - $a.H) / 2))                                          # row 1: attack
$sheet.Save((Join-Path $root 'art\enemies2\bat.png'))
"bat: cw $cw ch $ch"
