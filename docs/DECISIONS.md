# Credify Architecture Decisions Record (ADR)

This document records architectural decisions, engineering trade-offs, and protocol specifications made throughout the implementation of Work Packages WP0 to WP11.

---

## ADR-001: Baseline Quality Framework & Tooling Integration (WP0)

### Context
Work package WP0 requires establishing an automated verification baseline covering testing, code coverage, gas metrics, and static analysis before any contract refactoring begins.

### Decision
1. **Testing**: Use Hardhat 3 with Mocha and Ethers (`@nomicfoundation/hardhat-toolbox-mocha-ethers`). Expand test suite to test all revert conditions, state changes, and reentrancy vectors.
2. **Coverage & Gas**: Utilize Hardhat 3's native `--coverage` and `--gas-stats` flags, generating standard `lcov.info` and detailed function-level gas tables without external plugin conflicts.
3. **Static Analysis**: Integrate Slither v0.11.6 using solc 0.8.24, exporting machine-readable reports to `contracts/slither-report.json`.
4. **Reentrancy Testing**: Deploy minimal test attacker contracts (`MaliciousMerchant`, `MaliciousLender`) to verify OpenZeppelin `ReentrancyGuard` protections under simulated reentrant execution.

### Status
Accepted and verified in WP0 baseline.

---

## ADR-002: Loan Terms Struct, Timing Parameters, and Enforceable Clauses (WP1)

### Context
Work package WP1 introduces configurable credit terms, unspent principal recovery, separate funding and maturity timing, caller authentication, merchant-specific spend limits, and governance grace periods. We need unambiguous decisions on timing semantics, parameter bounds, and late fees.

### Decisions
1. **LoanTerms Struct**: Encapsulate all loan initialization parameters into a single `LoanTerms` struct to prevent Solidity stack-too-deep errors in `LoanFactory.createLoan` and `LoanPool` constructor.
2. **Funding Deadline Semantics**:
   - `fundingDurationSeconds` is passed in `LoanTerms` as a relative duration in seconds (bounded between 5 minutes and 90 days).
   - In `LoanPool`, `fundingDeadline` is stored as an immutable absolute timestamp (`block.timestamp + terms.fundingDurationSeconds`).
   - Rationale: Relative durations ensure transactions and signed term sheets do not expire prior to mining, while allowing local deterministic test scenarios.
3. **Maturity Timing**:
   - Maturity is decoupled from creation. It is initialized to `0` and dynamically set upon full funding activation: `maturity = block.timestamp + durationSeconds`.
   - `LoanActivated(timestamp, maturity)` emits the final maturity timestamp.
4. **Parameter Bounds & Distinct Custom Errors**:
   - `targetWei`: > 0 (`InvalidTarget`).
   - `aprBps`: 0 to 5,000 bps (`InvalidAPR`).
   - `durationSeconds`: 300 s (5 min) to 31,536,000 s (365 days) (`InvalidDuration`).
   - `fundingDurationSeconds`: 300 s (5 min) to 7,776,000 s (90 days) (`InvalidFundingWindow`).
   - `maxSpendWei`: > 0 and <= `targetWei` (`InvalidSpendLimit`).
   - `defaultQuorumBps`: 5,001 to 10,000 bps (`InvalidQuorum`).
   - `gracePeriodSeconds`: 0 to 2,592,000 s (30 days) (`InvalidGracePeriod`).
   - `merchants`: 1 to 10 non-zero, unique addresses (`NoMerchants`, `TooManyMerchants`, `ZeroMerchantAddress`, `DuplicateMerchantAddress`).
   - `merchantCapsWei`: Length must match `merchants` (`MismatchedMerchants`); each cap must be > 0 and <= `maxSpendWei` (`InvalidMerchantCap`).
5. **Caller Authentication on Factory**:
   - `LoanFactory.createLoan` requires `msg.sender == terms.borrower` (`NotBorrower`).
6. **Unspent Principal Distribution (`distributable()`)**:
   - In terminal states (`Repaid`, `Defaulted`), `distributable() = totalRepaid + (totalContributed - totalSpent)`. In active states, `distributable() = totalRepaid`.
   - Eliminates trapped capital: lenders claim both their interest/repayment share and their unspent escrowed principal pro-rata.
7. **Per-Merchant Caps**:
   - Each merchant is assigned `merchantCapWei`. `LoanPool.spend` checks both per-merchant remaining capacity and global `maxSpendWei`.
8. **Grace Period**:
   - Default voting requires `block.timestamp >= maturity + gracePeriodSeconds`.
9. **Late Fee (Item 9)**:
   - We choose **not** to build the optional dynamic late fee. Credify maintains fixed, immutable flat-interest semantics (`totalRepayable = target + (target * aprBps) / 10000`). Dynamic late fees would create volatile claimable amounts during active default governance.

