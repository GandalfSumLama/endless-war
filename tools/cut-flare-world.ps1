# Мир из тайлсетов FLARE (flare-game, CC-BY-SA 3.0):
#  - бесшовные текстуры земли art/flare/ground_<name>.jpg (изометрические плитки 192x96, перекраска для биомов)
#  - препятствия art/flare/props/<name>.png + точка «ног» -> js/art-meta-flare-world.js
# Run: powershell -ExecutionPolicy Bypass -File tools/cut-flare-world.ps1
$ErrorActionPreference = 'Stop'
$game = Split-Path $PSScriptRoot
Add-Type -Path "$PSScriptRoot\SpriteCut.cs", "$PSScriptRoot\WorldTools.cs" -ReferencedAssemblies System.Drawing
Add-Type -AssemblyName System.Drawing
$fc = "$game\assets_src\flare\mods\fantasycore"
$out = "$game\art\flare"; $pdir = "$out\props"; New-Item -ItemType Directory -Force $pdir | Out-Null
$SC = 0.6   # масштаб мира (как у монстров)

$sets = @{}
foreach ($n in 'grassland', 'snowplains', 'cave', 'dungeon') {
  $def = Get-Content "$fc\tilesetdefs\tileset_$n.txt"
  $img = ($def | Where-Object { $_ -like 'img=*' } | Select-Object -First 1).Substring(4)
  $t = @{}; foreach ($l in ($def | Where-Object { $_ -like 'tile=*' })) { $p = $l.Substring(5).Split(',') | ForEach-Object { [int]$_ }; $t[$p[0]] = $p }
  $sets[$n] = @{ img = [Img]::Load("$fc\$($img.Replace('/', '\'))"); tiles = $t }
}
# Руины — тайлсет кампании Empyrean (тот же flare-game, CC-BY-SA 3.0)
$ec = "$game\assets_src\flare\mods\empyrean_campaign"; $def = Get-Content "$ec\tilesetdefs\tileset_ruins.txt"
$img = ($def | Where-Object { $_ -like 'img=*' } | Select-Object -First 1).Substring(4)
$t = @{}; foreach ($l in ($def | Where-Object { $_ -like 'tile=*' })) { $p = $l.Substring(5).Split(',') | ForEach-Object { [int]$_ }; $t[$p[0]] = $p }
$sets['ruins'] = @{ img = [Img]::Load("$ec\$($img.Replace('/', '\'))"); tiles = $t }
function Tile($set, $id) { $s = $sets[$set]; $t = $s.tiles[$id]; return @{ img = $s.img.Crop($t[1], $t[2], $t[3], $t[4]); ox = $t[5]; oy = $t[6] } }

# ---------- земля ----------
function Colorize($im, $hex, $k) {
  if (-not $hex) { return }
  $tr = [Convert]::ToInt32($hex.Substring(1, 2), 16); $tg = [Convert]::ToInt32($hex.Substring(3, 2), 16); $tb = [Convert]::ToInt32($hex.Substring(5, 2), 16)
  [WorldTools]::Colorize($im, $tr, $tg, $tb, $k)
}
$grounds = @(
  # имя, тайлсет, плитки, оттенок, сила
  @('grass', 'grassland', (16..31), $null, 0), @('jungle', 'grassland', (16..31), '#3a8a3a', 0.35), @('swamp', 'grassland', (16..31), '#4a5a3a', 0.55),
  @('toxic', 'grassland', (16..31), '#9aaa3a', 0.5), @('ruins', 'ruins', ((102..119) + (102..119) + (64..68) + (83..86) + (24..31)), $null, 0), @('snow', 'snowplains', (16..31), $null, 0),
  @('ice', 'snowplains', (16..31), '#a8d0ff', 0.45), @('moon', 'snowplains', (16..31), '#8a90b0', 0.6), @('dirt', 'cave', (16..31), $null, 0),
  @('desert', 'cave', (16..31), '#f0c070', 0.75), @('canyon', 'cave', (16..31), '#d06a3a', 0.7), @('coast', 'cave', (16..31), '#f0e0b0', 0.75),
  @('volcano', 'cave', (16..31), '#8a2a1a', 0.55), @('dungeon', 'dungeon', @(16, 17, 18, 19, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47), $null, 0),
  @('haunted', 'dungeon', @(16, 17, 18, 19, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47), '#6a5a9a', 0.5),
  @('crystal_blue', 'dungeon', @(16, 17, 18, 19, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47), '#4a7ad0', 0.55),
  @('crystal_purple', 'dungeon', @(16, 17, 18, 19, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47), '#8a4ad0', 0.55)
)
$rnd = New-Object Random 7
$jpg = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 82L
foreach ($gd in $grounds) {
  $W = 192 * 5; $H = 96 * 5
  $cv = New-Object Img; $cv.W = $W; $cv.H = $H; $cv.P = New-Object byte[] ($W * $H * 4)
  $tiles = @($gd[2] | ForEach-Object { Tile $gd[1] $_ })
  for ($pass = 0; $pass -lt 2; $pass++) {            # два прохода — без щелей между ромбами
    for ($j = 0; $j -lt 10; $j++) { for ($i = 0; $i -lt 5; $i++) {
      $t = $tiles[$rnd.Next($tiles.Count)]
      [WorldTools]::PutWrap($cv, $t.img, $i * 192 + ($j % 2) * 96 + $pass * 0, $j * 48, $t.ox, $t.oy)
    } }
  }
  Colorize $cv $gd[3] $gd[4]
  $small = [Cut]::Downscale($cv, [int]($W * $SC), [int]($H * $SC)); $tmp = "$env:TEMP\ground_tmp.png"; $small.Save($tmp)
  $bm = [Drawing.Image]::FromFile($tmp); $bm.Save("$out\ground_$($gd[0]).jpg", $jpg, $ep); $bm.Dispose()
  "ground $($gd[0]) $([Math]::Round((Get-Item "$out\ground_$($gd[0]).jpg").Length / 1KB)) KB"
}

