# Credify — Decentralized Multi-Lender Credit Protocol

> **Autonomous multi-lender credit facilities enforced by EVM smart contracts, deterministic state roots, cryptographic policy restrictions, and a high-contrast Canary Yellow & Crisp White interface.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-black.svg?style=flat&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.17-yellow.svg?style=flat)](https://hardhat.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-green.svg?style=flat&logo=fastify)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![EVM Chain](https://img.shields.io/badge/EVM_Localnet-Chain_31337-purple.svg?style=flat)](http://127.0.0.1:8545)

---

## 📖 Overview

**Credify** is an end-to-end decentralized credit protocol designed for **multi-lender syndication of commercial credit agreements**. It demonstrates how natural language loan agreements transition into immutable, parameterized smart contract escrows with:

- **Syndicated Escrow Pools**: Multiple institutional lenders contribute capital to a unified facility with threshold-activated disbursement locks.
- **Strict Spending Policy Enforcement**: Drawdowns can only be sent to allowlisted merchant addresses. Unauthorized transfers immediately revert on-chain (`MerchantNotApproved()`).
- **Mathematical Pro-Rata Settlements**: Principal and interest repayments are distributed strictly pro-rata according to each lender's contributed capital share, claimable via non-custodial pull payments.
- **On-Chain Reputation Feedback**: Loan outcomes directly update an immutable `ReputationRegistry`, rewarding timely debt service.
- **Real-Time Technical Observability**: Full CQRS event indexing, interactive architecture topology with animated light beams, 3D EVM block stream visualizer, and deterministic state-root inspection.
- **Canary Yellow & Crisp White Design**: High-contrast, accessibility-first theme (`#ffe600` canary yellow accents, `#ffffff` card surfaces, and bold slate typography).

---

## ⚡ Instant Replication Guide

Follow these steps to replicate the entire environment locally in under 3 minutes.

### 📋 Prerequisites
- **Node.js**: `v20.18.0` or `v22.x` (LTS recommended) (`node -v`)
- **npm**: `v10.x+` (`npm -v`)
- **Git**: `v2.30+` (`git --version`)
- **MetaMask** *(Optional)*: Pre-configured demo accounts can also be switched directly in the app UI.

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/H4R5H1L-27/Credify.git
cd Credify
npm install
npm run build:shared
```

---

### 2. Launch the Application Stack

You can launch using the **1-click automated scripts** or manually via **3 separate terminals**:

#### Option A: 1-Click Launch (Recommended)

- **On Windows (PowerShell)**:
  ```powershell
  .\ops\start-demo.ps1
  ```
- **On macOS / Linux**:
  ```bash
  chmod +x ./ops/start-demo.sh
  ./ops/start-demo.sh
  ```

#### Option B: Manual Multi-Terminal Launch

**Terminal 1 — Local Hardhat EVM Node (Port 8545)**:
```bash
npm run chain:node
```
*Starts local EVM RPC at `http://127.0.0.1:8545` (Chain ID `31337`). Keep running.*

**Terminal 2 — Deploy Contracts & Start Fastify API (Port 4100)**:
```bash
# 1. Deploy contracts and seed demo identities:
npm run chain:deploy

# 2. Launch Fastify API and CQRS indexer:
npm run dev:api
```
*API health endpoint: `http://localhost:4100/health`*

**Terminal 3 — Start Web Application (Port 5173)**:
```bash
npm run dev:web
```
*Open your browser and visit: **`http://localhost:5173`***

---

## 🔑 Pre-Configured Test Accounts & Roles

Credify uses Hardhat's standard mnemonic:
`test test test test test test test test test test test junk`

All accounts are pre-funded with **10,000 test ETH** and pre-registered in the protocol:

| Role | Label | Address | Private Key |
| :--- | :--- | :--- | :--- |
| **Deployer / Admin** | Contract Deployer | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Borrower** | Demo Borrower | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Lender 1** | Lender Alpha | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Lender 2** | Lender Beta | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| **Lender 3** | Lender Gamma | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec340f649b836459fa037e40cefef09a0f34f64949038f322f582c4bed` |
| **Supplier 1** | BuildRight Supplies *(Authorized)* | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| **Supplier 2** | TechEquip Logistics *(Authorized)* | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d7b8d88b44ec85844e` |

### 🦊 MetaMask Network Configuration (Optional)
If connecting via MetaMask browser extension:
- **Network Name**: Hardhat Local
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

> **Note**: You can also use the in-app wallet switcher in the top navigation bar to switch between roles without configuring MetaMask.

---

## 🏛️ Monorepo Architecture

```text
Credify/
├── contracts/               # Solidity Smart Contracts (Hardhat 3)
│   ├── contracts/           # LoanFactory, LoanPool, KYCRegistry, ReputationRegistry
│   ├── test/                # Comprehensive contract integration tests
│   └── scripts/deploy.ts    # Deterministic local deployment & seeding script
│
├── apps/api/                # Fastify API Gateway & CQRS Event Indexer
│   ├── src/indexer/         # Ethereum JSON-RPC block scanner & event projection
│   ├── src/routes/          # Agreements, KYC, Telemetry, and Evaluator routes
│   └── src/store/           # Deterministic projection stores & replay engine
│
├── apps/web/                # React 18 + Vite + Tailwind CSS Frontend Application
│   ├── src/components/ui/   # 3D Cards, Isometric Block Stream, Confetti, NumberTickers
│   ├── src/components/console/ # Architecture Topology, Block Inspector, Trace Engine
│   ├── src/pages/borrower/  # Borrower portal: create agreements, disburse, repay
│   ├── src/pages/lender/    # Lender portal: discover opportunities, syndicate, claim
│   └── src/pages/console/   # Technical console: blocks, contracts, events, replay
│
├── packages/shared/         # Zod schemas, TypeScript types, and domain contracts
├── docs/                    # Architecture blueprint, API contracts, and UI guides
├── ops/                     # Automated demo launcher scripts (PowerShell & Bash)
└── SETUP_GUIDE.md           # Frictionless setup instructions for presentations
```

---

## 🎯 Key Technical Capabilities

### 1. Zero Arbitrary Code Generation
Natural language terms are parsed into an audited, parameterized term sheet. The factory creates instances of pre-audited bytecode (`LoanPool.sol`), guaranteeing zero risk of unvetted smart contract execution.

### 2. High-Performance UI Micro-Interactions & 3D Assets
- **Interactive 3D Cards (`Card3D`)**: Real-time perspective tilt with floating parallax Z-layers for agreement term sheets.
- **3D Isometric Block Stream**: Axonometric 3D projection of mined EVM blocks with animated cryptographic parent-hash vector beams.
- **3D EVM Block Cube**: CSS 3D block cube rendering 6 facets of authoritative node telemetry (block height, Merkle root, gas gauge, consensus seals).
- **System Topology Canvas**: Animated SVG linear light pulses connecting execution strata in real-time.
- **HTML5 Canvas Confetti Engine**: Multi-shape particle celebrations upon milestone confirmations.

### 3. Evaluator Console
Built specifically for hackathons, evaluators, and engineers to inspect what is actually happening on the blockchain:
- **`http://localhost:5173/console/architecture`**: Live multi-tier system topology.
- **`http://localhost:5173/console/blockchain`**: Interactive 3D blocks and transaction roots.
- **`http://localhost:5173/console/contracts`**: Smart contract storage, bytecode, and interface inspector.
- **`http://localhost:5173/console/replay`**: Step-by-step transaction state replay.

---

## 🧪 Quality Gates & Verification

```bash
# Verify TypeScript strict type-checking across all packages
npm run typecheck

# Run smart contract test suite (9 passing tests)
npm test -w contracts

# Build production artifacts for all packages and web app
npm run build:shared
npm run build -w apps/web
```

---

## 📄 License

MIT License. Designed for academic demonstration and research into autonomous multi-lender credit protocols.