### Status
Accepted and implemented in WP1.

---

## ADR-003: Role-Based Expiring Salted KYC Verification and Revocation Policy (WP2)

### Context
Work package WP2 redesigns KYC verification from a simple binary flag into a granular, role-based, expiring credential verification system with access control, off-chain salted privacy-preserving commitments, and explicit contract revocation policies.

### Decisions
1. **Granular Role Architecture**:
   - `IKYCRegistry.Role` enum defines `None (0)`, `Borrower (1)`, `Lender (2)`, and `Supplier (3)`.
   - `Record` struct stores `{ Role roleType, bool verified, uint256 expiresAt, bytes32 credentialHash }`.
   - `isVerified(account, roleType)` validates `record.verified && record.roleType == roleType && record.expiresAt > block.timestamp`.
2. **Access Control**:
   - `KYCRegistry` inherits OpenZeppelin `AccessControl`.
   - Deployer receives `DEFAULT_ADMIN_ROLE` and `VERIFIER_ROLE`.
   - Only addresses with `VERIFIER_ROLE` can invoke `setVerified`, `setVerification`, or `revokeVerification`.
3. **Off-Chain Salted Privacy-Preserving Hashing**:
   - Raw profile attributes are canonicalized (keys sorted) into JSON.
   - A unique 32-byte cryptographically secure random salt is generated per request.
   - Hash is computed via `keccak256(abi.encode(canonicalProfileJson, salt))`.
   - Only the resulting 32-byte digest is anchored on-chain. Salt and structured metadata are stored securely off-chain, protecting applicant privacy while allowing deterministic zero-knowledge-ready verification.
4. **Lifecycle Revocation Policy**:
   - **Lenders**: Revoked or expired lenders cannot commit fresh capital (`contribute()`), but retain fundamental property rights to withdraw their funds (`claimRepayment()`, `claimFundingRefund()`) and participate in default governance (`voteDefault()`).
   - **Borrowers**: Revoked or expired borrowers cannot deploy new credit pools (`createLoan()`) or draw down funds (`spend()`), but retain the obligation and capability to settle debt (`repay()`).
   - **Suppliers**: Revoked or expired merchants cannot receive pool disbursements (`spend()`), preventing capital leakage to compromised vendors.
5. **API Verifier Authentication**:
   - Verification review (`POST /api/v1/verification/requests/:id/review`) requires verifier authentication via `Authorization: Bearer <secret>` or a signed on-chain `attestationTxHash`. Unauthenticated requests return `401 Unauthorized`.

### Status
Accepted and verified in WP2.

---

## ADR-004: Natural Language to Term Sheet Pipeline, Cryptographic Agreement Binding, and Prompt Injection Defenses (WP3)

### Context
Work package WP3 requires turning written natural language credit agreements into validated parameters for fixed, immutable smart contracts (`LoanFactory` & `LoanPool`), removing browser regex heuristics, flagging missing and unsupported clauses, preventing prompt-injection attacks, and cryptographically binding the agreement text on-chain.

### Decisions
1. **Server-Side Architecture (`POST /api/v1/agreements/parse`)**:
   - The browser regex heuristic in `CreateLoanPage` is fully decommissioned as the source of truth.
   - All agreement parsing is centralized server-side. Transactions are constructed strictly from server-validated parameters.
2. **Dual Parser with Clean Deterministic Fallback**:
   - `GeminiAgreementParser` utilizes structured JSON schema extraction when a valid Gemini API key is configured.
   - `parseAgreementDeterministic` executes comprehensive regex, token, and semantic clause extraction.
   - If the Gemini call fails, times out, or has no key configured, the system automatically falls back to `parseAgreementDeterministic` with `parser: 'deterministic'`.
3. **Untrusted Input Treatment & Prompt-Injection Mitigation**:
   - Agreement text is strictly treated as untrusted data (limited to 20,000 characters).
   - Under no circumstances does the system output or deploy Solidity code from natural language text.
   - Raw Ethereum addresses written inside the text are ignored by the parser.
   - Merchants can only be resolved by matching entity names against verified suppliers holding `Supplier` / `MERCHANT` role in the `KYCRegistry`.
   - Security verification: Golden set evaluation verified a 100% prompt-injection defense rate (0 unvetted addresses emitted across all attack vectors).
4. **Deterministic Unit Conversion & Protocol Bounds**:
   - Units are strictly converted in code: ETH to wei (`parseEther`), percent to bps (`* 100`), duration to seconds (`* 86400`).
   - Bounds enforced identically to contracts: APR (0 to 5,000 bps), duration (300 to 31,536,000 s), funding window (300 to 7,776,000 s), spend cap ($\le$ target), default quorum (5,001 to 10,000 bps), grace period (0 to 2,592,000 s), merchants (1 to 10).
