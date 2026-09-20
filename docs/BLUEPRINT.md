# Credify Product + Implementation Blueprint

## 1. Product concept

Credify is a controlled academic demonstration of a real product pattern: a borrower requests a loan, several lenders collectively fund one on-chain escrow, programmable spending rules constrain disbursement, repayment is split according to each lender's contributed share, and outcomes create an auditable reputation history.

The core demonstration value is not “crypto lending”. It is **programmable agreement + shared state + transparent enforcement**.

## 2. Target users

### Borrower
Wants a clear path from request → funding → controlled spending → repayment.

### Lender
Wants to inspect terms, contribution share, pool state, repayment history, and default governance without trusting a central ledger.

### Evaluator / professor
Needs to understand where blockchain is essential, replay the demo deterministically, and inspect contract events and tests.

### Demo operator
Needs one-command reset/seed capability and no real wallet, funds, or credentials.

## 3. Core problem

The prior project framing identifies the central problem as “multiple lenders funding the same loan.” The implementation must make the blockchain contribution material rather than cosmetic. fileciteturn0file0L1-L8

## 4. Core workflows

### Workflow A — create a governed loan
Entry: borrower dashboard / demo scenario.

1. Borrower enters a natural-language agreement.
2. Parser converts the text into typed terms: target, duration, APR/demo rate, spend policy, merchant whitelist, and default quorum.
3. User reviews a human-readable term sheet.
4. API calls `LoanFactory` with those parameters.
5. UI shows wallet/chain submission → confirmation.
6. New pool appears in activity and dashboard.

### Workflow B — multi-lender funding
1. Lender opens a loan.
2. Reads terms and current funding progress.
3. Contributes a chosen demo amount.
4. Chain confirms the contribution.
5. When target is met, pool transitions to Active exactly once.
6. Activity timeline explains `Funded` and `LoanActivated` events.

### Workflow C — restricted spending
1. Borrower opens an active loan.
2. Chooses an approved merchant.
3. Requests a spend amount.
4. Contract rejects any unapproved merchant or over-limit attempt.
5. Approved spend creates an auditable event.
6. UI shows policy enforcement as a blockchain rule, not a dashboard toggle.

### Workflow D — repayment + pro-rata distribution
1. Borrower records a demo repayment.
2. Pool tracks total repaid.
3. Lenders see their claimable amounts based on contribution weight.
4. Each lender pulls their allocation.
5. Activity explains partial vs full repayment.
6. A successful resolution updates borrower reputation.

### Workflow E — default governance
1. Pool reaches its maturity / default condition.
2. Lenders vote using contributed-weighted power.
3. UI displays quorum progress.
4. A strict majority of contributed value triggers default.
5. `LoanDefaulted` is emitted.
6. Reputation is updated with a documented outcome.

### Workflow F — public verification / audit
1. User selects a loan or event.
2. API returns contract address, event name, block number, transaction hash, and structured interpretation.
3. UI explains what is immutable and what remains off-chain.

## 5. Information architecture

Public:
- Marketing / product story
- How blockchain works in Credify
- Demo entry

Authenticated app:
- Overview
- Loans
- Loan detail
- Activity
- Reputation
- Verification
- Settings / demo profile

Evaluator utilities:
- Demo scenario picker
- Chain health
- Contract addresses
- Event inspector

## 6. Route map for future UI

```text
/
├── /how-it-works
├── /demo
├── /auth/login
├── /auth/onboarding
└── /app
    ├── /overview
    ├── /loans
    ├── /loans/:loanId
    ├── /activity
    ├── /reputation
    ├── /verify/:loanId
    ├── /settings
    └── /demo/evaluator
```

## 7. Authentication architecture

For the academic demo, authentication should be an **identity selection + session abstraction**, not a real KYC system. Real credentials must never be collected. A future production variant would replace the demo identity provider with an external identity provider and scoped session tokens.

The backend should remain wallet-aware without making a wallet mandatory for a presentation run.

## 8. Dashboard architecture

The future dashboard should answer five questions in order:

1. What is my current status?
2. What changed?
3. What needs action?
4. What happened on-chain?
5. What can I inspect next?

Prioritize a focused overview over an “everything dashboard”. Detailed charts belong on loan analytics and reputation views.

## 9. Blockchain architecture

```text
Natural language
      ↓
Term parser (demo heuristic or optional Gemini adapter)
      ↓
Strict schema validation
      ↓
Validated TermSheet
      ↓
LoanFactory
      ↓
LoanPool instance
      ├── KYCRegistry gate
      ├── escrow / funding
      ├── spend policy
      ├── repayment accounting
      ├── weighted default voting
      └── resolution report
              ↓
      ReputationRegistry
              ↓
        emitted events
              ↓
        API event indexer
              ↓
      UI activity / proof views
```

