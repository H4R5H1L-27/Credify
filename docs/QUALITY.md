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


