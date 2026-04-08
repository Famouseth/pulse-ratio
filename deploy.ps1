# Deploy PulseRatio
# Run this script once from the project root after installing GitHub CLI and Vercel CLI.
# Prerequisites:
#   - npm install --ignore-scripts (already done)
#   - gh CLI installed (already present)
#   - vercel CLI installed (already present)

param (
  [string]$RepoName = "pulse-ratio",
  [string]$RepoDescription = "Real-time BTC vs ETH TVL and LP Bonding Dashboard",
  [switch]$Private = $false
)

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Step 1: GitHub Login ===" -ForegroundColor Cyan
gh auth login

Write-Host ""
Write-Host "=== Step 2: Create GitHub Repository ===" -ForegroundColor Cyan
$visibility = if ($Private) { "--private" } else { "--public" }
gh repo create $RepoName --description $RepoDescription $visibility --source . --remote origin --push

Write-Host ""
Write-Host "=== Step 3: Vercel Login ===" -ForegroundColor Cyan
vercel login

Write-Host ""
Write-Host "=== Step 4: Link and Deploy to Vercel ===" -ForegroundColor Cyan
vercel --yes --prod

Write-Host ""
Write-Host "=== Step 5: Copy Vercel IDs for GitHub Actions ===" -ForegroundColor Cyan
vercel env pull .vercel/.env.production.local
$projectJson = Get-Content ".vercel/project.json" -Raw | ConvertFrom-Json
$orgId    = $projectJson.orgId
$projectId = $projectJson.projectId

Write-Host ""
Write-Host "Add these secrets in your GitHub repo Settings > Secrets > Actions:" -ForegroundColor Yellow
Write-Host "  VERCEL_TOKEN     = <your token from https://vercel.com/account/tokens>" -ForegroundColor Yellow
Write-Host "  VERCEL_ORG_ID    = $orgId" -ForegroundColor Yellow
Write-Host "  VERCEL_PROJECT_ID = $projectId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Done! Future pushes to main/master will auto-deploy via GitHub Actions." -ForegroundColor Green