The fixed contract-template approach follows the prior design's safer NL→parameters→factory direction instead of deploying raw LLM-generated Solidity. fileciteturn0file0L20-L29

## 10. Data model

### Domain entities
- `DemoPrincipal`: id, displayName, role, walletAddress, verification state
- `Loan`: id, chain address, borrower, terms, status, funding, maturity, outcome
- `Contribution`: loanId, lender, amount, share, txHash
- `Spend`: loanId, merchant, amount, category, txHash
- `Repayment`: loanId, amount, payer, txHash
- `ActivityEvent`: chain metadata + normalized semantic event
- `ReputationSnapshot`: borrower, score, reasons, source loan ids
- `DemoScenario`: named deterministic seed state

## 11. Component architecture

Backend layers:

```text
HTTP routes
  → application services
    → repositories / projection store
    → chain ports
      → viem public/wallet clients
      → deployed contracts
```

No route handler should know raw Solidity event signatures. The chain adapter owns that translation.

## 12. Design system (UI contract)

Intent: **mature SaaS / fintech operations product**, not crypto spectacle.

Use reputable open-source components as the foundation and customize their tokens, composition, and domain content for Credify. Prefer shadcn/ui-style copied components, Radix primitives for accessible interaction behavior, Lucide for icons, and Recharts for data visualization.

Typography: one contemporary sans family, 2–3 weights, generous line-height. Use monospace only for wallet/contract/transaction metadata.

Color: near-black ink, soft neutral canvas, white surfaces, one restrained Credify accent, and semantic green/amber/red states. Blockchain evidence uses the same Credify accent instead of a separate neon treatment.

Spacing: 4/8 px rhythm. Radius and shadows should be consistent and modest.

Surfaces: mostly flat, thin borders, shallow elevation for floating layers. No permanent glow, glassmorphism, or ambient particle field.

Charts: sparse, labeled, and used only when they answer a concrete question.

## 13. Animation strategy

Motion should make the product feel responsive rather than theatrical:

- route changes: 160–220 ms
- panel/dialog entrance: 220–300 ms
- workflow state change: 300–420 ms
- chain pending: restrained 1.4–2.0 s status pulse
- confirmed transaction: lifecycle morph → projected activity row
- list insertion: short fade/translate once

Do not build a custom 3D “signature” component. 3D is optional and should only be used if an existing lightweight open-source component materially improves explanation.

Respect `prefers-reduced-motion`.

Motion for React is appropriate for declarative app transitions and supports enter/exit, layout, and gesture primitives.

TanStack Query is a good future server-state layer because it provides keyed queries, caching, and invalidation without forcing all async data into global client state. citeturn231447search0turn231447search2

## 14. Demo strategy

Default mode uses only local chain + deterministic seeded actors. The evaluator can reset to a known state, run the multi-lender flow, inspect an on-chain event, and return to the dashboard.

A future Sepolia adapter may exist only as an optional showcase, never as a requirement.

## 15. Implementation phases

0. Audit — completed for the available workspace.
1. Product blueprint — this document.
2. Contract core + tests — rebuilt.
3. API + event projection — rebuilt.
4. Demo seeding + runbook — rebuilt.
5. Future UI against stable API contract.
6. Motion/3D polish.
7. QA, accessibility, evaluator walkthrough.

## 16. Technical risks

- Contract upgradeability complexity is intentionally avoided.
- LLM-generated Solidity is intentionally avoided.
- Event projection can become stale; the API exposes chain health and reindex/reset operations for demo use.
- Local account keys are demo-only and never suitable for real funds.

## 17. UX risks

- Overloading the dashboard with all blockchain details.
- Making chain activity unreadable to non-Web3 evaluators.
- Showing technical hashes without context.
- Confusing “pending” chain state with API success.

The UI guide addresses these with progressive disclosure and semantic translations.

## 18. Recommended improvements over the prior attempt

Kept:
- multi-lender escrow
- spending restrictions
- reputation loop
- weighted default voting
- parameterized factory

Refactored:
- contract responsibilities into distinct registries/factory/pool
- backend into chain adapter + domain services + projection
- API reads into compact aggregate endpoints

Replaced:
- arbitrary frontend scaffold with a UI contract that follows the real backend
- unilateral default with contributed-weighted governance

Removed:
- real-money dependencies
- unaudited NL-generated Solidity deployment
- unnecessary public-testnet requirements

Added:
- deterministic demo scenarios
- event projection
- explicit API error codes
- idempotent demo reset
- evaluator/debug endpoints
