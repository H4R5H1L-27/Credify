# Credify Quality & Verification Baseline (WP0)

This document establishes the initial testing, code coverage, gas consumption, and static analysis baseline for the Credify protocol contracts prior to refactoring in Work Packages WP1 through WP11.

---

## 1. Test Suite Results

The initial test suite was expanded from 9 baseline tests to **17 comprehensive tests** covering all revert paths, lifecycle events, reentrancy vectors, and edge cases on the contracts.

- **Test Runner**: Hardhat v3.17 with Mocha & Ethers (`@nomicfoundation/hardhat-toolbox-mocha-ethers`)
- **Total Tests**: 17
- **Passing**: 17 (100%)
- **Failing**: 0
- **Duration**: ~7 seconds

### Test Inventory
1. `instantiates a parameterized pool and authorizes it in reputation`: Verifies initial parameter bindings and automatic reputation authorization.
2. `rejects unverified lender and activates exactly at target`: Verifies KYC gating on lender contributions and exact-target activation transition.
3. `rejects borrower attempting to contribute to their own syndicate pool`: Verifies `BorrowerCannotContribute` revert.
4. `activates contract through incremental multi-lender contributions`: Multi-lender funding ladder (4 ETH -> 7 ETH -> 10 ETH) with accounting assertions.
5. `enforces merchant restrictions and spend limits on-chain`: Gated spend checks, unapproved merchant rejection, spend cap enforcement.
6. `tracks repayments and distributes claims pro-rata`: Verifies partial and full repayment accounting with pro-rata claims and reputation reward.
7. `guarantees three lenders with different contribution amounts receive correctly proportional claims`: Strict multi-party proportional share verification.
8. `requires a contributed-weighted majority for default`: Multi-party voting past maturity; default quorum crossing triggers `Status.Defaulted` and borrower penalty.
9. `expires underfunded pools and returns contributions`: Pool cancellation after maturity and refund claiming.
10. `enforces cancelUnfunded timing, refund path, double refund, and event emission`:
    - Rejection before maturity with `FundingNotExpired`
    - Successful cancellation after maturity with `FundingCancelled`
    - Double cancellation rejection with `FundingClosed`
    - Non-contributor refund rejection with `NothingToClaim`
    - Contribution refund transfer and `FundingRefunded` event
    - Double refund rejection with `AlreadyRefunded`
11. `rejects double claim of repayment`: Immediate second claim reverts with `NothingToClaim`.
12. `allows claiming pro-rata repayment share after loan defaults, and rejects zero/duplicate claim`: Verifies lender claim behavior after default.
13. `reverts on each LoanFactory validation check with the expected custom error`:
    - `BorrowerNotVerified` (unverified borrower)
    - `InvalidTarget` (`targetWei == 0`)
    - `InvalidDuration` (`durationSeconds == 0`)
    - `InvalidSpendLimit` (`maxSpendWei == 0` and `maxSpendWei > targetWei`)
    - `InvalidQuorum` (`defaultQuorumBps <= 5000` and `defaultQuorumBps > 10000`)
    - `NoMerchants` (`merchants.length == 0`)
14. `rejects unauthorized caller in ReputationRegistry and accepts authorized pool with events`:
    - Unauthorized `recordOutcome` call reverts with `NotAuthorizedPool`
    - Non-owner `authorizePool` reverts with `OwnableUnauthorizedAccount`
    - Owner authorization emits `PoolAuthorized`
    - Authorized caller emits `ReputationUpdated`
15. `enforces KYCRegistry owner-only access and already-in-state revert`:
    - Non-owner calls revert with `OwnableUnauthorizedAccount`
    - Updates emit `VerificationUpdated`
    - Idempotent identical update reverts with `AddressAlreadyInState`
16. `prevents reentrancy attack on spend via malicious merchant and on claimRepayment via malicious lender`:
    - Malicious merchant reentering `spend` reverts with `merchant transfer failed` (blocked by `nonReentrant`)
    - Malicious lender reentering `claimRepayment` reverts with `lender transfer failed` (blocked by `nonReentrant`)