5. **No Silent Defaults**:
   - Every extracted parameter carries a source: `'text'`, `'default'`, or `'missing'`.
   - Missing terms are explicitly returned in `missingFields`. Default values only populate when explicitly acknowledged via `acceptedDefaults`.
6. **Unsupported Clauses Flagging**:
   - Off-chain legal covenants (collateral pledges, personal guarantees, dynamic late fees, physical premises audits, and arbitration clauses) are automatically flagged in `unsupportedClauses` with verbatim quotes and explanations of why smart contracts do not enforce them.
7. **Cryptographic Agreement Binding (`agreementHash`)**:
   - Exact canonicalization algorithm:
     ```ts
     text.replace(/\r\n|\r/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim()
     ```
   - Hash formula: `agreementHash = keccak256(toHex(canonicalText))`.
   - Off-chain agreements are persisted in `AgreementStore` (`data/agreements.json`) keyed by `agreementHash`.
   - On-chain: `agreementHash` is passed in `LoanTerms` to `LoanFactory.createLoan` and stored immutably in `LoanPool.agreementHash`.
   - The UI (`LoanDetailPage`) fetches the stored agreement and cryptographically verifies `keccak256(canonicalText) === loan.agreementHash`.
8. **Deterministic Reverse-Render Summary**:
   - A plain-English summary is generated purely in deterministic code (`reverseRenderSummary`) from the validated smart contract parameters, preventing LLM hallucinations.

### Status
Accepted and verified in WP3 with 32 golden fixtures (100% accuracy, 100% prompt injection defense).

---

## ADR-005: Multi-Network Configuration, Chain Abstraction, and Sepolia Testnet Support (WP4)

### Context
Work package WP4 requires one unified codebase that runs seamlessly on both local Hardhat (chain 31337) and Sepolia testnet (chain 11155111). Hardhat local node must remain fully functional as the primary presentation fallback with zero dependencies on external services. The system must eliminate hardcoded fallback addresses from client applications, validate environment variables at startup, abstract EVM client connectivity, provide clear wrong-network states, and link transactions appropriately (Etherscan on Sepolia, local console on Localhost).

### Decisions
1. **Per-Network Deployment Files & Security**:
   - Contract addresses, deployment block numbers, and chain IDs are stored in `contracts/deployments/<network>.json` (`local.json`, `sepolia.json`).
   - `local.json` is untracked from Git and excluded via `.gitignore` (`contracts/deployments/*.json` with `!contracts/deployments/sepolia.example.json`).
   - `contracts/deployments/sepolia.example.json` is committed as a sanitised schema template containing zero secrets or private keys.
2. **Startup Environment Validation & Fail-Fast Mechanics**:
   - `apps/api/src/config.ts` validates environment variables at boot using Zod (`envSchema`).
   - Validates `NETWORK` (`'localhost' | 'local' | 'hardhat' | 'sepolia'`), URLs (`CHAIN_RPC_URL`, `SEPOLIA_RPC_URL`), port, mnemonic, and deployment path.
   - Throws immediate fatal startup errors if environment variables are malformed, preventing silent misconfigurations.
3. **Single Source of Truth for Contract Addresses**:
   - The backend exposes `GET /api/v1/config` and `GET /api/v1/evaluator/contracts` reading directly from the active network deployment file.
   - All hardcoded fallback addresses (such as `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`) are removed from web client code (`useContractAction.ts`, `ConsoleEvaluatorToolsPage.tsx`). If contract addresses are unconfigured or unindexed, transactions fail fast with clear actionable error messages.
4. **Wagmi Dual-Chain Configuration & Target Network Selection**:
   - `apps/web/src/lib/wagmi.ts` configures both `hardhatChain` (id: 31337) and `sepoliaChain` (id: 11155111).
   - Target network is selected via `VITE_NETWORK` (`'localhost'` vs `'sepolia'`).
   - Transports route to local node (`http://127.0.0.1:8545`) or configured Sepolia RPC.
5. **Network Switching, Adding, and Faucet UX**:
   - `WalletContext` computes `isCorrectNetwork = !isConnected || chainId === targetChainId`.
   - Provides `switchNetwork()` (triggering `wallet_switchEthereumChain` with fallback to `wallet_addEthereumChain`) and `addNetwork()` with full network params for MetaMask.
   - Renders animated wrong-network alert badges and quick-action "Switch Network" and "Add Network" buttons in `NetworkStatus` and `WalletControl`.
   - Exposes Sepolia faucet link (`https://sepoliafaucet.com`) in the header and wallet popover when target network is Sepolia.
