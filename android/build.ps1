# Builds EndlessWar.apk from the web game (../index.html, js, css, art) using Android SDK tools directly (no Gradle).
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1 [-Install]
#   -Install  also installs the APK on a phone connected via USB (adb).
# (ASCII only: Windows PowerShell 5.1 reads scripts without BOM as ANSI.)
param(
  [switch]$Install,
  [string]$VersionCode = '2',
  [string]$VersionName = '0.2'
)
$ErrorActionPreference = 'Stop'

$here  = $PSScriptRoot
$game  = Split-Path $here
$sdk   = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$bt    = Join-Path $sdk 'build-tools\36.0.0'
$jar   = Join-Path $sdk 'platforms\android-34\android.jar'
$adb   = Join-Path $sdk 'platform-tools\adb.exe'
$jbr   = 'C:\Program Files\Android\Android Studio\jbr'
$out   = Join-Path $here 'build'
$apk   = Join-Path $game 'EndlessWar.apk'
$ks     = if ($env:EW_KEYSTORE) { $env:EW_KEYSTORE } else { Join-Path $here 'endlesswar.keystore' }  # keep the existing signing key for updates
$ksAlias = if ($env:EW_KEY_ALIAS) { $env:EW_KEY_ALIAS } else { 'endlesswar' }
$ksPass = $env:EW_KEY_PASSWORD
if (-not $ksPass) { throw 'Set EW_KEY_PASSWORD in the environment before building a release APK.' }
if (-not (Test-Path $ks)) { throw "Signing keystore not found: $ks. Set EW_KEYSTORE to the existing release keystore." }
if ($VersionCode -notmatch '^\d+$' -or [int]$VersionCode -lt 1) { throw 'VersionCode must be a positive integer.' }
$versionCode = $VersionCode
$versionName = $VersionName

$env:JAVA_HOME = $jbr
$env:PATH = "$jbr\bin;$env:PATH"

function Run([string]$exe, [string[]]$argv) {
  & $exe @argv
  if ($LASTEXITCODE -ne 0) { throw "Failed ($LASTEXITCODE): $exe $($argv -join ' ')" }
}

Write-Host '== clean'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force "$out\classes", "$out\dex", "$out\web\assets" | Out-Null

# Game files -> build\web\assets\... They are added with 'aapt add' and forward slashes:
# aapt2 -A on Windows writes subfolder entries with backslashes, which Android cannot find.
Copy-Item (Join-Path $game 'index.html') "$out\web\assets\"
foreach ($d in 'js', 'css', 'art') {
  if (Test-Path (Join-Path $game $d)) { Copy-Item (Join-Path $game $d) "$out\web\assets\" -Recurse }
}

Write-Host '== resources'
Run "$bt\aapt2.exe" @('compile', '--dir', "$here\res", '-o', "$out\res.zip")
Run "$bt\aapt2.exe" @('link', '-o', "$out\app.unsigned.apk", '-I', $jar,
  '--manifest', "$here\AndroidManifest.xml",
  '--min-sdk-version', '26', '--target-sdk-version', '34',
  '--version-code', $versionCode, '--version-name', $versionName, "$out\res.zip")

Write-Host '== java'
$src = Get-ChildItem "$here\src" -Recurse -Filter *.java | ForEach-Object FullName
Run "$jbr\bin\javac.exe" (@('-encoding', 'UTF-8', '-source', '11', '-target', '11', '-Xlint:-options',
  '-classpath', $jar, '-d', "$out\classes") + $src)

Write-Host '== dex'
$classes = Get-ChildItem "$out\classes" -Recurse -Filter *.class | ForEach-Object FullName
Run "$bt\d8.bat" (@('--release', '--min-api', '26', '--lib', $jar, '--output', "$out\dex") + $classes)

Write-Host '== package'
Push-Location "$out\dex"
try { Run "$bt\aapt.exe" @('add', "$out\app.unsigned.apk", 'classes.dex') | Out-Null } finally { Pop-Location }
Push-Location "$out\web"
try {
  $base = (Get-Location).Path + '\'
  $files = Get-ChildItem 'assets' -Recurse -File | ForEach-Object { $_.FullName.Substring($base.Length).Replace('\', '/') }
  Run "$bt\aapt.exe" (@('add', "$out\app.unsigned.apk") + $files) | Out-Null
} finally { Pop-Location }
Run "$bt\zipalign.exe" @('-f', '-p', '4', "$out\app.unsigned.apk", "$out\app.aligned.apk")

Write-Host '== sign'
if (-not (Test-Path $ks)) {
  Run "$jbr\bin\keytool.exe" @('-genkeypair', '-keystore', $ks, '-alias', $ksAlias, '-keyalg', 'RSA',
    '-keysize', '2048', '-validity', '10000', '-storepass', $ksPass, '-keypass', $ksPass,
    '-dname', 'CN=Endless War')
}
Run "$bt\apksigner.bat" @('sign', '--ks', $ks, '--ks-key-alias', $ksAlias, '--ks-pass', "pass:$ksPass", '--out', $apk, "$out\app.aligned.apk")
Run "$bt\apksigner.bat" @('verify', $apk)
Write-Host "== done: $apk ($([math]::Round((Get-Item $apk).Length / 1KB)) KB)"

if ($Install) {
  Write-Host '== install'
  Run $adb @('install', '-r', $apk)
  Run $adb @('shell', 'am', 'start', '-n', 'com.endlesswar.game/.MainActivity')
}
