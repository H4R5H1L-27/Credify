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