6. **Block Explorer Links**:
   - `getExplorerTxUrl(hash, chainId)` and `getExplorerAddressUrl(address, chainId)` resolve to Sepolia Etherscan (`https://sepolia.etherscan.io`) when on Sepolia (11155111) and internal console routes (`/console/transactions`, `/console/blockchain`) when on Localhost (31337).
   - `TransactionLifecycle` shows "View on Etherscan" or "View in console" based on active chain ID.
7. **Deployment Script Adaptability (`scripts/deploy.ts`)**:
   - Automatically detects current network and chain ID via `ethers.provider.getNetwork()`.
   - On Sepolia or single-signer configurations, derives deterministic demo personas using standard test mnemonic and funds borrower for transaction gas.
   - Scales demo loan parameters for Sepolia (0.1 ETH target instead of 10 ETH) to respect faucet limits while preserving protocol behavior.
   - Outputs deployment manifest to `deployments/sepolia.json` or `deployments/local.json`.

### Status
Accepted and verified in WP4.

---

## ADR-006: Continuous Indexer Polling, Atomic Projection Persistence, Reorg Handling, and Observability Metrics

### Context
Prior to Work Package 5:
1. The chain indexer executed only on-demand when incoming API routes invoked `indexer.indexOnce()`, resulting in lag and stale telemetry between requests.
2. The JSON projection store (`projection.json`) wrote directly to disk, risking partial writes or corrupted JSON if the process crashed or performed concurrent updates.
3. Node resets (e.g. `hardhat_reset`) or chain reorgs on testnets (Sepolia) left the indexer's `lastIndexedBlock` ahead of the chain head or holding invalidated event logs.
4. Observability was limited to a basic `/health` check without standard metrics (Prometheus format) or fine-grained sync lag monitoring (EVM head block vs. latest indexed block).

### Decision
1. **Continuous Asynchronous Polling Engine (`ChainIndexer`)**:
   - Implemented `startPolling(intervalMs)` and `stopPolling()` with background error handling and graceful shutdown hook on server close.
   - Configurable poll interval (`INDEXER_POLL_INTERVAL_MS`, default 2000ms) and reorg depth (`INDEXER_REORG_DEPTH`, default 200 blocks).
2. **Atomic Disk Persistence (`ProjectionStore`)**:
   - `save()` writes to a unique temporary file (`${filePath}.tmp.${Date.now()}.${random}`) and utilizes atomic filesystem rename (`fs.rename`), preventing corrupted JSON on partial writes.
   - Maintains a cursor of `lastIndexedBlock` and an LRU/sliding window of recent `blockHashes` for integrity checks.
3. **Reorg and Node Reset Recovery**:
   - When the chain head is less than `lastIndexedBlock` (node restart/reset), the indexer detects the reset, resets its cursor to the new head, and calls `store.rewindTo(newHead)`.
   - When block hashes mismatch at the overlap boundary, `store.rewindTo(ancestorBlockNumber)` purges invalidated events and rewinds the cursor to allow replay of the canonical fork.
4. **Full Protocol Event Decoding (14 State-Changing Events)**:
   - Full decoding and plain-English narrative generation for all 14 contract events:
     - `LoanFactory`: `LoanCreated`
     - `LoanPool`: `Funded`, `LoanActivated`, `SpendExecuted`, `RepaymentReceived`, `RepaymentClaimed`, `DefaultVoteCast`, `LoanDefaulted`, `LoanRepaid`, `FundingCancelled`, `FundingRefunded`
     - `ReputationRegistry`: `ReputationUpdated`
     - `KYCRegistry`: `VerificationUpdated`, `VerificationRevoked`
5. **Observability Endpoints & Prometheus Telemetry**:
   - `GET /api/v1/health` (and `/health`) exposes: `ok`, `status`, `network`, `chainId`, `connected`, `blockNumber`, `latestIndexedBlock`, `syncLag`, `poolCount`, `indexerRunning`, `timestamp`.
   - `GET /api/v1/observability/metrics` provides both Prometheus text exposition (`text/plain` or `?format=prometheus`) and structured JSON telemetry:
     - `credify_chain_head_block`
     - `credify_indexer_last_indexed_block`
     - `credify_indexer_sync_lag`
     - `credify_loan_pools_total`
     - `credify_verified_entities_total`
     - `credify_system_health`
6. **Technical Console Integration**:
   - `ConsoleBackendPage.tsx` displays live EVM Head, Last Indexed Block, Sync Lag, and continuous polling worker status in both the metrics grid and the runtime telemetry panel.

### Status
Accepted and verified in WP5.

---

## ADR-007: Core Protocol Lifecycles, Edge Cases, and UI Contract Invariants