17. `asserts events for all contract lifecycle and state transitions`: Complete event emission checks across `KYCRegistry`, `LoanFactory`, `ReputationRegistry`, and `LoanPool`.

---

## 2. Code Coverage Baseline

Generated via Hardhat 3 built-in coverage instrumentation (`npx hardhat test --coverage`).

| Contract | Lines Covered | Total Lines | Line Coverage (%) |
| :--- | :--- | :--- | :--- |
| **`contracts/KYCRegistry.sol`** | 5 | 5 | **100.00%** |
| **`contracts/LoanFactory.sol`** | 24 | 24 | **100.00%** |
| **`contracts/LoanPool.sol`** | 91 | 95 | **95.79%** |
| **`contracts/ReputationRegistry.sol`** | 15 | 17 | **88.24%** |
| **Protocol Total** | **135** | **141** | **95.74%** |
| *`contracts/test/MaliciousContracts.sol`* | 13 | 13 | 100.00% |

---

## 3. Gas Consumption Baseline

Captured via Hardhat 3 gas statistics (`npx hardhat test --gas-stats`).

| Contract / Function | Min (gas) | Average (gas) | Median (gas) | Max (gas) | Calls / Deploys |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`LoanFactory` Deployment** | 5,102,668 | 5,102,668 | 5,102,668 | 5,102,668 | 18 |
| `LoanFactory.createLoan` | 3,281,151 | 3,281,151 | 3,281,151 | 3,281,151 | 18 |
| `LoanFactory.getPools` | 29,261 | 29,261 | 29,261 | 29,261 | 18 |
| **`KYCRegistry` Deployment** | 590,208 | 590,208 | 590,208 | 590,208 | 18 |
| `KYCRegistry.setVerified` | 51,778 | 51,885 | 51,802 | 52,242 | 22 |
| **`ReputationRegistry` Deployment** | 905,628 | 905,628 | 905,628 | 905,628 | 18 |
| `ReputationRegistry.authorizePool` | 51,287 | 51,287 | 51,287 | 51,287 | 1 |
| `ReputationRegistry.recordOutcome` | 40,595 | 49,106 | 49,106 | 57,616 | 2 |
| `ReputationRegistry.transferOwnership` | 29,029 | 29,029 | 29,029 | 29,029 | 17 |
| **`LoanPool` Execution** | | | | | |
| `LoanPool.contribute` | 67,748 | 85,003 | 84,848 | 89,877 | 26 |
| `LoanPool.spend` | 52,072 | 63,472 | 69,172 | 69,172 | 3 |
| `LoanPool.repay` | 57,095 | 65,416 | 57,095 | 82,059 | 9 |
| `LoanPool.claimRepayment` | 50,295 | 65,685 | 67,395 | 67,395 | 10 |
| `LoanPool.voteDefault` | 80,267 | 102,670 | 105,321 | 122,421 | 3 |
| `LoanPool.cancelUnfunded` | 48,438 | 48,438 | 48,438 | 48,438 | 1 |
| `LoanPool.claimFundingRefund` | 64,314 | 64,314 | 64,314 | 64,314 | 2 |

---

## 4. Static Analysis Baseline (Slither)

- **Tool**: Slither v0.11.6
- **Solc Version**: 0.8.24
- **Contracts Analyzed**: 21 (including OpenZeppelin dependencies)
- **Detectors Run**: 102
- **Report Location**: `contracts/slither-report.json`

### Key Findings and Planned Resolutions (WP1 - WP2)
1. **Low-level calls (`call{value: ...}`)**:
   - Location: `LoanPool.spend`, `LoanPool.claimRepayment`, `LoanPool.claimFundingRefund`.
   - Assessment: Required for native ETH transfers and protected by `ReentrancyGuard`.
   - Planned Refinement: Maintain pull-payment architecture with strict accounting updates before external transfer.
