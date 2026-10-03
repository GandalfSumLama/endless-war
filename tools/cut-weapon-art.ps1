# Арт способностей из assets_src/extra -> art/fx/*.png, иконка Землетрясения -> art/icons/quake.png
#  Призрачные мечи — Wenrexa «Sprites Weapon: Swords» (CC0); Щиты-хранители — Higalina «Fantasy Shield Icons» (бесплатно для игр, без указания авторства);
#  Оберег — Cethiel «Angel Shield Effect» (CC0) и руны FLARE; Боевой дрон — engvee / Maksim Bugrimov «FREE Isometric Animated Drone» (бесплатно для игр)
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-weapon-art.ps1  (после tools/cut-flare-fx.ps1 — нужны fx_runes)
$ErrorActionPreference = 'Stop'
$game = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs" -ReferencedAssemblies System.Drawing
Add-Type -AssemblyName System.Drawing
$x = "$game\assets_src\extra"; $fx = "$game\art\fx"
function Fit($im, $w, $h) { [Cut]::Downscale($im, [int]$w, [int]$h) }

# Мечи: остриё вправо, обрезаны по клинку
foreach ($s in @(@('14', 'sword_ghost'), @('58', 'sword_dance'))) {
  $im = [Cut]::Trim([Img]::Load("$x\swords_wenrexa\$($s[0]).png"), 8, 1)
  $o = Fit $im 128 ([Math]::Round(128 * $im.H / $im.W)); $o.Save("$fx\$($s[1]).png"); "$($s[1]): $($o.W)x$($o.H)"
}
# Щиты: стоят вертикально
foreach ($s in @(@('shield_25', 'gshield'), @('shield_01', 'gshield_aegis'))) {
  $im = [Cut]::Trim([Img]::Load("$x\shields_higalina\$($s[0]).png"), 8, 2)
  $o = Fit $im ([Math]::Round(84 * $im.W / $im.H)) 84; $o.Save("$fx\$($s[1]).png"); "$($s[1]): $($o.W)x$($o.H)"
}
# Оберег: крылатый щит, 4 кадра раскрытия (синий вариант), в ряд
$fr = @('03', '07', '11', '15') | ForEach-Object { [Img]::Load("$x\angel_shield\AngelShieldEffect_$_.png") }
$b = [Cut]::Bounds($fr[3], 6); $cx0 = [Math]::Max(0, $b[0] - 2); $cy0 = [Math]::Max(0, $b[1] - 2); $cw0 = [Math]::Min($fr[3].W - $cx0, $b[2] - $cx0 + 3); $ch0 = [Math]::Min($fr[3].H - $cy0, $b[3] - $cy0 + 3)
$cw = [int]($cw0 * 0.6); $ch = [int]($ch0 * 0.6)
$sheet = New-Object Img; $sheet.W = $cw * 4; $sheet.H = $ch; $sheet.P = New-Object byte[] ($sheet.W * $sheet.H * 4)
for ($i = 0; $i -lt 4; $i++) { [Cut]::Paste($sheet, (Fit $fr[$i].Crop($cx0, $cy0, $cw0, $ch0) $cw $ch), $i * $cw, 0) }
$sheet.Save("$game\art\flare\fx_ward_wings.png"); "ward_wings: 4 x $cw x $ch"   # как эффект FLARE: FLARE_FX.ward_wings в js/data.js
# Оберег: руны FLARE, перекрашенные в голубой (круг на земле под героем)
$rn = [Img]::Load("$game\art\flare\fx_runes.png"); [Cut]::Gradient($rn, 20, 110, 210, 210, 255, 255, 1.7); $rn.Save("$fx\ward_runes.png"); "ward_runes: $($rn.W)x$($rn.H)"

# Дрон: 16 направлений (строки, 0 — нос вверх, дальше по часовой через 22.5°), кадры: 4 — полёт, 8 — очередь из пулемёта
$dirs = 0..15 | ForEach-Object { '{0:000}' -f [int][Math]::Floor($_ * 22.5) }
$cells = @()
foreach ($d in $dirs) {
  $idle = [Img]::Load("$x\drone_engvee\idle\Normal_Idle_Simple_Body_$d.png"); $fire = [Img]::Load("$x\drone_engvee\fire\Normal_Fire_Gun_Horizontal_Body_$d.png")
  $row = @(); foreach ($i in 0, 2, 4, 6) { $row += , $idle.Crop(($i % 4) * 180, [Math]::Floor($i / 4) * 180, 180, 180) }
  foreach ($i in 0, 2, 4, 6, 8, 10, 12, 14) { $row += , $fire.Crop(($i % 5) * 180, [Math]::Floor($i / 5) * 180, 180, 180) }
  $cells += , $row
}
$u = @(999, 999, -1, -1)   # общая рамка по всем кадрам — дрон не «прыгает» при смене кадра
foreach ($row in $cells) { foreach ($c in $row) { $b = [Cut]::Bounds($c, 10); $u[0] = [Math]::Min($u[0], $b[0]); $u[1] = [Math]::Min($u[1], $b[1]); $u[2] = [Math]::Max($u[2], $b[2]); $u[3] = [Math]::Max($u[3], $b[3]) } }
$bw = $u[2] - $u[0] + 1; $bh = $u[3] - $u[1] + 1; $k = 64.0 / [Math]::Max($bw, $bh); $dw = [int]($bw * $k); $dh = [int]($bh * $k)
$sheet = New-Object Img; $sheet.W = $dw * 12; $sheet.H = $dh * 16; $sheet.P = New-Object byte[] ($sheet.W * $sheet.H * 4)
for ($r = 0; $r -lt 16; $r++) { for ($i = 0; $i -lt 12; $i++) { [Cut]::Paste($sheet, (Fit $cells[$r][$i].Crop($u[0], $u[1], $bw, $bh) $dw $dh), $i * $dw, $r * $dh) } }
$sheet.Save("$fx\drone3d.png")
# центр корпуса в кадре 180×180 — (90, 90): точка привязки относительно рамки
"drone3d: cw $dw ch $dh ax $([int]((90 - $u[0]) * $k)) ay $([int]((90 - $u[1]) * $k))"

# Иконка Землетрясения: светящиеся трещины Разлома, перекрашенные в раскалённую лаву, и каменный шип FLARE (rupture) из них
$ic = [Img]::Load("$game\art\icons\rift.png"); [Cut]::Gradient($ic, 96, 28, 4, 255, 236, 150, 2.3)
$sp = [Cut]::Trim([Img]::Load("$game\assets_src\flare\mods\fantasycore\images\powers\rupture.png").Crop(0, 0, 178, 146), 8, 0)   # кадр 3 варианта 1 — самый высокий шип
$sw = 104; $sh = [int]($sp.H * $sw / $sp.W); [Cut]::Blend($ic, (Fit $sp $sw $sh), [int]((128 - $sw) / 2), 124 - $sh)
$ic.Save("$game\art\icons\quake.png"); "quake icon: 128x128"
# Кровавые шипы: шипы FLARE (fx_spikes) перекрашены в тёмно-красный с алыми гранями -> art/flare/fx_spikes_blood.png (FLARE_FX.spikes_blood в js/data.js)
$sb = [Img]::Load("$game\art\flare\fx_spikes.png"); [Cut]::Gradient($sb, 60, 0, 8, 255, 120, 130, 1.6); $sb.Save("$game\art\flare\fx_spikes_blood.png"); "spikes_blood: $($sb.W)x$($sb.H)"