### Context
Work Package 6 mandates thorough verification and user interface integration for all 6 core lifecycle flows:
1. Loan creation from natural language text to validated on-chain terms with cryptographic binding.
2. Multi-lender syndicate funding with automatic on-chain activation upon reaching 100% target.
3. Controlled supplier spending with allowlist enforcement and per-merchant spend caps.
4. Full principal plus interest repayment with pro-rata claims (including unspent capital) and on-chain credit score enhancement (+8 points).
5. Default declaration following grace period expiry, threshold-crossing quorum consensus, unspent principal pro-rata claims, and on-chain credit penalty (-20 points).
6. Unfunded pool cancellation following funding deadline expiry, unlocking 100% principal refunds.

Critical edge cases must also be strictly enforced and surfaced with clear error messaging:
- Over-contribution attempts prevented in UI and rejected on-chain (`TargetExceeded`).
- Spend exceeding cap prevented in UI and rejected on-chain (`SpendLimitExceeded` / `MerchantSpendCapExceeded`).
- Spend after loan repayment or default rejected on-chain (`NotActive`).
- Repayment after maturity but before default succeeds, allowing the borrower to cure overdue balances.
- Non-lender default voting rejected with dedicated error (`NotLender`).
- Double claim and double refund attempts rejected (`NothingToClaim` / `AlreadyClaimed`).
- Rounding dust does not lock contract funds or cause integer underflow.

### Decision
1. **Contract Edge Case Assertions (`Credify.test.ts`)**:
   - Added test verifying spend rejection when status is Repaid or Defaulted (`NotActive`).
   - Added test verifying that full repayment after maturity but before default declaration succeeds, curing the loan into Repaid status, resetting debt to zero, and increasing reputation score (+8 points).
   - Verified that non-lender default votes revert with custom error `NotLender`.
   - Verified that double claims and double refunds revert with custom error `NothingToClaim` or `AlreadyClaimed`.
   - Contract test suite expanded to 33 passing Mocha/Ethers tests.
2. **Web UI Cancellation and Refund Support (`LoanDetailPage.tsx`)**:
   - Added visual status alert and action card for `CANCELLED` pools, allowing participating lenders to execute `executeClaimRefund` via connected wallet.
   - Added visual alert for `FUNDING` pools that have passed their `fundingDeadline`, enabling any user or evaluator to trigger `cancelUnfunded` on-chain.
   - Added local academic simulation helper ("Simulate Funding Expiry (+8 Days)") on Hardhat localhost, allowing instant testing of time-based expiry and cancellation flows.
   - Updated lifecycle stepper component to render `CANCELLED` and `Refunds Claimable` state.
3. **Custom Error Translation (`useContractAction.ts`)**:
   - Added explicit user-friendly translation for custom errors: `BorrowerCannotContribute`, `MerchantSpendCapExceeded`, `FundingNotExpired`, `AlreadyClaimed`, `NotLender`, and `GracePeriodActive`.
4. **Comprehensive Academic Scenario Seeder (`scenario-seeder.ts`)**:
   - Enhanced `ScenarioSeeder.seedAll()` to instantiate and project all 5 protocol lifecycle states on local EVM nodes:
     - Scenario 1: Completed Repaid agreement with dividends claimed (+8 borrower score).
     - Scenario 2: Cancelled unfunded agreement with open lender refunds.
     - Scenario 3: Defaulted agreement with unspent principal claimable and -20 penalty.
     - Scenario 4: Active agreement with partial supplier disbursements.
     - Scenario 5: In-progress syndicate funding agreement.
   - Provides teachers, evaluators, and students with immediate access to realistic live protocol states and verified historical ledger provenance.

### Status
Accepted and verified in WP6.

---

## ADR-008: Console Teaching Features, Architectural Pedagogy, Trust & Threat Model, and Strict UI Boundary Enforcement

### Context
Work Package 7 establishes the Credify Technical Console (`/console`) as a comprehensive pedagogical showcase for blockchain students and evaluators, while preserving the user-facing product workspace (`/app`) as a clean, institutional interface.
Key requirements:
1. "Explain this transaction" interactive breakdown for on-chain transactions.
2. An on-chain loan state inspector (`/console/inspector`) auditing storage slots, lifecycle state transitions, vault balance breakdowns, and protocol invariants.
3. A Core Concepts teaching module (`/console/concepts`) with an interactive pro-rata waterfall simulator sandbox.
4. A Trust Model and Threat Model section (`/console/trust-model`) stating trust boundaries, verifier responsibilities, and formal attack vector mitigations with strict plain-language academic disclaimers.
5. Strict UI boundary enforcement: Product pages must contain zero chain-internals widgets and zero imports from `components/console` or `pages/console`.
6. Administrative controls (time-warp, reset, scenario seeding) must run only when `NETWORK=local` / `localhost` and otherwise be disabled and guarded with 403 responses. All simulation tools previously located on product pages must be moved to the Console.