2. **Missing zero-address checks**:
   - Location: `LoanPool` constructor parameters (`borrower_`, `kycRegistry_`, `reputationRegistry_`).
   - Planned Refinement: Add explicit zero-address validations and dedicated custom errors in WP1.
3. **Block timestamp comparisons**:
   - Location: `cancelUnfunded` and `voteDefault` comparing against `maturity`.
   - Assessment: Demonstrates governance timeouts; block timestamps on Ethereum are safe against miner manipulation within 15-second windows for multi-day loan durations.
4. **Interface inheritance**:
   - `KYCRegistry` and `ReputationRegistry` should explicitly implement `IKYCRegistry` and `IReputationRegistry`. Addressed in WP2.
5. **KYC Parameter Shadowing**:
   - Parameter `isVerified` in `setVerified` shares name with view function `isVerified`. Refactored in WP2 role-based redesign.

---

## 5. Work Package 1: Verification, Invariants & Metrics Update

Following the implementation of Work Package 1 (Contract fixes, distributable unspent principal, separate timing, merchant caps, grace period, and strict validations):

### 5.1 Test Suite & Invariants (29 tests)
- **Total Tests**: 29 (all passing, 0 failing)
- **Suite Additions**:
  - `distributes unspent principal on full repayment`: Lenders receive proportional unspent principal on top of repaid interest and principal.
  - `distributes unspent principal after default`: Leftover pool balance (target - totalSpent) is claimable pro-rata after loan default.
  - `separates funding deadline from activation maturity and emits maturity in LoanActivated`.
  - `enforces that createLoan requires msg.sender == borrower`.
  - `enforces per-merchant spend caps and global maxSpendWei simultaneously`.
  - `enforces grace period before default votes can be cast`.
  - `enforces LoanFactory Pausable and Ownable2Step mechanisms`.
  - **Invariants Verified**:
    1. *Sum of claims invariant*: Sum of all lender claims never exceeds total funds into pool (`totalContributed + totalRepaid`).
    2. *Allowlist payment invariant*: No ETH transfer can occur to an address outside `merchants` (for spend) or contributing lenders (for claims).
    3. *Per-merchant cap invariant*: Cumulative merchant spending never exceeds that merchant's specific `merchantCapWei`.
    4. *Solvency & terminal claimability invariant*: After terminal state (`Repaid` or `Defaulted`), `distributable() - totalClaimed == 0` (no locked funds).
    5. *Target invariant*: Total contributed never exceeds `targetWei`.

### 5.2 Code Coverage (Post-WP1)
| Contract | Line Coverage (%) | Statement Coverage (%) | Uncovered Lines |
| :--- | :--- | :--- | :--- |
| **`contracts/KYCRegistry.sol`** | **100.00%** | **100.00%** | - |
| **`contracts/LoanFactory.sol`** | **100.00%** | **100.00%** | - |
| **`contracts/LoanPool.sol`** | **97.37%** | **97.89%** | 114, 135, 250 |
| **`contracts/ReputationRegistry.sol`** | **88.24%** | **90.91%** | 37, 39 |
| **Protocol Total** | **97.25%** | **97.80%** | |
| *`contracts/test/MaliciousContracts.sol`* | 100.00% | 100.00% | - |

### 5.3 Gas Usage (Post-WP1)
- `LoanFactory.createLoan`: ~3,500,000 gas (includes cloning/deploying `LoanPool` and initializing per-merchant caps and immutable terms).
- `LoanPool.contribute`: 68,000 - 90,000 gas.
- `LoanPool.spend`: 55,253 - 89,465 gas (with per-merchant tracking).
- `LoanPool.repay`: 52,378 - 90,632 gas.
- `LoanPool.claimRepayment`: 50,000 - 68,000 gas (computing `distributable()`).
- `LoanPool.voteDefault`: 77,558 - 115,902 gas.

---

## 6. Work Package 2: Role-Based KYC, Access Control & Revocation Policy

Following the implementation of Work Package 2:

