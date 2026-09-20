# Credify — 1-Click Demo Launcher for Windows (PowerShell)
# Starts Hardhat Node, Deploys Contracts, Starts API, and Launches Web UI

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Credify — Multi-Lender Credit Protocol Demo         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = Resolve-Path "$PSScriptRoot\.."
Set-Location $ROOT

# 1. Build Shared Package if needed
Write-Host "[1/4] Ensuring shared packages are built..." -ForegroundColor Yellow
npm run build:shared

# 2. Launch Hardhat Node in new window
Write-Host "[2/4] Starting Hardhat Local EVM Node (port 8545)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT'; Write-Host '--- HARDHAT LOCAL EVM NODE (Chain 31337) ---' -ForegroundColor Cyan; npm run chain:node"

# Wait for RPC node to bind port
Write-Host "Waiting 3 seconds for local EVM node to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 3. Deploy Contracts & Launch API in new window
Write-Host "[3/4] Deploying contracts and starting Fastify API (port 4100)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT'; Write-Host '--- CONTRACT DEPLOYMENT & SEEDING ---' -ForegroundColor Cyan; npm run chain:deploy; Write-Host '--- FASTIFY API & EVENT INDEXER ---' -ForegroundColor Cyan; npm run dev:api"

# Wait for API to boot
Write-Host "Waiting 2 seconds for API Gateway..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# 4. Launch Web Frontend in new window
Write-Host "[4/4] Starting Web UI (Vite on port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT'; Write-Host '--- CREDIFY WEB APPLICATION ---' -ForegroundColor Cyan; npm run dev:web"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " All services launched successfully in dedicated windows! " -ForegroundColor Green
Write-Host "   • Web Application:     http://localhost:5173           " -ForegroundColor White
Write-Host "   • Evaluator Console:   http://localhost:5173/console   " -ForegroundColor White
Write-Host "   • API Health Check:    http://localhost:4100/health    " -ForegroundColor White
Write-Host "   • Hardhat JSON-RPC:    http://127.0.0.1:8545           " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
