#!/usr/bin/env bash
# Credify — 1-Click Demo Launcher for Unix/macOS/Linux
# Starts Hardhat Node, Deploys Contracts, Starts API, and Launches Web UI

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT="$(dirname "$DIR")"
cd "$ROOT"

echo "=========================================================="
echo "      Credify — Multi-Lender Credit Protocol Demo         "
echo "=========================================================="
echo ""

# 1. Build Shared Package
echo "[1/4] Ensuring shared packages are built..."
npm run build:shared

# 2. Start Hardhat Node in background
echo "[2/4] Starting Hardhat Local EVM Node on :8545..."
npm run chain:node > hardhat-node.log 2>&1 &
NODE_PID=$!

echo "Waiting for node to initialize..."
sleep 3

# 3. Deploy Contracts
echo "[3/4] Deploying contracts and seeding identities..."
npm run chain:deploy

# Start API in background
echo "Starting Fastify API and Event Indexer on :4100..."
npm run dev:api > api-server.log 2>&1 &
API_PID=$!

sleep 2

# Trap to kill background processes on exit
cleanup() {
  echo ""
  echo "Shutting down Credify services..."
  kill $NODE_PID $API_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Start Web UI in foreground
echo "[4/4] Starting Web UI (Vite on :5173)..."
echo ""
echo "=========================================================="
echo " All services running!"
echo "   • Web Application:     http://localhost:5173"
echo "   • Evaluator Console:   http://localhost:5173/console"
echo "   • API Health Check:    http://localhost:4100/health"
echo "   • Hardhat JSON-RPC:    http://127.0.0.1:8545"
echo " Press Ctrl+C to terminate all services."
echo "=========================================================="
echo ""

npm run dev:web