### 6.1 Test Suite & Revocation Coverage (31 tests)
- **Total Tests**: 31 (all passing, 0 failing)
- **Suite Additions**:
  - `enforces OpenZeppelin AccessControl, role separation, and verification expiry`:
    - Non-verifier calling `setVerification` reverts with `AccessControlUnauthorizedAccount`.
    - Revoking/granting `VERIFIER_ROLE` verified.
    - Role separation verified (`Role.Borrower` rejected for lender contributions; `Role.Lender` accepted).
    - Verification expiry verified (`expiresAt` in the past causes `isVerified` to return false and blocks contribution).
  - `enforces revocation policy across borrower, lender, and supplier lifecycles`:
    - Revoked/expired borrower cannot create loans (`BorrowerNotVerified`).
    - Revoked/expired supplier cannot receive disbursements (`SupplierNotVerified`).
    - Revoked lender cannot make new contributions (`NotVerifiedLender`).
    - Revoked borrower CAN repay outstanding loan debt.
    - Revoked lender CAN claim repayment proceeds (`claimRepayment`), claim funding refunds (`claimFundingRefund`), and vote default (`voteDefault`).
- **API Unit Tests** (`apps/api/src/verification.test.ts`):
  - `verification lifecycle transitions through states correctly`: Validates state machine from `NOT_STARTED` -> `PENDING` -> `REJECTED` -> `PENDING` -> `VERIFIED`, cryptographic salt generation, and salted credential hash consistency.
  - `unauthenticated verification review is rejected with 401 Unauthorized`: Validates security boundary on the API verification review endpoint.

### 6.2 Code Coverage (Post-WP2)
| Contract | Line Coverage (%) | Statement Coverage (%) | Uncovered Lines |
| :--- | :--- | :--- | :--- |
| **`contracts/KYCRegistry.sol`** | **95.35%** | **95.56%** | 68, 77 |
| **`contracts/LoanFactory.sol`** | **100.00%** | **100.00%** | - |
| **`contracts/LoanPool.sol`** | **97.39%** | **97.92%** | 118, 140, 257 |
| **`contracts/ReputationRegistry.sol`** | **88.24%** | **90.91%** | 37, 39 |
| **Protocol Total** | **96.85%** | **97.40%** | |
| *`contracts/test/MaliciousContracts.sol`* | 100.00% | 100.00% | - |

### 6.3 Gas Usage (Post-WP2)
- `KYCRegistry.setVerified`: ~54,000 gas.
- `KYCRegistry.setVerification`: ~70,000 gas (stores full struct including role, expiry, and credential hash).
- `KYCRegistry.revokeVerification`: ~31,000 gas.
- `LoanFactory.createLoan`: ~3,600,000 gas (including verification checks for borrower and all merchants).

---

## 7. Work Package 3: Natural Language to Term Sheet & Prompt Injection Defenses

Following the implementation of Work Package 3 (Deterministic & LLM parser pipeline, unit conversion, supplier resolution, unsupported clause detection, and cryptographic binding):

### 7.1 Golden Set Evaluation Scorecard (32 Fixtures)
A comprehensive golden test suite (`apps/api/src/agreements-golden.test.ts`) evaluating 32 diverse agreement fixtures runs continuously in CI with the following performance metrics:

| Metric Category | Accuracy / Pass Rate | Test Samples | Status |
| :--- | :--- | :--- | :--- |
| **Principal Target Extraction** | **100.0%** | 27 / 27 | PASS |
| **Annual Percentage Rate (APR)** | **100.0%** | 27 / 27 | PASS |
| **Loan Tenure / Duration** | **100.0%** | 26 / 26 | PASS |
| **Spending Cap Extraction** | **100.0%** | 28 / 28 | PASS |
| **Verified Supplier Resolution** | **100.0%** | 19 / 19 | PASS |
| **Unsupported Clauses Detection** | **100.0%** | 8 / 8 | PASS |
| **Prompt Injection Defense Rate** | **100.0%** | 4 / 4 blocked | **0 unvetted addresses emitted** |

