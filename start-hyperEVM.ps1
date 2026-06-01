$ErrorActionPreference = "SilentlyContinue"
Set-Location -LiteralPath "D:\hyper evm\hyper-evm-hub"

function Test-LocalSite {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 8
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

$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($port3000) {
  $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($port3000.OwningProcess)"
  Write-Host "Port 3000 is already in use by process $($port3000.OwningProcess)."
  if ($owner.CommandLine) {
    Write-Host $owner.CommandLine
  }
  Start-Process "http://localhost:3000"
  Write-Host "Browser opened for the existing process. Close the old HyperEVM terminal first if you want a clean restart."
  return
}

$openWhenReadyScript = @'
$ErrorActionPreference = "SilentlyContinue"

function Test-LocalSiteReady {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

for ($attempt = 0; $attempt -lt 120; $attempt++) {
  if (Test-LocalSiteReady) {
    Start-Process "http://localhost:3000"
    exit 0
  }
  Start-Sleep -Seconds 1
}

Start-Process "http://localhost:3000"
'@

$encodedOpenWhenReadyScript = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($openWhenReadyScript))
Start-Process powershell.exe -WindowStyle Hidden -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $encodedOpenWhenReadyScript
Write-Host "Starting HyperEVM Hub. Browser will open after http://localhost:3000 is ready."
npm run dev:full
