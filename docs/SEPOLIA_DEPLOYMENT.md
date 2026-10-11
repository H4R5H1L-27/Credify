# Credify: Live Sepolia Testnet Deployment & Rehearsal Runbook

> **Academic Trust Model Disclaimer**  
> Credify is an educational prototype deployed on the Ethereum Sepolia Testnet (`chainId: 11155111`) using test Ether with zero economic value. It demonstrates decentralized credit coordination, allowlisted supplier disbursements, pro-rata waterfall repayment, and deterministic on-chain reputation. Identity verification records approvals on-chain via an authorized verifier role and is not a government ID check or regulated KYC. No mainnet release, financial guarantee, or regulatory compliance is claimed.

---

## 1. Overview & Architecture on Sepolia

The Credify protocol consists of 4 core smart contracts deployed on Ethereum Sepolia:
1. **`KYCRegistry.sol`**: Role-based access control (`Borrower`, `Lender`, `Supplier`) storing salted credential hashes and expiration timestamps.
2. **`ReputationRegistry.sol`**: Authoritative credit score record (0–100 scale), bounded by authorized factory pools.
3. **`LoanFactory.sol`**: Parameterized factory instantiating immutable `LoanPool` agreements.
4. **`LoanPool.sol`**: Self-custody escrow vault enforcing allowlisted supplier spending, pro-rata waterfall claims, and default voting.

```
                    ┌──────────────────────────┐
                    │      Deployer Wallet     │
                    └────────────┬─────────────┘
                                 │ deploy
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ KYCRegistry  │         │ Reputation   │◄────────┤ LoanFactory  │
│              │         │ Registry     │         │              │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                         │ creates
                                                         ▼
                                                  ┌──────────────┐
                                                  │   LoanPool   │
                                                  │ (Escrow Vault│
                                                  └──────────────┘
```

---

## 2. Phase 1: Accounts, RPC & Secret Provisioning

### 2.1 Generating Throwaway Wallets
Never use mainnet wallets or wallets holding real funds. Generate fresh, isolated keys:

```bash
# Generate dedicated throwaway wallets for Sepolia demo
# 1. Deployer Wallet (deploys contracts & seeds gas)
# 2. Verifier Wallet (granted VERIFIER_ROLE for identity attestations)
```

Fund the deployer wallet with at least **0.2 Sepolia ETH** using one of the official faucets:
- [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) (0.05 ETH/day)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com) (0.5 ETH/day with Alchemy account)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