### Decision
1. **Interactive Transaction Explainer Drawer (`TransactionExplainerDrawer.tsx`)**:
   - Integrated into `TransactionDetailModal.tsx` and accessible via "Explain & Inspect" in `ConsoleTransactionsPage.tsx`.
   - Breaks down transactions into 5 pedagogical sections:
     - Operation Intent & Summary (e.g. Syndicate Contribution, Controlled Disbursement, Repayment Settlement, Default Consensus).
     - State Machine Lifecycle Impact & EVM storage slot modifications.
     - Invariants & Security Guards Enforced (Reentrancy locks, KYC attestations, timestamp boundaries, merchant caps).
     - Gas Economics & EVM Footprint (SSTORE storage cost breakdown vs memory, effective gas price in Gwei, fee in ETH).
     - Decoded Event Log Interpretations with indexer ingestion rationale.
2. **On-Chain Loan State Inspector (`ConsoleLoanInspectorPage.tsx` at `/console/inspector`)**:
   - Includes real-time pool selector and custom contract address input.
   - Inspects enum state machine transitions (Funding, Active, Repaid, Defaulted, Cancelled) and transition blockers.
   - Displays vault escrow balance decomposition and `distributable()` waterfall math (ADR-001).
   - Audits syndicate lender positions (share %, claimable dividends, default voting status) and allowlisted supplier spend caps.
   - Executes real-time automated verification of 5 mathematical protocol invariants: Vault Solvency, Spend Discipline, Zero Direct Borrower Custody, Pull-Payment Reentrancy Defense, and Deterministic Reputation Provenance.
3. **Core Concepts Educational Suite & Interactive Sandbox (`ConsoleConceptsPage.tsx` at `/console/concepts`)**:
   - Concept 1: Multi-lender coordination without central custody (escrow vs custodial P2P, all-or-nothing funding deadlines, pull-payment safety).
   - Concept 2: Controlled disbursements via allowlisted suppliers (anti-diversion mechanics, zero raw borrower custody, on-chain vendor caps).
   - Concept 3: Non-locking pro-rata waterfall mathematics and integer division safety.
   - Interactive Live Sandbox: Allows students to manipulate target ETH, supplier spending, APR, repayment, terminal status, and lender shares to calculate real-time distributable balances, unspent refunds, and net yields.
4. **Trust Model & Formal Threat Analysis (`ConsoleTrustModelPage.tsx` at `/console/trust-model`)**:
   - Participant Trust Matrix: Detailed breakdown of what Syndicate Lenders, Borrowers, and Suppliers trust in the protocol.
   - Semi-Trusted Attestation Role: Specification of the authorized verifier's responsibility issuing salted credential hashes (`keccak256(role, applicant, expiry, salt)`).
   - Authoritative Plain-Language Academic Disclaimer: Plain wording that this is an academic demonstration on Sepolia testnet with test ETH, not a government ID check or regulated KYC, with no audit warranty or real-money utility.
   - 6-Vector Threat Analysis: Formal attack scenarios and contract mitigations for Sybil Borrowers, Supplier Collusion, Malicious Reentrancy, Premature Default Griefing, Locked Unspent Principal, and Underfunded Deadlines.
5. **Administrative Controls Guarding**:
   - `apps/api/src/server.ts`: Restricted `/demo/reset`, `/evaluator/seed-scenario`, and `/evaluator/time-warp` to `config.network === 'localhost'`. Requests from non-local networks return `403 Forbidden`.
   - `ConsoleEvaluatorToolsPage.tsx`: Detects network status and renders an informative alert disabling time-warp, scenario seeding, and reset on remote networks, while providing quick-expiry presets (+8d, +15d, +18d) on local nodes.
6. **Product Page Sanitization**:
   - Removed inline EVM time-warp helper buttons from `LoanDetailPage.tsx` and `LenderGovernancePage.tsx`. Product pages now display clean informational links to the Technical Console Evaluator Tools when running on local nodes.
   - Added minimal product footer in `AppShell.tsx` linking to the Trust & Threat Model and the Technical Console.
7. **Automated Console Boundary Test (`console-boundary.test.ts`)**:
   - Added automated Node.js test in `apps/api/src/console-boundary.test.ts` scanning the entire web frontend source tree.
   - Asserts that zero product files import from `components/console` or `pages/console`.
   - Asserts that zero product pages contain internal console widgets (`SystemTopologyCanvas`, `TopologyNodeInspector`, `ActionTraceEngine`, `IsometricBlockStream`, `CryptoBlock3D`, `ReplayController`).
   - Integrated into `npm test`, guaranteeing immediate build failure upon any architectural leakage.

