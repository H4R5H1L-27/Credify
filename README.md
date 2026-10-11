# Credify — Decentralized Multi-Lender Credit Protocol

> **Academic-grade, deployable Sepolia demonstration of a multi-lender syndicated credit protocol featuring cryptographic agreement binding, allowlisted supplier drawdowns, pro-rata waterfall repayment, deterministic reputation scoring, EIP-1167 minimal proxy cloning, and a comprehensive pedagogical Technical Console.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-black.svg?style=flat&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.17-yellow.svg?style=flat)](https://hardhat.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-green.svg?style=flat&logo=fastify)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![EVM Networks](https://img.shields.io/badge/EVM-Localnet_(31337)_|_Sepolia_(11155111)-purple.svg?style=flat)](https://sepolia.etherscan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Protocol Overview

**Credify** solves a core challenge in commercial decentralized finance: **multi-lender commercial credit syndication with trust-minimized capital controls and transparent repayment distribution**.

Designed as a showcase for a blockchain course, the protocol ensures that capital committed to a commercial borrower cannot be diverted or siphoned, debt service flows deterministically to syndicate lenders, and credit reputation is permanently recorded on-chain.

### Core Architectural Pillars
1. **Syndicated Escrow Pools (`LoanPool.sol`)**: Multi-lender coordination without custodial intermediaries. Lenders commit capital toward an all-or-nothing funding target within a strictly enforced `fundingDeadline`. Underfunded pools unlock immediate 100% principal refunds via `cancelUnfunded()`.
2. **On-Chain Spending Controls**: Loan principal is locked directly inside the smart contract vault. Drawdowns can only be disbursed to pre-approved, KYC-verified supplier addresses (`merchants`) up to individual caps (`merchantCapWei`) and a global spend limit (`maxSpendWei`). Unauthorized transfers revert on-chain (`MerchantNotApproved()` or `MerchantSpendCapExceeded()`).
3. **Non-Locking Pro-Rata Waterfall (`distributable()`)**: Lenders claim repayments strictly proportional to their contributed principal. When a loan is repaid or defaulted, any unspent principal automatically returns to lenders pro-rata, guaranteeing that **no capital is ever trapped or locked in the contract**.
4. **Deterministic Credit Reputation (`ReputationRegistry.sol`)**: Timely debt service awards on-chain credit reputation (+8 pts on repayment), while defaults incur severe penalties (-20 pts).
5. **Cryptographic Agreement Binding (`agreementHash`)**: Written agreements are canonicalized and hashed (`keccak256`), with the digest immutably committed on-chain. The UI cryptographically verifies agreement integrity against the ledger.
6. **Strict Architectural Separation**:
   - **Product Area (`/app`)**: Clean, institutional interface for Borrowers, Syndicate Lenders, and Suppliers. Contains zero chain-internal widgets.
   - **Technical Showcase Console (`/console`)**: Technical deep-dive featuring live transaction EVM storage/gas explainers, on-chain loan state inspection, an interactive pro-rata sandbox, and full threat model analysis.

---

## ⚡ Quickstart Guide

The protocol runs simultaneously on **Local Hardhat (Chain 31337)** as the zero-latency presentation fallback, and on the public **Ethereum Sepolia Testnet (Chain 11155111)**.

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (`node -v`)
- **npm**: `v10.x+` (`npm -v`)
- **Git**: `v2.30+`

---

### Option A: 1-Command Automated Startup (Localhost Demo)

Clone and install dependencies:
```bash
git clone https://github.com/H4R5H1L-27/Credify.git
cd Credify
npm install
npm run build:shared
```

Launch the entire stack (Hardhat EVM node, smart contracts deployer, scenario seeder, Fastify API indexer, and Vite React frontend) with a single script:

- **Windows (PowerShell)**:
  ```powershell
  .\ops\start-demo.ps1
  ```
- **macOS / Linux (Bash)**:
  ```bash
  chmod +x ./ops/start-demo.sh
  ./ops/start-demo.sh
  ```

---

### Option B: Manual Multi-Terminal Startup

#### Terminal 1 — Local EVM Node (Port 8545)
```bash
npm run chain:node
```
*Starts local JSON-RPC at `http://127.0.0.1:8545` (Chain ID `31337`).*

#### Terminal 2 — Deploy Contracts & Seed Scenarios
```bash
npm run chain:deploy:local
```
*Deploys `KYCRegistry`, `ReputationRegistry`, `LoanFactory`, and seeds demo loans across all 5 protocol lifecycle states.*

#### Terminal 3 — Backend API Gateway & Continuous Indexer (Port 4100)
```bash
npm run api:dev
```
- Health Check: `http://localhost:4100/health`
- Prometheus Metrics: `http://localhost:4100/api/v1/observability/metrics`

#### Terminal 4 — Frontend Web Application (Port 5173 / 3000)
```bash
npm run web:dev
```
*Access the application at `http://localhost:3000` or `http://localhost:5173`.*

---

## 🌐 Navigating the Application

The web interface is divided into two distinct areas:

### 1. Product Area (`/app`)
- **Borrower Portal (`/app/borrower`)**: Author natural language credit terms, view validated parameters and cryptographic commitments, trigger allowlisted supplier drawdowns, and repay outstanding debt.
- **Lender Portal (`/app/lender`)**: Discover syndication opportunities, commit capital to funding pools, monitor repayment performance, and claim pro-rata dividends and refunds.
- **Supplier Portal (`/app/supplier`)**: Review allowlisted vendor status and track incoming drawdowns.
- **Identity & Verification (`/app/identity`)**: Check KYC credential hash commitments, role assignments, and expiration timestamps.

### 2. Technical Showcase Console (`/console`)
- **Transaction Explainer (`/console/transactions`)**: Step-by-step breakdown of on-chain operations showing EVM storage slot transitions, SSTORE/SLOAD gas footprints, security guards enforced, and decoded event logs.
- **Loan State Inspector (`/console/inspector`)**: Real-time audit of loan vault solvency, capital reserve breakdown, per-lender shares, and mathematical protocol invariant verification.
- **Core Concepts Sandbox (`/console/concepts`)**: Interactive pro-rata waterfall simulator and EIP-1167 proxy gas comparison.
- **Trust & Threat Model (`/console/trust-model`)**: Comprehensive specification of trust boundaries, semi-trusted verifier responsibilities, and 6-vector formal attack analysis.

---

## 🎭 Guided Presenter Mode vs. Wallet Mode

In the header of the web application:
- **MetaMask Wallet Mode (Default)**: Standard Web3 flow for grading and inspection. User confirms every transaction directly in MetaMask using Hardhat or Sepolia accounts.
- **Guided Presenter Mode**: Click the **"Guided Demo Mode"** switcher in the header. Instantly switch between 7 verified personas without wallet popup delays:
  - **Aarav Menon** (`borrower`): Creates loans, triggers supplier spends, repays debt.
  - **Meera Capital** (`lender-alpha`): Lead syndicate lender (60% pool share), votes default.
  - **Northstar Labs** (`lender-beta`): Syndicate participant (40% pool share), claims refunds.
  - **Blue Oak Partners** (`lender-gamma`): Syndicate participant lender.
  - **BuildRight Supplies** (`merchant-a`): Allowlisted supplier for materials & hardware.
  - **StudioGrid Equipment** (`merchant-b`): Allowlisted supplier for precision gear.
  - **Credify Operator** (`operator`): Protocol deployer and KYC identity verifier.

---

## 🚀 Sepolia Testnet Deployment

To deploy and execute on the public Ethereum Sepolia testnet (`chainId: 11155111`):

1. **Configure Environment Variables** in `contracts/.env`:
   ```ini
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   DEPLOYER_PRIVATE_KEY=0xYOUR_SEPOLIA_PRIVATE_KEY
   ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
   ```

2. **Deploy Smart Contracts**:
   ```bash
   npm run deploy:sepolia
   ```
   *Generates deployment manifest in `contracts/deployments/sepolia.json` with scaled demo terms (0.1 ETH target).*

3. **Verify Contracts on Etherscan**:
   ```bash
   npm run verify:sepolia
   ```

4. **Launch Backend & Frontend for Sepolia**:
   ```bash
   NETWORK=sepolia SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY npm run api:dev
   VITE_NETWORK=sepolia npm run web:dev
   ```

*See [docs/SEPOLIA_DEPLOYMENT.md](docs/SEPOLIA_DEPLOYMENT.md) for the complete 9-phase operational guide and live presentation rehearsal script.*

---

## 🔬 Academic Stretch Features (Work Package 11)

### 1. EIP-1167 Minimal Proxy Clones (`Clones.clone`)
- **Implementation**: Master contract [`LoanPoolCloneable.sol`](contracts/contracts/clones/LoanPoolCloneable.sol) cloned via [`LoanPoolCloneFactory.sol`](contracts/contracts/clones/LoanPoolCloneFactory.sol).
- **Gas Benchmark Results** ([`docs/EIP1167_GAS_ANALYSIS.md`](docs/EIP1167_GAS_ANALYSIS.md)):
  - Direct instantiation (`new LoanPool`): **2,787,646 gas**
  - EIP-1167 Cloned pool (`Clones.clone`): **580,339 gas**
  - **Net Deployment Gas Reduction: 79.18% (>2.2 Million gas saved per pool)**

### 2. Sybil-Resistant Weighted Reputation Scoring
- **Implementation**: [`WeightedReputationRegistry.sol`](contracts/contracts/reputation/WeightedReputationRegistry.sol).
- **Anti-Farming Defense** ([`docs/REPUTATION_WEIGHTING.md`](docs/REPUTATION_WEIGHTING.md)): Defends against wash-loan attacks where an attacker cycles self-funded micro-loans to reach a 100 score before defaulting on a large loan. Points are scaled by principal volume tiers, and maximum attainable reputation is hard-capped by counterparty lender diversity ($< 2$ lenders capped at 65; $< 4$ lenders capped at 80).

### 3. Mock ERC-20 Stablecoin (`MockUSDC.sol`)
- Standard 6-decimal mock token with public testnet faucet (`mint(to, amount)`) for simulating stablecoin syndicated facilities.

---

## 🛡️ Trust Model & Academic Disclaimers

- **Plain Wording**: An authorized verifier reviews a submitted profile and records approval on-chain; this is not a government ID check or regulated KYC; the deployment runs on the Sepolia testnet with test ETH.
- **No Regulated Claims**: Credify does not claim regulatory compliance, third-party security audits, mainnet deployment, or real-money use.
- **Formal Invariants Enforced**:
  - *Vault Solvency*: Sum of all lender claims never exceeds pool deposits plus repaid interest.
  - *Spend Discipline*: Zero disbursement can occur to unapproved addresses or in excess of per-merchant caps.
  - *Non-Custodial Design*: Neither the borrower nor platform administrators hold custody of lender funds.
  - *Pull-Payment Safety*: External calls are isolated using OpenZeppelin `ReentrancyGuard` and pull-payment patterns.

---

## 🧪 Testing & Verification

```bash
# Run all 44 smart contract tests (including EIP-1167 benchmarks and Sybil tests)
npm test -w @credify/contracts

# Run contract code coverage (Pool: 97.4%, Factory: 100%, KYC: 95.4%)
npm run test:coverage -w @credify/contracts

# Run static analysis
npm run slither -w @credify/contracts

# Run all API, parser, and boundary validation tests (29 test suites)
npm test -w @credify/api

# Strict monorepo typecheck (0 errors across 4 packages)
npm run typecheck

# Production build test
npm run build -w apps/web
```

---

## 📁 Monorepo Structure

```text
Credify/
├── contracts/               # Solidity Smart Contracts (0.8.24, OpenZeppelin 5.x)
│   ├── contracts/           # LoanFactory, LoanPool, KYCRegistry, ReputationRegistry
│   ├── contracts/clones/    # EIP-1167 Cloneable variant and Factory
│   ├── contracts/reputation/# Sybil-resistant WeightedReputationRegistry
│   ├── contracts/token/     # MockUSDC ERC-20 stablecoin
│   ├── test/                # 44 Mocha/Ethers tests & gas benchmarks
│   └── scripts/             # deploy.ts, verify.ts
│
├── apps/api/                # Fastify Backend & Continuous Chain Indexer
│   ├── src/chain/           # Client abstraction, continuous polling indexer & reorg recovery
│   ├── src/services/        # Dual LLM / deterministic parser & scenario seeder
│   └── src/store/           # Atomic JSON projection persistence
│
├── apps/web/                # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/pages/           # Clean product area (/app) & Technical Console (/console)
│   ├── src/components/      # Console teaching drawers, inspectors, and UI components
│   └── src/context/         # WalletContext and IdentityContext (Guided Presenter Mode)
│
├── packages/shared/         # Zod schemas, contract ABIs, and demo accounts
├── docs/                    # Architecture decisions (ADR-001 to ADR-011), Quality, Runbooks
└── ops/                     # Automated demo launcher scripts (PowerShell & Bash)
```

---

## 📄 License

MIT License. Designed for academic demonstration, grading, and decentralized credit protocol research.
