# Credify - 1-Click Demo Launcher for Windows (PowerShell)
# Starts Hardhat Node, Deploys Contracts, Starts API, and Launches Web UI

$ErrorActionPreference = 'Stop'

Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '      Credify - Multi-Lender Credit Protocol Demo         ' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host ''

$ROOT = (Get-Item -Path "$PSScriptRoot\..").FullName
Set-Location $ROOT

# 1. Build Shared Package if needed
Write-Host '[1/4] Ensuring shared packages are built...' -ForegroundColor Yellow
npm run build:shared

# 2. Launch Hardhat Node in new window
Write-Host '[2/4] Starting Hardhat Local EVM Node (port 8545)...' -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT'; Write-Host '--- HARDHAT LOCAL EVM NODE (Chain 31337) ---' -ForegroundColor Cyan; npm run chain:node"

# Poll until RPC node is actively listening
Write-Host 'Waiting for local EVM node (http://127.0.0.1:8545) to accept connections...' -ForegroundColor Gray
$evmReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', 8545)
        $tcp.Close()
        $evmReady = $true
        break
    } catch {
        # continue waiting
    }
}

if (-not $evmReady) {
    Write-Host 'WARNING: EVM Node took longer than expected to bind port 8545. Proceeding with deployment...' -ForegroundColor Yellow
} else {
    Write-Host 'EVM Node is ready!' -ForegroundColor Green
}

# 3. Deploy Contracts & Seed Scenarios synchronously in current console so errors are immediately visible
Write-Host '[3/5] Deploying contracts and seeding demo scenarios on-chain...' -ForegroundColor Yellow
npm run chain:deploy

# 4. Launch Fastify API Gateway in new window
Write-Host '[4/5] Starting Fastify API Gateway & Continuous Event Indexer (port 4100)...' -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT'; Write-Host '--- FASTIFY API & EVENT INDEXER (Port 4100) ---' -ForegroundColor Cyan; npm run dev:api"

# Poll until API is listening
Write-Host 'Waiting for API Gateway (http://127.0.0.1:4100) to accept connections...' -ForegroundColor Gray
$apiReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', 4100)
        $tcp.Close()
        $apiReady = $true
        break
    } catch {
        # continue waiting
    }
}

if (-not $apiReady) {
    Write-Host 'WARNING: API took longer than expected to bind port 4100. Launching Web UI...' -ForegroundColor Yellow
} else {
    Write-Host 'API Gateway is ready!' -ForegroundColor Green
}

# 5. Launch Web Frontend in new window
Write-Host '[5/5] Starting Web UI (Vite on port 5173)...' -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', "Set-Location '$ROOT'; Write-Host '--- CREDIFY WEB APPLICATION (Port 5173) ---' -ForegroundColor Cyan; npm run dev:web"

Write-Host ''
Write-Host '==========================================================' -ForegroundColor Green
Write-Host ' All services launched successfully!                      ' -ForegroundColor Green
Write-Host '   - Web Application:     http://localhost:5173           ' -ForegroundColor White
Write-Host '   - Evaluator Console:   http://localhost:5173/console   ' -ForegroundColor White
Write-Host '   - API Health Check:    http://localhost:4100/health    ' -ForegroundColor White
Write-Host '   - Hardhat JSON-RPC:    http://127.0.0.1:8545           ' -ForegroundColor White
Write-Host '==========================================================' -ForegroundColor Green
