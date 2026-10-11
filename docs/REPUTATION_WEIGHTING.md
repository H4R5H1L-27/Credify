# Sybil-Resistant Weighted Reputation Model

## 1. Context & Motivation

In decentralized credit protocols, linear reputation scoring (e.g. flat $+8$ points per repayment, $-20$ points per default) creates an economic vulnerability known as the **Sybil Wash-Loan Attack**:

```
Attacker creates 7 micro-loans of 0.001 ETH each
  ↓
Attacker funds their own loans using a secondary wallet
  ↓
Attacker repays all 7 micro-loans (cost: minor gas + dust interest)
  ↓
Score reaches maximum (50 + 7 * 8 = 106 → 100)
  ↓
Attacker applies for a 50 ETH loan from genuine lenders
  ↓
Attacker borrows full 50 ETH and defaults!
```

To defend against this attack vector without central identity gating, Credify introduces **Sybil-Resistant Weighted Reputation Scoring** in `contracts/contracts/reputation/WeightedReputationRegistry.sol`.

---

## 2. Mathematical Scoring Model

The weighted model adjusts score deltas based on two cryptographic on-chain metrics:
1. **Verified Principal Volume Tier ($\Delta V$)**
2. **Counterparty Diversity Tier ($D$)**

### 2.1 Volume Tier Bonus
Rather than awarding equal reputation for 0.001 ETH and 10 ETH loans, the credit score delta scales with economic commitment:

$$\Delta S_{\text{success}} = f(\text{LoanVolume})$$

| Principal Volume | Score Delta Per Success | Economic Rationale |
| :--- | :--- | :--- |
| **$< 0.1 \text{ ETH}$** (Micro-Loan) | **$+1$ point** | Prevents rapid farming via dust transactions. |
| **$0.1 \text{ to } 1.0 \text{ ETH}$** | **$+3$ points** | Standard baseline operational facility. |
| **$1.0 \text{ to } 5.0 \text{ ETH}$** | **$+6$ points** | Substantial credit commitment. |
| **$\ge 5.0 \text{ ETH}$** | **$+8$ points** | Institutional-scale syndicated commitment. |

### 2.2 Counterparty Diversity Hard Caps
A borrower's maximum attainable credit score is strictly constrained by the number of unique, non-colluding lenders ($N_{\text{unique}}$) who have participated in their repaid loans:

$$\text{Score}_{\text{max}}(N_{\text{unique}}) = \begin{cases}
65 & \text{if } N_{\text{unique}} < 2 \\
80 & \text{if } N_{\text{unique}} < 4 \\
100 & \text{if } N_{\text{unique}} \ge 4
\end{cases}$$

- **Wash-Loan Defense**: A borrower colluding with a single accomplice or recycling their own capital ($N_{\text{unique}} = 1$) can **never** exceed a reputation score of **65**, regardless of how many micro-loans they complete.
- **Top Tier Requirement**: To unlock elite reputation scores ($> 80$), a borrower must demonstrate creditworthiness across at least 4 distinct, independently verified syndicate lenders.

### 2.3 Default Penalty Asymmetry
To ensure risk aversion and discourage default:
- A single default incurs a harsh **$-25$ point penalty**.
- Defaults are not capped by diversity — they strictly penalize the borrower's record and increment the public default tally.

---

## 3. Comparative Verification

The model is formally proven in automated test suite `contracts/test/WeightedReputation.test.ts`:
- **Single-Lender Wash Attack**: 20 consecutive micro-loans funded by a single lender result in a score clamped strictly at **65**.
- **Genuine Multi-Lender Syndicate**: 4 loans funded across 4 distinct lenders with volume $\ge 1$ ETH successfully advance the score to **$\ge 80$**.
- **Default Impact**: A defaulted loan drops score by 25 points immediately.
