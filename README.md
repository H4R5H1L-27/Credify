# Credify — Decentralized Multi-Lender Credit Protocol

> **Autonomous multi-lender credit facilities enforced by EVM smart contracts, deterministic state roots, and cryptographic policy restrictions.**

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

---

## ⚡ Quick Demo Launch

Looking to run this project on your computer right away? **See the [Complete Setup & Demo Guide](SETUP_GUIDE.md)** for 1-click launch scripts and step-by-step presentation walkthroughs.

```bash
# 1. Clone & install
git clone https://github.com/H4R5H1L-27/Credify.git
cd Credify
npm install
npm run build:shared

# 2. Windows 1-Click Launch:
.\ops\start-demo.ps1

# Or macOS / Linux 1-Click Launch:
chmod +x ./ops/start-demo.sh && ./ops/start-demo.sh
```

Then visit **`http://localhost:5173`** in your browser.

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

## 🔑 Pre-Seeded Demo Identities

Credify runs on Hardhat's default mnemonic (`test test test test test test test test test test test junk`). All identities are pre-funded with 10,000 ETH:

| Role | Account Name | Address |
| :--- | :--- | :--- |
| **Borrower** | Demo Borrower | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Lender 1** | Lender Alpha | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| **Lender 2** | Lender Beta | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| **Merchant 1** | BuildRight Supplies *(Authorized)* | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` |
| **Merchant 2** | TechEquip Logistics *(Authorized)* | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` |

*(Private keys available in [SETUP_GUIDE.md](SETUP_GUIDE.md))*

---

## 🧪 Quality Gates & Verification

```bash
# Verify TypeScript strict type-checking across all packages
npm run typecheck

# Run smart contract tests and API integration suite
npm test

# Build production artifacts for all packages and web app
npm run build
```

---

## 📄 License

MIT License. Designed for academic demonstration and research into autonomous multi-lender credit protocols.
