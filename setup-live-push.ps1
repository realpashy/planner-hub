param(
  [Parameter(Mandatory = $true)]
  [string]$GitHubUsername,

  [Parameter(Mandatory = $true)]
  [string]$GitUserName,

  [Parameter(Mandatory = $true)]
  [string]$GitUserEmail,

  [string]$RepoName = "planner-hub"
)

$ErrorActionPreference = "Stop"

Write-Host "Configuring local git identity..." -ForegroundColor Cyan
git config user.name "$GitUserName"
git config user.email "$GitUserEmail"

$originUrl = "https://github.com/$GitHubUsername/$RepoName.git"

Write-Host "Preparing remote..." -ForegroundColor Cyan
if ((git remote) -contains "origin") {
  git remote set-url origin $originUrl
} else {
  git remote add origin $originUrl
}

git remote remove gitsafe-backup 2>$null

Write-Host "Committing pending setup files..." -ForegroundColor Cyan
git add .

$hasChanges = git status --porcelain
if ($hasChanges) {
  git commit -m "chore: import project and deployment setup"
} else {
  Write-Host "No new changes to commit." -ForegroundColor Yellow
}

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host "Done. If prompted, finish GitHub login in browser." -ForegroundColor Green
