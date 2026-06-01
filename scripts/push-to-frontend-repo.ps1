# Push local client code to https://github.com/Akhilesh2006s/Viswam-LMS-Frontend
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\push-to-frontend-repo.ps1

$ErrorActionPreference = "Stop"
$client = Split-Path $PSScriptRoot -Parent
$clone = Join-Path $env:TEMP "viswam-frontend-push"
$remote = "https://github.com/Akhilesh2006s/Viswam-LMS-Frontend.git"

if (Test-Path $clone) { Remove-Item $clone -Recurse -Force }
git clone $remote $clone
robocopy $client $clone /E /XD node_modules .git /XF .env /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
cd $clone
git add -A
if (-not (git diff --cached --quiet)) {
  git commit -m "Sync from local Vishwam LMS client."
  git push origin main
  Write-Host "Pushed to $remote" -ForegroundColor Green
} else {
  Write-Host "No changes to push." -ForegroundColor Yellow
}