### 2.2 Endpoint & API Keys
1. **Sepolia RPC**: Create an RPC endpoint via [Alchemy](https://dashboard.alchemy.com) or [Infura](https://infura.io), or use the public node fallback:
   `https://ethereum-sepolia-rpc.publicnode.com`
2. **Etherscan API Key**: Generate an API key at [Etherscan.io](https://etherscan.io/myapikey) for automated source code verification.

### 2.3 Secret Safety Protocol
Store secrets exclusively in environment variables or host secret managers (Render / Railway / Vercel). Never commit keys, mnemonics, or `.env` files to the repository.

```bash
# Template for local environment configuration (copy to .env, which is .gitignored)
NETWORK=sepolia
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
SEPOLIA_PRIVATE_KEY="0xYOUR_DEPLOYER_PRIVATE_KEY"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
VERIFIER_ADDRESS="0xYOUR_VERIFIER_WALLET_ADDRESS"
ADMIN_ADDRESS="0xYOUR_ADMIN_WALLET_ADDRESS"
```

---

## 3. Phase 2: Pre-Flight Quality Gate Checklist

Before broadcasting any transaction to Sepolia, verify that all local checks pass:

```bash
# 1. Typecheck all monorepo packages
npm run typecheck

# 2. Run all 33 smart contract tests (100% pass)
npm run test -w contracts

# 3. Run all API & boundary invariant tests
npm run test -w apps/api

# 4. Verify web production build
npm run build -w apps/web
```

---

## 4. Phase 3: Contract Deployment (`npm run chain:deploy:sepolia`)

Execute the deployment script targeting the Sepolia testnet:

```bash
# Execute deployment
npm run chain:deploy:sepolia
```

### What Happens During Deployment:
1. `KYCRegistry` is deployed with deployer as initial admin and verifier.
2. `ReputationRegistry` is deployed.
3. `LoanFactory` is deployed with `KYCRegistry` and `ReputationRegistry` references.
4. `ReputationRegistry` ownership is transferred exclusively to `LoanFactory`.
5. If `VERIFIER_ADDRESS` is provided, `VERIFIER_ROLE` is granted to the dedicated verifier.
6. If `ADMIN_ADDRESS` is provided, admin roles and factory ownership are transferred to the admin.
7. Borrower, 3 Lenders, and 2 Suppliers are registered and verified in `KYCRegistry` for presentation readiness.
8. A presentation-ready sample `LoanPool` is created (10-minute duration, 5-minute funding window, 8% APR).
9. Output manifest is written to `contracts/deployments/sepolia.json`.

---

## 5. Phase 4: Etherscan Verification (`npm run chain:verify:sepolia`)

Publish the Solidity source code and ABI on Sepolia Etherscan for transparent evaluator review:

```bash
# Execute automated verification script
npm run chain:verify:sepolia
```

Verify that all contracts display the green checkmark on Etherscan:
- **`KYCRegistry`**: `https://sepolia.etherscan.io/address/<KYC_ADDRESS>#code`
- **`ReputationRegistry`**: `https://sepolia.etherscan.io/address/<REPUTATION_ADDRESS>#code`
- **`LoanFactory`**: `https://sepolia.etherscan.io/address/<FACTORY_ADDRESS>#code`
- **`LoanPool`**: `https://sepolia.etherscan.io/address/<SAMPLE_POOL_ADDRESS>#code`

---

## 6. Phase 5: Backend API Deployment (Railway / Render / Fly.io)

Deploy `apps/api` with Fastify to a cloud container host:

### Environment Variables for Backend API:
```ini
NETWORK=sepolia
CHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
DEPLOYMENT_FILE=contracts/deployments/sepolia.json
INDEXER_POLL_INTERVAL_MS=4000
INDEXER_REORG_DEPTH=3
VERIFIER_SECRET=your-production-verifier-secret-token
CORS_ORIGIN=https://credify-demo.vercel.app
API_PORT=4100
```

### Health Verification:
```bash
curl https://api.credify-demo.yourdomain.com/health
# Expected Response:
# {
#   "ok": true,
#   "status": "healthy",
#   "network": "sepolia",
#   "chainId": 11155111,
#   "connected": true,
#   "syncLag": 0,
#   "indexerRunning": true
# }
```

---

## 7. Phase 6: Frontend Web Deployment (Vercel / Netlify)

Deploy `apps/web` to Vercel or Netlify:

### Environment Variables for Frontend:
```ini
VITE_NETWORK=sepolia
VITE_API_URL=https://api.credify-demo.yourdomain.com
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
VITE_DEMO_MODE=false
```

### Dual-Network User Experience:
- **Default (Wallet Mode)**: Prompts evaluator to connect MetaMask and switches chain to Sepolia (`#11155111`).
- **Guided Presenter Mode**: Toggled on via header `[Guided Mode]` button to execute transactions via verified demo keys without wallet popups.

---

## 8. Phase 7: Live Presentation Walkthrough Script (8 Minutes)

### Step 1: Trust Model & Concept Intro (1 min)
- Open `/console/trust-model`.
- Point out the trust matrix and explain the verifier's role: the contract trusts allowlisted suppliers, not borrower custody.
- Emphasize: this is an academic demonstration on Sepolia testnet with test ETH.

### Step 2: Natural Language Agreement Creation (2 min)
- Navigate to `/app/borrower/agreements/new`.
- Input natural language terms:
  *"Create a 0.1 ETH research credit facility for 10 minutes at 8% APR with an 0.08 ETH spending limit for BuildRight Supplies."*
- Click **Parse & Review Term Sheet**.
- Show side-by-side original text vs reverse-rendered summary and cryptographic hash binding.
- Click **Deploy Agreement to Blockchain**.
- Show the 5-step transaction lifecycle animation and open the transaction hash on Sepolia Etherscan.

### Step 3: Syndicate Multi-Lender Funding (1.5 min)
- Open the newly deployed agreement (`/app/loans/<POOL_ADDRESS>`).
- Switch persona or connect Meera Capital (`lender-alpha`).
- Contribute `0.06 ETH` (60% allocation).
- Switch persona or connect Northstar Labs (`lender-beta`).
- Contribute `0.04 ETH` (40% allocation).
- Point out automatic state transition from `FUNDING` &rarr; `ACTIVE` on-chain upon reaching 100% target.

### Step 4: Deliberate Negative Tests: Security Guards in Action (1.5 min)
- Switch to Borrower persona (`Aarav Menon`).
- **Negative Test 1 (Unapproved Supplier)**:
  Attempt spend to a non-allowlisted address. Show immediate contract revert with `MerchantNotApproved`.
- **Negative Test 2 (Exceeding Vendor Cap)**:
  Attempt spend exceeding the `0.05 ETH` supplier cap. Show contract revert with `MerchantSpendCapExceeded`.
- **Positive Spend**:
  Execute legitimate `0.03 ETH` spend to BuildRight Supplies for research hardware.
  Show that funds transfer directly to the supplier; the borrower never touches raw principal.

### Step 5: Pro-Rata Repayment & Reputation Trajectory (1 min)
- Borrower executes full repayment (`0.108 ETH` principal + 8% flat interest).
- Lenders Meera Capital and Northstar Labs claim their pro-rata shares via pull payment.
- Navigate to `/app/borrower/reputation`.
- Observe real-time credit score increase (+8 points) recorded on-chain in `ReputationRegistry`.

### Step 6: Technical Console & Deep Transaction Inspection (1 min)
- Open `/console/inspector` and inspect the agreement's storage slots, vault balance decomposition, and the 5-point mathematical invariant checklist.
- Open `/console/transactions` &rarr; click **Explain This Transaction** to show Solidity execution trace, gas economics, and storage slot deltas.

---

## 9. Phase 8: Presentation Fallback Matrix

| Layer | Primary Execution | Fallback 1 (Hot Standby) | Fallback 2 (Offline Safety) |
| :--- | :--- | :--- | :--- |
| **Network** | Live Ethereum Sepolia Testnet | Local Hardhat Node (`chainId: 31337`) with instant mining | Recorded high-definition video walkthrough |
| **Signing** | Guided Presenter Mode (Zero Popups) | MetaMask Injected Wallet with imported test accounts | Pre-indexed event replay in Console |
| **Indexer** | Live polling worker (`INDEXER_POLL_INTERVAL_MS=4000`) | Fast local polling (`100ms`) on Hardhat | Static JSON projection cache |
| **Commands** | `npm run chain:deploy:sepolia` | `npm run chain:deploy` & `npm run chain:node` | Pre-recorded demo runbook walkthrough |
