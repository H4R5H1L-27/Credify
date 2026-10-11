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

