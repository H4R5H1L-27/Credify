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



