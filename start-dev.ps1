Param()
Write-Host "Running from project root: $(Get-Location)"
if (-not (Test-Path -Path .\package.json)) {
  Write-Error "package.json not found. Run this from the project root."
  exit 1
}
Write-Host "Installing dependencies..."
npm install
Write-Host "Starting dev server..."
Start-Process -FilePath "npm" -ArgumentList "run dev"
Write-Host "Dev server started — open http://localhost:5173 (or the URL printed by Vite)."