### 7.2 API Endpoint Coverage
- `POST /api/v1/agreements/parse`: Validates untrusted agreement text, resolves against verified suppliers, checks bounds, generates reverse-rendered plain-English summary, computes Keccak256 hash, and saves to database.
- `GET /api/v1/agreements/:hash`: Retrieves stored agreement text and canonical representation by Keccak256 hash. Returns 404 for unknown digests.
- Verified in `apps/api/src/agreements-endpoint.test.ts` (100% pass).

### 7.3 Frontend Integration
- **`CreateLoanPage`**: Replaced client-side regex heuristics with server-side `/parse` pipeline. Displays side-by-side original text vs reverse-rendered summary, field quotes, source badges (`[From Text]` vs `[Default]`), unsupported clause warnings, and cryptographic hash binding.
- **`LoanDetailPage`**: Integrated `useAgreementByHash` to fetch stored agreement text and verify that `keccak256(canonicalText)` matches on-chain `LoanPool.agreementHash`.

---

## 8. Work Package 4: Configuration, Networks & Chain Abstraction

Following the implementation of Work Package 4 (Per-network configuration, environment validation, chain abstraction, and Sepolia testnet support):

### 8.1 Environment & Network Verification
- **Zod Environment Validation**: `apps/api/src/config.test.ts` (5 tests passing, 0 failing) validates:
  - Default fallback to localhost configuration (`NETWORK='localhost'`, port 4100).
  - Accurate parsing and coercion of Sepolia testnet parameters (`NETWORK='sepolia'`, RPC URL validation).
  - Immediate fail-fast rejection for unsupported networks (`mainnet`) or malformed RPC URLs.
  - Multi-candidate deployment file path resolution (`contracts/deployments/local.json` vs `contracts/deployments/sepolia.json`).
- **Contract Deployments**:
  - `contracts/deployments/local.json`: Untracked from Git and excluded via `.gitignore`.
  - `contracts/deployments/sepolia.example.json`: Sanitized template committed with zero secrets or private keys.
  - Hardhat deploy script (`contracts/scripts/deploy.ts`) verified locally on chain 31337 with output manifest containing contract addresses, deployer and demo accounts, deployment block number, and chain ID.
  - Sepolia single-signer fallback mechanism in `scripts/deploy.ts` derives demo accounts and funds gas from deployer.

### 8.2 Client-Side Chain Abstraction & UX
- **Removed Hardcoded Addresses**: Single source of truth is `GET /api/v1/config` and `GET /api/v1/evaluator/contracts`. Hardcoded fallback address `0x9fE4...` eliminated from `useContractAction.ts`.
- **Wagmi Dual-Chain Support**: Configured both `Hardhat Localhost` (31337) and `Sepolia Testnet` (11155111) in `apps/web/src/lib/wagmi.ts` selectable via `VITE_NETWORK`.
- **Network UI Controls**:
  - `NetworkStatus`: Renders target network badge, wrong-network warning, "Switch Network" button, "Add Network" button, and Sepolia Faucet link.
  - `WalletControl`: Displays target network state, chain ID, and Sepolia test ETH faucet link in account popover.
  - `TransactionLifecycle`: Displays "View in console" on Localhost (31337) and "View on Etherscan" link to `https://sepolia.etherscan.io` on Sepolia (11155111).
  - Time-warp simulation controls guarded so they only appear on local Hardhat.

---

## 9. Work Package 5: Indexer Engine, Resilience & Observability

Following the implementation of Work Package 5 (Continuous polling loop, reorg detection, atomic persistence, full event summaries, and Prometheus observability):

### 9.1 Projection Resilience & Reorg Recovery
- **Atomic File Persistence (`ProjectionStore`)**:
  - Uses atomic write pattern (`${filePath}.tmp.${Date.now()}.${random}` -> `fs.rename`) preventing partial writes, corrupt JSON, or race conditions during rapid state transitions.
  - Maintains cursor `lastIndexedBlock` and sliding block hash history.
  - Verified in `apps/api/src/projection.test.ts` (4 unit tests passing).
