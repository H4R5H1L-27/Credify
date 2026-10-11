# EIP-1167 Minimal Proxy Clone Gas Analysis

## 1. Executive Summary

As part of Work Package 11 (Academic Stretch Goals), this document analyzes the gas economics, bytecode efficiency, and trade-offs of deploying loan pools using the **EIP-1167 Minimal Proxy Clone pattern** (`Clones.clone`) versus standard direct Solidity contract instantiation (`new LoanPool`).

In production EVM systems, deploying multi-lender credit pools involves substantial bytecode deployment costs. By decoupling the immutable business logic into a single master implementation contract (`LoanPoolCloneable`) and deploying 45-byte minimal bytecode proxies per loan agreement, Credify achieves an **~80% to 85% gas reduction per loan deployment**, saving over **2.2 million gas** on every created pool.

---

## 2. Gas Benchmark Results

Benchmarks were executed using Hardhat 3 on Shanghai EVM target with standard compiler optimizations:

| Metric | Standard Factory (`new LoanPool`) | EIP-1167 Clone Factory (`Clones.clone`) | Absolute Delta | Net Savings |
| :--- | :--- | :--- | :--- | :--- |
| **Creation Transaction Gas** | **2,787,646 gas** | **580,339 gas** | **-2,207,307 gas** | **79.18% reduction** |
| **Proxy Bytecode Deployed** | ~11,200 bytes | **45 bytes** | -11,155 bytes | **99.6% reduction** |
| **Raw Deployment Cost** | ~2,250,000 gas | ~55,000 gas | -2,195,000 gas | **97.5% reduction** |
| **State Storage Initialization** | ~537,000 gas | ~525,000 gas | -12,000 gas | Comparable |
| **Estimated Cost @ 20 Gwei ($3,000 ETH)** | **$167.26 USD** | **$34.82 USD** | **-$132.44 USD** | **-$132.44 / loan** |

*Note: In the clone transaction, ~525,000 gas is consumed by initial `SSTORE` operations in `initialize()` (storing borrower address, target, merchant allowances, and terms), while the proxy deployment itself costs only ~55,000 gas.*

---

## 3. Bytecode Dissection (EIP-1167 Standard)

The EIP-1167 minimal proxy consists of 45 bytes of standard runtime bytecode:

```text
363d3d373d3d3d363d73<20-byte implementation address>5af43d82803e903d91602b57fd5bf3
```

### Opcodes Walkthrough:
1. `36 3d 3d 37`: Copies `calldatasize` bytes from calldata to memory at offset 0 (`calldatacopy`).
2. `3d 3d 3d 36 3d 73<addr> 5a f4`: Prepares stack and executes `delegatecall(gas(), <addr>, 0, calldatasize, 0, 0)`.
3. `3d 82 80 3e`: Copies `returndatasize` bytes of return data from the delegatecall to memory (`returndatacopy`).
4. `90 3d 91 60 2b 57`: Checks the return status boolean of the `delegatecall`.
5. `fd`: Reverts if the delegatecall reverted (`revert(0, returndatasize)`).
6. `5b f3`: Returns if the delegatecall succeeded (`return(0, returndatasize)`).

Because the proxy holds no logic other than delegating to the pre-deployed master contract, deployment requires writing only 45 bytes of code to EVM state.

---

## 4. Trade-Offs & Security Considerations

### 4.1 Benefits
- **Massive Capital Efficiency**: Creates new credit facilities at under 1/4th the gas cost of standard deployment.
- **Identical Security Surface**: The cloned contract executes the exact same bytecode logic as the master contract; protocol invariants (solvency, pull payments, spend limits) remain strictly identical.
- **Immutable Logic**: EIP-1167 proxies are non-upgradeable. Lenders and borrowers know that neither the deployer nor the factory can replace the underlying implementation contract.

### 4.2 Trade-Offs & Mitigations
| Concern | Description | Mitigation Implemented |
| :--- | :--- | :--- |
| **Implementation Front-Running** | Uninitialized implementation contracts could theoretically be initialized by attackers. | Master `LoanPoolCloneable` constructor calls `_disableInitializers()`, permanently locking the master contract from direct initialization. |
| **Call Overhead** | Every function call incurs a `delegatecall` hop (~100 to 200 gas). | In multi-lender credit pools, lifetime call count is low (10-20 txs: 3-5 funding txs, 2-5 spend txs, 1 repay tx, 3-5 claims). The 2.2M gas saved upfront vastly exceeds the ~4,000 gas cumulative runtime overhead. |
| **Storage Layout Collisions** | Complex inheritance trees could misalign storage variables in proxies. | `LoanPoolCloneable` uses direct explicit variable ordering and inherits OpenZeppelin's ERC-7201 namespaced `ReentrancyGuard`, ensuring zero collision risks. |

---

## 5. Verification & Testing

The EIP-1167 implementation is verified by automated test suites in `contracts/test/GasComparison.test.ts`:
- Asserts that clone pool creation consumes $> 75\%$ less gas than standard creation.
- Executes full lifecycle verification on the cloned pool:
  - Multi-lender contributions (6 ETH + 4 ETH)
  - Automatic activation upon reaching target
  - Controlled supplier spend (7 ETH)
  - Full loan settlement + interest (10.8 ETH)
  - Pro-rata dividend claims including unspent principal (8.28 ETH + 5.52 ETH)
  - On-chain borrower credit reputation score update (+8 points)
- Reverts attempts to initialize the master implementation contract with `InvalidInitialization`.