### Status
Accepted and verified in WP7.

---

## ADR-009: Guided Presenter Mode, Multi-Persona Switching, Server-Signed Execution Fallback, and Presentation Seeder Calibrations

### Context
Demonstrating complete end-to-end decentralized credit lifecycles to an academic audience or course instructor involves coordinating four distinct actor roles: Borrowers, Multiple Syndicate Lenders, Allowlisted Suppliers, and Protocol Verifiers. In live presentation environments, repeated MetaMask popup approvals, manual account switching inside browser extensions, network latency, or presenting from environments without Web3 wallet extensions installed can introduce friction and disrupt presentation flow.

Work Package 9 requires:
1. A Guided Presenter Mode allowing a presenter to execute the complete borrower, lender, and supplier lifecycle without MetaMask popups or wallet configuration.
2. Toggleable via UI switcher or enabled when `DEMO_MODE=true`. Direct MetaMask wallet mode remains the default and must work end-to-end.
3. Client-side persona switching between 7 verified protocol demo accounts (`DEMO_ACCOUNTS`).
4. Server-signed execution routing in `useContractAction` using existing backend principal endpoints.
5. A subtle "Guided Demo Mode" indicator in the header.
6. Calibrating the Scenario Seeder with presentation-safe short durations.

### Decision
1. **Guided Mode Architecture & Default Wallet Mode Preservation**:
   - `IdentityContext.tsx` and `WalletContext.tsx` maintain dual-mode operation:
     - **Wallet Mode (Default)**: Uses Wagmi injected connectors and prompts MetaMask signatures for every transaction as established in WP2-WP6.
     - **Guided Demo Mode**: When toggled on via UI or `VITE_DEMO_MODE=true`, routes transactions to verified server-side demo accounts without popup friction.
   - Preserves state across browser sessions via `localStorage` keys (`credify_guided_mode` and `credify_active_persona`).
2. **Instant Persona Switching (`IdentityContext.tsx` & `GuidedModeSwitcher.tsx`)**:
   - Integrated full persona switcher supporting all 7 verified demo presets:
     - Borrower: Aarav Menon (`borrower`)
     - Lead Syndicate Lender: Meera Capital (`lender-alpha`)
     - Syndicate Participant Lender: Northstar Labs (`lender-beta`)
     - Syndicate Participant Lender: Blue Oak Partners (`lender-gamma`)
     - Allowlisted Supplier: BuildRight Supplies (`merchant-a`)
     - Allowlisted Supplier: StudioGrid Equipment (`merchant-b`)
     - Protocol Operator / KYC Verifier: Credify Operator (`operator`)
   - Switching personas automatically updates effective wallet addresses, active roles, navigation links, flushes query caches, and navigates to the persona's designated dashboard.
3. **Server-Signed Transaction Lifecycle Runner (`useContractAction.ts`)**:
   - Implemented `runGuidedLifecycle` in `useContractAction.ts`. When `isGuidedMode` is active:
     - Translates all 8 contract mutation actions (`createLoan`, `contribute`, `spend`, `repay`, `claim`, `cancelUnfunded`, `claimRefund`, `voteDefault`) into server-signed API calls.
     - Maintains the authentic 5-step lifecycle animation (`preparing` &rarr; `awaiting_wallet` &rarr; `submitted` &rarr; `confirming` &rarr; `confirmed`) with real transaction hashes and block numbers mined on-chain.
     - Clearly designates execution mode: "Executed via Guided Presenter Mode (Server-Signed Account: ...)", providing complete visual confirmation without extension popups.
4. **Header Indicator & Persona Control**:
   - Created `GuidedModeSwitcher.tsx` mounted in the `AppShell.tsx` header alongside network and wallet status.
   - Renders a subtle indicator with pulsing accent dot and quick-access persona selector dropdown.
   - Provides an instant toggle between Guided Demo Mode and MetaMask Wallet Mode.
5. **Presentation-Safe Short Scenario Seeder Durations (`scenario-seeder.ts`)**:
   - Calibrated `ScenarioSeeder.seedAll()` durations to short intervals meeting contract constraints (`durationSeconds >= 300`, `fundingDurationSeconds >= 300`):
     - Completed Agreement: 600s (10 min) duration, 300s (5 min) funding window.
     - Cancelled Agreement: 600s (10 min) duration, 300s (5 min) funding window (fast-forwarded 360s on local nodes).
     - Defaulted Agreement: 300s (5 min) duration, 300s (5 min) funding window, 60s grace period (fast-forwarded 420s on local nodes).
     - Active Agreement: 1800s (30 min) duration, 600s (10 min) funding window.
     - In-Progress Funding Agreement: 1800s (30 min) duration, 900s (15 min) funding window.
   - Ensures seeded scenarios are presentation-friendly, dynamic, and safe to execute prior to live demonstrations.