- **Reorg & Node Reset Detection (`ChainIndexer`)**:
  - Automatic recovery when local nodes reset (`latestBlock < lastIndexedBlock`).
  - Verifies block hash consistency across overlap window (`INDEXER_REORG_DEPTH`). On hash mismatch, purges invalidated events via `store.rewindTo(ancestor)` and resynchronizes canonical history.
  - Verified in `apps/api/src/indexer.test.ts` (3 unit tests passing).

### 9.2 Event Coverage (14 State-Changing Events)
All 14 protocol events are decoded into standardized timeline summaries with actor identification and human-readable context:
| Contract | Event Name | Decoded Fields & Narrative Summary |
| :--- | :--- | :--- |
| `LoanFactory` | `LoanCreated` | Pool address, borrower, target principal, APR bps, tenure |
| `LoanPool` | `Funded` | Contributor address, contribution amount ETH/Wei, cumulative funded total |
| `LoanPool` | `LoanActivated` | Activation block, maturity timestamp, final syndicate target |
| `LoanPool` | `SpendExecuted` | Recipient merchant, spend amount, category hash, cumulative spent |
| `LoanPool` | `RepaymentReceived` | Payer, amount received ETH, total repaid to date |
| `LoanPool` | `RepaymentClaimed` | Lender claimer, amount claimed, remaining claimable share |
| `LoanPool` | `DefaultVoteCast` | Voting lender, contributed weight in pool |
| `LoanPool` | `LoanDefaulted` | Terminal default declared, timestamp, voting quorum met |
| `LoanPool` | `LoanRepaid` | Loan fully discharged, timestamp, zero outstanding balance |
| `LoanPool` | `FundingCancelled` | Expiry triggered, pool cancelled, refund window open |
| `LoanPool` | `FundingRefunded` | Contributor refunded unactivated capital |
| `ReputationRegistry` | `ReputationUpdated` | Target borrower, score delta (+8 / -20), new credit score |
| `KYCRegistry` | `VerificationUpdated` | Subject address, role, expiry timestamp, salt digest |
| `KYCRegistry` | `VerificationRevoked` | Subject address, role, revocation timestamp |

### 9.3 Observability & Telemetry Endpoints
- **Health Inspection**: `GET /api/v1/health` and `GET /health` provide real-time connection status (`ok`, `status`, `network`, `chainId`, `connected`, `blockNumber`, `latestIndexedBlock`, `syncLag`, `poolCount`, `indexerRunning`, `timestamp`).
- **Prometheus Metrics**: `GET /api/v1/observability/metrics` provides standard metric gauges (`credify_chain_head_block`, `credify_indexer_last_indexed_block`, `credify_indexer_sync_lag`, `credify_loan_pools_total`, `credify_verified_entities_total`, `credify_system_health`).
- **Diagnostics Integration**: `ConsoleBackendPage.tsx` connects live telemetry to display node connection, EVM head block, last indexed block, sync lag, and indexer polling worker state.
- Verified in `apps/api/src/observability.test.ts` (2 unit tests passing).

---

## 10. Work Package 6: Core Protocol Lifecycles, Edge Cases & Invariant Verification

Following the implementation of Work Package 6 (6 core protocol lifecycle flows, contract edge cases, UI cancellation/refund integration, custom error translation, and multi-state scenario seeding):

### 10.1 Core Lifecycle Flows Verified
| Core Flow | Contract Mechanisms & Preconditions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **1. Natural Language Creation** | `LoanFactory.createLoan(terms)` with Keccak256 `agreementHash` | Instantiates `LoanPool` in `FUNDING` state, binds terms and supplier caps. | **VERIFIED** |
| **2. Multi-Lender Funding** | Incremental contributions (Alpha + Beta + Gamma) until `totalContributed == targetWei` | Automatic transition to `ACTIVE`, emits `LoanActivated`, computes maturity timestamp. | **VERIFIED** |
| **3. Controlled Spend** | Borrower invokes `spend(merchant, amount, category)` | ETH transferred to allowlisted merchant; pool balance drops; caps decremented. | **VERIFIED** |
| **4. Full Repayment** | Borrower transfers `target + interest` (`totalRepayableWei`) | Pool transitions to `REPAID`, unspent principal unlocked, `ReputationRegistry` records +8 pts. | **VERIFIED** |
| **5. Default Consensus** | Past maturity + grace period; contributing lenders cross `defaultQuorumBps` | Pool transitions to `DEFAULTED`, unspent capital unlocked, `ReputationRegistry` records -20 pts. | **VERIFIED** |
| **6. Cancel Unfunded** | Funding deadline elapsed without reaching target | Pool transitions to `CANCELLED`, opens 100% refund window for all depositors. | **VERIFIED** |

