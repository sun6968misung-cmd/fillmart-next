param()

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

$SUPABASE_URL     = ""
$SUPABASE_ANON    = ""
$SUPABASE_SERVICE = ""
$KAKAO_KEY        = ""
$NEXTJS_URL       = "https://pilmart-next.vercel.app"

$EnvFile = Join-Path $Root "..\pilmart-next\.env.local"
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_URL=(.+)$')   { $SUPABASE_URL     = $Matches[1].Trim() }
    if ($_ -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$') { $SUPABASE_ANON = $Matches[1].Trim() }
    if ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=(.+)$')  { $SUPABASE_SERVICE = $Matches[1].Trim() }
    if ($_ -match '^NEXT_PUBLIC_KAKAO_APP_KEY=(.+)$')  { $KAKAO_KEY        = $Matches[1].Trim() }
}

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"

Write-Host ""
Write-Host "=== [1/2] Flutter APK Build ===" -ForegroundColor Cyan

$dartDefines = (
    "--dart-define=SUPABASE_URL=$SUPABASE_URL",
    "--dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON",
    "--dart-define=SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE",
    "--dart-define=KAKAO_APP_KEY=$KAKAO_KEY",
    "--dart-define=NEXTJS_BASE_URL=$NEXTJS_URL"
)

Set-Location $Root
flutter build apk --release @dartDefines
if ($LASTEXITCODE -ne 0) { Write-Error "Flutter build failed"; exit 1 }

Write-Host ""
Write-Host "=== [2/2] Upload to GitHub Releases ===" -ForegroundColor Cyan

& "$Root\upload-apk.ps1"
