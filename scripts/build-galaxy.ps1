# Exporta JSON + build Galaxy 3D para GitHub Pages
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Exportando grafos..." -ForegroundColor Cyan
python (Join-Path $root 'scripts\export-universe-graph.py')

$universe = Join-Path $root 'universe'
Push-Location $universe
try {
  if (-not (Test-Path 'node_modules')) {
    Write-Host "npm install (ignore-scripts)..." -ForegroundColor Cyan
    npm install --ignore-scripts
  }
  Write-Host "vite build -> galaxy/" -ForegroundColor Cyan
  npm run build
} finally {
  Pop-Location
}

Write-Host "Pronto: galaxy/index.html" -ForegroundColor Green