### 10.2 Edge Case Test Assertions (33 Passing Contract Tests)
The contract test suite (`contracts/test/Credify.test.ts`) tests all boundary edge cases:
- **Over-contribution Rejection**: Prevented in UI via max allocation check; reverts on-chain with `TargetExceeded()`.
- **Spend Exceeding Cap**: Prevented in UI via capacity calculation; reverts on-chain with `SpendLimitExceeded()` or `MerchantSpendCapExceeded()`.
- **Spend After Settlement**: Verified in `Credify.test.ts` that spend attempts when pool is `Repaid` or `Defaulted` revert with `NotActive()`.
- **Repayment After Maturity (Pre-Default)**: Verified in `Credify.test.ts` that borrower can cure debt after maturity + grace period, successfully reaching `Repaid` with +8 credit score enhancement.
- **Non-Lender Default Vote**: Reverts with dedicated custom error `NotLender()`.
- **Duplicate Claim & Refund**: Reverts with `NothingToClaim()` / `AlreadyClaimed()`.
- **Rounding Dust Invariant**: Verified in `Credify.test.ts` that pro-rata integer division never locks funds or exceeds total deposited plus interest.

### 10.3 Frontend & Scenario Seeding Matrix
- **`LoanDetailPage.tsx`**:
  - Implements `Cancel Unfunded Pool` action and visual status banner when funding deadline passes.
  - Implements `Claim Full Refund` action and visual status banner when pool is `CANCELLED`.
  - Exposes local academic simulation controls ("Simulate Funding Expiry (+8 Days)") on Hardhat localhost.
  - Translates custom Solidity errors (`BorrowerCannotContribute`, `MerchantSpendCapExceeded`, `FundingNotExpired`, `AlreadyClaimed`, `NotLender`, `GracePeriodActive`) to actionable user notifications in `useContractAction.ts`.
- **`ScenarioSeeder`**:
  - Seeds all 5 protocol lifecycle states on local EVM (`Repaid`, `Cancelled`, `Defaulted`, `Active`, `Funding`).
  - Borrower credit history demonstrates verifiable ledger trajectory (Initial: 50 -> Repaid: 58 -> Defaulted: 38).

---

## 11. Work Package 7: Technical Console Teaching Features & UI Boundary Separation

Following the implementation of Work Package 7 (Transaction Explainer, Loan State Inspector, Concepts with Interactive Sandbox, Trust Model & Threat Analysis, Admin Tool Guarding, and Automated Console Boundary Enforcement):

