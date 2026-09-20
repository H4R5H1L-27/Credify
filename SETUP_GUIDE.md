# Credify — Complete Setup & Demo Guide

This guide provides everything needed to clone, install, configure, and demonstrate **Credify** on any computer (macOS, Windows, or Linux) with zero friction.

---

## 📋 System Requirements

Ensure the host computer has the following installed:

| Tool | Minimum Version | Check Command |
| :--- | :--- | :--- |
| **Node.js** | `v20.18.0` or `v22.x` (LTS recommended) | `node -v` |
| **npm** | `v10.x+` | `npm -v` |
| **Git** | `v2.30+` | `git --version` |
| **Web Browser** | Modern Chrome, Brave, Edge, or Firefox | — |
| **MetaMask** *(Optional)* | Latest browser extension | Optional (built-in wallet switching available) |

---

## ⚡ Quick Start (The Fast Track)

### 1. Clone the Repository

```bash
git clone https://github.com/H4R5H1L-27/Credify.git
cd Credify
```

### 2. Install Dependencies & Build Shared Code

```bash
npm install
npm run build:shared
```

---

## 🚀 Running the Demo (2 Options)

### Option A: 1-Click Launch Scripts (Recommended)

#### On Windows (PowerShell):
```powershell
.\ops\start-demo.ps1
```
*This automatically launches the Hardhat EVM Node, deploys the contracts, starts the API backend, and launches the Vite Web UI in coordinated terminal windows.*

#### On macOS / Linux:
```bash
chmod +x ./ops/start-demo.sh
./ops/start-demo.sh
```

---

### Option B: Manual Multi-Terminal Launch

If you prefer standard separate terminals:

#### Terminal 1 — Start the Local EVM Node (Port 8545)
```bash
npm run chain:node
```
*Leave this running. It starts a local Hardhat node on `http://127.0.0.1:8545` with Chain ID `31337` and automine enabled.*

#### Terminal 2 — Deploy Contracts & Start Fastify API (Port 4100)
```bash
# 1. Deploy the smart contracts & seed initial test identities:
npm run chain:deploy

# 2. Launch the backend API & real-time CQRS event indexer:
npm run dev:api
```
*Verify API health anytime at: `http://localhost:4100/health`*

#### Terminal 3 — Launch the Frontend Web Application (Port 5173)
```bash
npm run dev:web
```
*Open your browser and navigate to: **`http://localhost:5173`***

---

## 🔑 Pre-Configured Test Accounts & Roles

Credify runs on the standard Hardhat mnemonic:
```text
test test test test test test test test test test test junk
```

All roles below are pre-funded with 10,000 test ETH and pre-registered in the `KYCRegistry`:

| Role | Account Name | Address | Private Key |
| :--- | :--- | :--- | :--- |
| **Deployer / Admin** | Contract Deployer | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Borrower** | Demo Borrower | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Lender 1** | Lender Alpha | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Lender 2** | Lender Beta | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| **Lender 3** | Lender Gamma | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec340f649b836459fa037e40cefef09a0f34f64949038f322f582c4bed` |
| **Merchant 1** | BuildRight Supplies (Authorized) | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| **Merchant 2** | TechEquip Logistics (Authorized) | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0x92db14e403b83dde34288138337a22a135b01de51368bb25f3c9f87110b052d6` |

> 💡 **Tip:** You do not even need MetaMask to test the core flows! The app features a built-in **Evaluator Console** (`/console/evaluator`) and identity switchers that allow simulating any persona with 1 click.

---

## 🦊 Optional: MetaMask Configuration

If presenting with real wallet interactions:

1. Open **MetaMask** $\rightarrow$ **Settings** $\rightarrow$ **Networks** $\rightarrow$ **Add Network Manually**:
   - **Network Name:** `Credify Localnet`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. Import any of the Private Keys from the table above (e.g., Borrower or Lender Alpha).

---

## 🎬 Suggested 5-Minute Presentation Flow

Follow this script for a presentation:

