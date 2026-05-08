$ErrorActionPreference = "SilentlyContinue"
Set-Location -LiteralPath "D:\hyper evm\hyper-evm-hub"

function Test-LocalSite {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

if (Test-LocalSite) {
  Start-Process "http://localhost:3000"
  Write-Host "HyperEVM Hub is already running at http://localhost:3000"
  Write-Host "Browser opened. You can close this window."
  return
}

Start-Process "http://localhost:3000"
npm run dev -- --port 3000