### 11.1 Pedagogical Features in Technical Console (`/console`)
| Feature | Route / Component | Pedagogical Content & Interactive Capabilities | Status |
| :--- | :--- | :--- | :--- |
| **Explain This Transaction** | `TransactionExplainerDrawer.tsx` in `TransactionDetailModal.tsx` & `ConsoleTransactionsPage.tsx` | Interactive breakdown: (1) Operation intent narrative, (2) State machine impact & EVM storage slots mutated, (3) Invariants & security guards enforced, (4) Gas economics & EVM storage cost analysis, (5) Decoded event logs with indexer ingestion rationale. | **VERIFIED** |
| **Loan State Inspector** | `ConsoleLoanInspectorPage.tsx` at `/console/inspector` | Pool selector dropdown & custom address input; enum state machine diagnostics & transition blockers; vault balance breakdown; `distributable()` waterfall math; syndicate lender positions; supplier allowlist caps; 5-item real-time automated invariant verification checklist. | **VERIFIED** |
| **Core Concepts & Sandbox** | `ConsoleConceptsPage.tsx` at `/console/concepts` | Comprehensive walkthrough of: (1) Multi-lender coordination without central custody (escrow vs custodial P2P, pull payment pattern, refund guarantees), (2) Controlled disbursement via allowlisted suppliers (anti-diversion, zero direct borrower custody), (3) Pro-rata waterfall & unspent principal distribution with an **Interactive Live Simulator Sandbox** allowing students to manipulate parameters and verify exact payouts and net yields. | **VERIFIED** |
| **Trust & Threat Model** | `ConsoleTrustModelPage.tsx` at `/console/trust-model` | Participant trust matrix (Lenders, Borrowers, Suppliers); semi-trusted role of the authorized verifier issuing salted credential hashes; mandatory academic disclaimer (not regulated KYC, testnet test ETH only, no audit warranty, zero real-money utility); formal 6-vector threat analysis (Sybil borrowers, supplier collusion, reentrancy, premature default griefing, locked capital, underfunded deadlines). | **VERIFIED** |

### 11.2 Strict UI Separation & Automated Console Boundary Invariant Test
- **Architectural Boundary Invariant**:
  - `/app` is strictly dedicated to clean institutional product workflows (borrower, lender, and supplier portals; verification; agreement details; activity). Contains zero chain-internals widgets (no block streams, 3D block visuals, topology canvas, trace or replay, hash dumps, state-root or gas tables).
  - All pedagogical features and diagnostic tools reside exclusively in `/console`.
- **Automated Console Boundary Test (`apps/api/src/console-boundary.test.ts`)**:
  - Recursively scans all `.ts` and `.tsx` source files in `apps/web/src`.
  - Asserts that zero product files import from `components/console` or `pages/console` (only `App.tsx` router and files within `console/` are permitted).
  - Asserts that zero product pages contain prohibited chain internal widgets (`SystemTopologyCanvas`, `TopologyNodeInspector`, `ActionTraceEngine`, `IsometricBlockStream`, `CryptoBlock3D`, `ReplayController`).
  - Integrated into `npm test` and verified with 100% pass rate.
- **Product Page Sanitization**:
  - Removed inline EVM time-warp helper buttons from `LoanDetailPage.tsx` and `LenderGovernancePage.tsx`, replacing them with non-intrusive references to the Technical Console Evaluator Tools.
  - Added clean product footer in `AppShell.tsx` linking to the Trust & Threat Model and Technical Console.

### 11.3 Admin Controls Guarding & Network Isolation
- **Backend API Guarding (`apps/api/src/server.ts`)**:
  - Endpoints `/api/v1/demo/reset`, `/api/v1/evaluator/seed-scenario`, and `/api/v1/evaluator/time-warp` are strictly guarded by `config.network === 'localhost'`.
  - Invocations from remote networks (such as Sepolia) immediately return `403 Forbidden` with a descriptive error.
- **Frontend Diagnostics Guarding (`ConsoleEvaluatorToolsPage.tsx`)**:
  - Detects network connection status. On non-local networks, displays an informative security banner and disables EVM block time manipulation, scenario seeding, and state resetting.
  - On local Hardhat nodes, provides quick-expiry presets (+8d funding window, +15d maturity, +18d grace period) and full protocol scenario seeding.

### 11.4 Verification & Quality Gates
- **Contract Tests**: 33 passing Mocha/Ethers tests (`npm test -w @credify/contracts`).
- **API & Boundary Tests**: 23 test suites passing/skipping cleanly (`npm test -w @credify/api`), including `console-boundary.test.ts`.
- **Typecheck**: 0 TypeScript errors across all 4 monorepo packages (`npm run typecheck`).
- **Production Build**: Clean Vite production build (`npm run build -w apps/web`) with zero bundle or compilation errors.