# ---------- препятствия ----------
$props = [ordered]@{
  g_birch = @('grassland', 240, 241, 242, 243); g_dead = @('grassland', 244, 245, 246, 247); g_pine = @('grassland', 248, 249, 250, 251); g_oak = @('grassland', 252, 253, 254, 255)
  g_rock = @('grassland', 128, 129, 130, 131); g_pillar = @('grassland', 132, 133, 134, 135); g_stump = @('grassland', 136, 137); g_log = @('grassland', 100, 101)
  g_bush = @('grassland', 112, 113, 116, 117, 120, 121); g_grass = @('grassland', 124, 125, 126, 127); g_tomb = @('grassland', 140, 141, 142, 143)
  g_fence = @('grassland', 104, 105, 107, 108); g_crate = @('grassland', 96, 97, 98, 99); g_camp = @('grassland', 102); g_tent = @('grassland', 72, 75); g_sign = @('grassland', 138)
  s_dead = @('snowplains', 244, 245, 246, 247); s_rock = @('snowplains', 128, 129, 130, 131); s_pillar = @('snowplains', 132, 133, 134, 135); s_bush = @('snowplains', 112, 113, 116, 117)
  s_stump = @('snowplains', 136, 137); s_tomb = @('snowplains', 140, 141, 142, 143); s_log = @('snowplains', 100, 101); s_crate = @('snowplains', 96, 97)
  c_stalag = @('cave', 144, 145, 146, 147, 148, 149); c_rock = @('cave', 150, 151, 152, 153); c_shroom = @('cave', 132, 133, 134, 135); c_barrel = @('cave', 162, 178); c_crate = @('cave', 163, 179); c_cart = @('cave', 128, 130)
  d_statue = @('dungeon', 128, 129, 130, 131); d_pillar = @('dungeon', 110, 111); d_tomb = @('dungeon', 118, 119, 120); d_altar = @('dungeon', 194, 197); d_bones = @('dungeon', 176, 177, 178, 180, 181, 182)
  d_brazier = @('dungeon', 151); d_barrel = @('dungeon', 146); d_crate = @('dungeon', 147); d_throne = @('dungeon', 132)
  # Древние руины
  r_statue = @('ruins', 241, 242, 243, 244); r_bstatue = @('ruins', 245, 246); r_pillar = @('ruins', 223, 226, 229, 231, 233); r_stub = @('ruins', 186, 234)
  r_pile = @('ruins', 187); r_rubble = @('ruins', 189, 190, 191, 192, 193, 194); r_block = @('ruins', 60, 61, 62, 63); r_well = @('ruins', 289, 290)
  r_urn = @('ruins', 268, 269); r_lamp = @('ruins', 293, 294); r_crystal = @('ruins', 278); r_stele = @('ruins', 291, 292); r_lectern = @('ruins', 274, 275, 276, 277)
  r_bush = @('ruins', 312, 313, 316, 317); r_tree = @('ruins', 314, 315); r_sword = @('ruins', 270, 271, 272, 273)
}
$meta = @()
foreach ($k in $props.Keys) {
  $p = $props[$k]; $n = 0
  foreach ($id in $p[1..($p.Length - 1)]) {
    $t = Tile $p[0] $id; $blk = $k -eq 'r_block'; $k2 = if ($blk) { 1.0 } else { $SC }   # камни стен руин мелкие — без уменьшения, иначе мыло при отрисовке
    $c = [Cut]::Downscale($t.img, [Math]::Max(1, [int]($t.img.W * $k2)), [Math]::Max(1, [int]($t.img.H * $k2)))
    $name = "$($k)_$n"; $c.Save("$pdir\$name.png")
    $ax = if ($blk) { [int]($c.W / 2) } else { [int]($t.ox * $k2) }; $ay = if ($blk) { [int]($c.H * 0.85) } else { [int]($t.oy * $k2) }   # у камней точка привязки в тайле смещена — ставим по центру низа
    $meta += "  $($name): [$($c.W), $($c.H), $ax, $ay],"; $n++
  }
}
$js = "// Generated by tools/cut-flare-world.ps1 - do not edit by hand`n// FLARE props (flare-game, CC-BY-SA 3.0): name: [w, h, ax, ay] - ax/ay = ground point in the image`nconst FLARE_PROPS = {`n" + ($meta -join "`n") + "`n};`n"
[IO.File]::WriteAllText("$game\js\art-meta-flare-world.js", $js)
"props: $($meta.Count), $([Math]::Round((Get-ChildItem $pdir | Measure-Object Length -Sum).Sum / 1KB)) KB"
