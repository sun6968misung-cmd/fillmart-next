param()

$EnvFile   = Join-Path $PSScriptRoot "..\pilmart-next\.env.local"
$ApkPath   = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\app-release.apk"
$Owner     = "sun6968misung-cmd"
$Repo      = "fillmart-next"
$AssetName = "pilmart-latest.apk"

if (-not (Test-Path $ApkPath)) {
    Write-Error "APK not found: $ApkPath"
    exit 1
}

$ghToken = ""
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^GITHUB_TOKEN=(.+)$') { $ghToken = $Matches[1].Trim() }
}
if (-not $ghToken) {
    $ghToken = Read-Host "GitHub Personal Access Token (repo scope)"
    if (-not $ghToken) { Write-Error "Token required"; exit 1 }
}

$apiHeaders = @{
    Authorization = "token $ghToken"
    Accept        = "application/vnd.github.v3+json"
}

$tagName = "apk-$(Get-Date -Format 'yyyyMMddHHmm')"
Write-Host "Creating GitHub release ($tagName)..."

$releaseResp = Invoke-WebRequest -Uri "https://api.github.com/repos/$Owner/$Repo/releases" `
    -Method POST `
    -Headers ($apiHeaders + @{ "Content-Type" = "application/json" }) `
    -Body (ConvertTo-Json @{ tag_name=$tagName; name="APK $tagName"; draft=$false; prerelease=$false }) `
    -UseBasicParsing -ErrorAction Stop

$release   = $releaseResp.Content | ConvertFrom-Json
$releaseId = $release.id

Write-Host "Uploading APK ($([Math]::Round((Get-Item $ApkPath).Length/1MB,1)) MB)..."

$uploadUrl = "https://uploads.github.com/repos/$Owner/$Repo/releases/$releaseId/assets?name=$AssetName"
$fileBytes = [IO.File]::ReadAllBytes($ApkPath)

Invoke-WebRequest -Uri $uploadUrl -Method POST -Body $fileBytes `
    -Headers ($apiHeaders + @{ "Content-Type" = "application/vnd.android.package-archive" }) `
    -UseBasicParsing -ErrorAction Stop | Out-Null

$downloadUrl = "https://github.com/$Owner/$Repo/releases/latest/download/$AssetName"

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
Write-Host "Download URL: $downloadUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin panel -> site settings -> APK download"
