# Credify Demo Runbook

## Goal

Give an evaluator a reliable 6–10 minute walkthrough that proves the blockchain contribution without real money.

## Setup

```bash
npm install
```

Terminal A:

```bash
npm run chain:node
```

Terminal B:

```bash
npm run chain:deploy
```

Terminal C:

```bash
npm run dev:api
```

Check:

```bash
curl http://localhost:4100/health
curl http://localhost:4100/api/v1/demo/principals
```

## Walkthrough

### 1. Show the architecture

Use the evaluator endpoint:

```bash
curl http://localhost:4100/api/v1/evaluator/contracts
```

Explain: KYC registry, reputation registry, factory, and individual LoanPool.

### 2. Create a loan

```bash
curl -X POST http://localhost:4100/api/v1/loans \
  -H 'content-type: application/json' \
  -d '{"borrowerId":"borrower","naturalLanguageAgreement":"Create a 10 ETH academic demo loan for 14 days at 8% with an 8 ETH spending cap."}'
```

Point out that the AI-shaped natural-language layer is a parser into a validated term sheet. Raw generated Solidity is never deployed.

### 3. Fund with two lenders

Use the returned `loanId`:

```bash
curl -X POST http://localhost:4100/api/v1/loans/$LOAN/contribute \
  -H 'content-type: application/json' \
  -d '{"lenderId":"lender-alpha","amountWei":"6000000000000000000"}'

curl -X POST http://localhost:4100/api/v1/loans/$LOAN/contribute \
  -H 'content-type: application/json' \
  -d '{"lenderId":"lender-beta","amountWei":"4000000000000000000"}'
```

Then:

```bash
curl http://localhost:4100/api/v1/loans/$LOAN
curl http://localhost:4100/api/v1/loans/$LOAN/activity
```

### 4. Prove policy enforcement

Fetch merchant addresses:

```bash
curl http://localhost:4100/api/v1/evaluator/contracts
```

Try an unapproved merchant and expect a chain revert. Then use one approved merchant and observe `SpendExecuted`.

### 5. Prove repayment accounting

Repay in two chunks:

```bash
curl -X POST http://localhost:4100/api/v1/loans/$LOAN/repay \
  -H 'content-type: application/json' \
  -d '{"borrowerId":"borrower","amountWei":"5400000000000000000"}'
```

Inspect the lender claimables in the loan detail response, then claim from each lender.

### 6. Show reputation

```bash
curl http://localhost:4100/api/v1/reputation/$(curl -s http://localhost:4100/api/v1/demo/principals | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).find(x=>x.id==='borrower').walletAddress))")
```

Explain that the score changes only when a pool resolves, and the reporting caller is constrained to factory-authorized pools.

## Default scenario

For the governance path, restart the local chain and redeploy, or create a fresh pool. Fund 40% / 30% / 30%, advance local time in the chain console or a test helper, then have the 40% lender vote followed by a 30% lender. The second vote crosses the strict contributed-weight majority.

## Reset

For a complete deterministic reset, stop the local chain, start it again, redeploy, and restart the API.

The API `POST /api/v1/demo/reset` only clears and rebuilds its event projection; it does **not** rewind an EVM by itself.

## What the evaluator should understand

1. The smart contract owns the enforcement rules.
2. Multiple lenders share one on-chain pool.
3. Whitelisting is enforced by contract code.
4. Repayment claims are derived from contribution weight.
5. Default requires contributed-weighted consensus.
6. The event indexer translates immutable chain events into product-readable activity.
7. The entire environment is local/test data with no real financial exposure.