### Step 1: Landing Page & Architectural Vision (`/`)
- Showcase the hero section, calibrated dark glass aesthetic (`#0C0E14`), and the interactive **3D Multi-Lender Lifecycle Card** (tilt card with mouse).
- Highlight the **Dynamic Dot Grid Matrix** and live protocol benchmark counters.

### Step 2: Natural Language Contract Parameterization (`/app/borrower/new`)
- Switch to the **Borrower** role.
- Input a plain English loan request:
  > *"Create a 10 ETH facility for 14 days at 8% APR, capped at 8 ETH for merchant spending with BuildRight Supplies."*
- Demonstrate how the client parses natural language into an exact, audited `LoanPool` contract parameter specification (preventing unauthorized Solidity execution).
- Submit and sign transaction: triggers contract deployment and emits `LoanCreated` event.

### Step 3: Multi-Lender Syndication (`/app/lender/opportunities`)
- Switch to **Lender Alpha** (`0x3C44...`) and fund **6.00 ETH** (60%).
- Switch to **Lender Beta** (`0x90F7...`) and fund **4.00 ETH** (40%).
- Show the automatic threshold activation: the escrow state transitions from `FUNDING` $\rightarrow$ `ACTIVE`, unlocking the borrower's drawdown line.

### Step 4: Policy-Enforced Merchant Spending (`/app/borrower/agreements/:id`)
- Switch to **Borrower**.
- **Approved Merchant**: Request a 2.50 ETH disbursement to *BuildRight Supplies*. The smart contract verifies the allowlist and executes transfer.
- **Unapproved Merchant Demo**: Attempt to disburse to an arbitrary address. Show the EVM transaction revert with custom error `MerchantNotApproved()`, demonstrating cryptographic code enforcement.

### Step 5: Pro-Rata Repayment & Reputation Upgrade
- Borrower repays 10.80 ETH (Principal + 8% APR interest).
- Switch to **Lender Alpha**: Show the calculated pro-rata dividend (60% share = 6.48 ETH) available for non-custodial pull claim.
- Point out the Borrower's updated on-chain reputation score: verified via `ReputationRegistry` (+8 points).

### Step 6: Technical Evaluator Console (`/console/overview`)
- Navigate to the **Technical Console**:
  - **Topology View (`/console/architecture`)**: Live multi-strata architecture canvas with animated SVG light beams highlighting execution pathways.
  - **Blockchain Blocks (`/console/blockchain`)**: Inspect the **Interactive 3D EVM Block Cube** and toggle the **3D Isometric Chained Block Stream** showing block $N \rightarrow N-1$ cryptographic parent-hash beams.
  - **Contract Inspector (`/console/contracts`)**: Deep-dive into deployed bytecode, storage slots, and event logs.
  - **Transaction Replay (`/console/replay`)**: Step-by-step playback of state transitions with CQRS receipts.

---

## 🛠️ Verification & Quality Gates

Run these commands in the terminal to verify the entire codebase:

```bash
# 1. Typecheck all workspaces (contracts, shared, api, web)
npm run typecheck

# 2. Run smart contract and API unit tests
npm test

# 3. Production build test
npm run build
```

---

## ❓ Troubleshooting & FAQ

### Port Already in Use (8545, 4100, or 5173)?
If a previous process is holding a port:
- **Windows (PowerShell):**
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8545).OwningProcess | Stop-Process -Force
  Get-Process -Id (Get-NetTCPConnection -LocalPort 4100).OwningProcess | Stop-Process -Force
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
  ```
- **macOS / Linux:**
  ```bash
  lsof -ti:8545,4100,5173 | xargs kill -9
  ```

### Resetting the Demo to a Clean Slate
To reset all state, contract deployments, and in-memory CQRS indexes:
```bash
npm run demo:reset
npm run chain:deploy
```

### MetaMask Nonce Error ("Nonce too high" or "Transaction failed")?
When restarting a local Hardhat node, MetaMask's internal transaction count is out of sync:
1. In MetaMask, go to **Settings** $\rightarrow$ **Advanced**.
2. Click **Clear activity and nonce data** (or **Reset account**).
3. Refresh the browser page.
