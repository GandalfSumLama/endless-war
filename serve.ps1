# Local static server for testing the game on PC: http://localhost:8080
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8080]
param([int]$Port = 8080)
$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$mime = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.webp' = 'image/webp'; '.json' = 'application/json'; '.svg' = 'image/svg+xml' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $root at http://localhost:$Port/"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $root $path
  $res = $ctx.Response
  $res.Headers.Add('Cache-Control', 'no-store')
  try {
    if ((Test-Path $file -PathType Leaf) -and ([IO.Path]::GetFullPath($file).StartsWith($root, [StringComparison]::OrdinalIgnoreCase))) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      if ($ctx.Request.HttpMethod -eq 'HEAD') { $res.ContentLength64 = $bytes.Length }
      else { $res.SendChunked = $true; $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } else { $res.StatusCode = 404; $res.ContentLength64 = 0 }
  } finally { $res.Close() }
}
