# Download free ("name your own price") itch.io asset packs: purchase page -> "No thanks" -> download page -> file
# Usage: powershell -ExecutionPolicy Bypass -File tools/itch-dl.ps1 -Out <dir> -Pages <url1>,<url2>,...
param([string]$Out, [string[]]$Pages)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $Out | Out-Null
$Pages = $Pages | ForEach-Object { $_ -split "," } | Where-Object { $_ }
foreach ($page in $Pages) {
  $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $p = Invoke-WebRequest -UseBasicParsing -WebSession $s "$page/purchase"
  $tok = [regex]::Match($p.Content, 'name="csrf_token" value="([^"]+)"').Groups[1].Value
  $r = Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post "$page/download_url" -Body @{ csrf_token = $tok } -Headers @{ 'X-Requested-With' = 'XMLHttpRequest' }
  $dlPage = ($r.Content | ConvertFrom-Json).url
  $d = Invoke-WebRequest -UseBasicParsing -WebSession $s $dlPage
  $tok2 = [regex]::Match($d.Content, 'name="csrf_token" value="([^"]+)"').Groups[1].Value
  if (-not $tok2) { $tok2 = [regex]::Match($d.Content, 'csrf_token" content="([^"]+)"').Groups[1].Value }
  $ids = [regex]::Matches($d.Content, 'data-upload_id="(\d+)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
  $key = [Uri]::EscapeDataString([Uri]::UnescapeDataString([regex]::Match($dlPage, "/download/([^/?]+)").Groups[1].Value))
  foreach ($id in $ids) {
    $f = Invoke-WebRequest -UseBasicParsing -WebSession $s -Method Post "$page/file/$id`?source=game_download" -Body @{ csrf_token = $tok2 } -Headers @{ 'X-Requested-With' = 'XMLHttpRequest' }
    $url = ($f.Content | ConvertFrom-Json).url
    $name = ($page.TrimEnd("/").Split("/")[-1]) + $(if ($ids.Count -gt 1) { "_$id" } else { "" }) + ".zip"
    $dest = Join-Path $Out $name
    Invoke-WebRequest -UseBasicParsing $url -OutFile $dest
    "$page -> $name ($([Math]::Round((Get-Item $dest).Length / 1KB)) KB)"
  }
  if (-not $ids) { "$page -> no files found" }
}