### Status
Accepted and verified in WP9.

---

## ADR-010: Sepolia Testnet Deployment Architecture, Contract Verification Protocol, and Live Demo Rehearsal Strategy

### Context
Work Package 10 governs the deployment and verification of the Credify credit protocol on the public Ethereum Sepolia testnet (`chainId: 11155111`), ensuring complete readiness for live course evaluation and academic inspection:
1. Strict segregation of private keys and API credentials from the git codebase.
2. Deployment of all protocol smart contracts (`KYCRegistry`, `ReputationRegistry`, `LoanFactory`, `LoanPool`) with proper on-chain access control grants (`VERIFIER_ROLE`, `DEFAULT_ADMIN_ROLE`, factory ownership).
3. Contract source code verification on Sepolia Etherscan with publicly visible Solidity source code, ABIs, and constructor arguments.
4. Deployment runbook detailing cloud backend provisioning (Fastify on Railway/Render), web hosting (Vercel/Netlify), and indexer polling configuration (`4000ms`).
5. Rehearsal script with deliberate security guard failure demonstrations and a multi-tier fallback matrix.

### Decision
1. **Access Control & Role Handover Protocol (`deploy.ts`)**:
   - `KYCRegistry` is instantiated with the deployer account as initial administrator.
   - `ReputationRegistry` is deployed and its ownership is transferred exclusively to `LoanFactory` via `reputation.transferOwnership(factory)`.
   - If a dedicated `VERIFIER_ADDRESS` is provided, `VERIFIER_ROLE` is granted to that address, separating identity review powers from the deployer.
   - If an `ADMIN_ADDRESS` is specified, `DEFAULT_ADMIN_ROLE` on `KYCRegistry` and `Ownable` ownership on `LoanFactory` are transferred to it.
2. **Sepolia Deployment Scripting & Manifest (`deploy:sepolia`)**:
   - Calibrates initial deployment parameters for Sepolia testnet:
     - Target: `0.1 ETH` (affordable with standard Sepolia faucet allocations).
     - Duration: `600 seconds` (10 minutes) to permit live demonstration of maturation.
     - Funding Window: `300 seconds` (5 minutes) to permit live demonstration of funding expiry.
     - Spending Cap: `0.08 ETH` with per-merchant caps (`0.05 ETH`, `0.03 ETH`).
   - Automatically writes the deployment manifest to `contracts/deployments/sepolia.json` capturing contract addresses, accounts, and block height.
3. **Automated Etherscan Verification Pipeline (`verify:sepolia` & `verify.ts`)**:
   - Created `contracts/scripts/verify.ts` reading `deployments/sepolia.json`.
   - Formulates exact constructor argument encodings for all deployed contracts.
   - Generates clickable direct Sepolia Etherscan verification URLs and CLI verification commands.
4. **Comprehensive Runbook & Live Script (`docs/SEPOLIA_DEPLOYMENT.md`)**:
   - Created `docs/SEPOLIA_DEPLOYMENT.md` with 9 complete operational phases:
     - Phase 1: Accounts, Faucets & RPC configuration.
     - Phase 2: Pre-flight quality gates (all 33 contract tests, 26 API tests, typecheck).
     - Phase 3: Smart contract deployment (`npm run chain:deploy:sepolia`).
     - Phase 4: Etherscan source verification (`npm run chain:verify:sepolia`).
     - Phase 5: Backend API deployment (Fastify on Railway/Render with `NETWORK=sepolia`).
     - Phase 6: Frontend web deployment (Vercel with `VITE_NETWORK=sepolia`).
     - Phase 7: Live 8-minute presentation walkthrough script with step-by-step cues.
     - Phase 8: Deliberate security reverts (unlisted supplier `MerchantNotApproved` revert, and vendor cap `MerchantSpendCapExceeded` revert).
     - Phase 9: Multi-tiered fallback matrix (Local Hardhat chain 31337 hot standby, and offline screen recordings).
5. **Automated Verification Test Suite (`sepolia-runbook.test.ts`)**:
   - Added automated tests in `apps/api/src/sepolia-runbook.test.ts` verifying:
     - `deploy.ts` Sepolia handling and role transfers.
     - `verify.ts` and `sepolia.example.json` schema consistency.
     - NPM scripts in root and contracts `package.json`.
     - Completeness of `SEPOLIA_DEPLOYMENT.md`.

### Status
Accepted and verified in WP10.






