# Credify API Contract

Base URL: `http://localhost:4100`

All write routes accept `application/json`. Demo identity is explicit in the payload so a UI can switch personas without wallet ceremony.

## Read model

`GET /api/v1/loans`

Returns the complete loan summary used by the application overview and loan list. The endpoint is intentionally aggregate-heavy so the UI does not need dozens of RPC calls to render one card.

`GET /api/v1/loans/:pool`

Returns borrower, status, funding progress, repayment progress, lender allocation, approved merchant addresses, and core terms.

`GET /api/v1/loans/:pool/activity`

Returns normalized blockchain events with transaction hash and block number plus a human-readable interpretation.

`GET /api/v1/reputation/:address`

Returns the current on-chain score and outcome counters.

`GET /api/v1/evaluator/contracts`

Returns local chain + deployed contract addresses for the evaluator view.

## Mutations

`POST /api/v1/loans`

```json
{
  "borrowerId": "borrower",
  "naturalLanguageAgreement": "Create a 10 ETH academic demo loan for 14 days at 8% with an 8 ETH spending cap."
}
```

`POST /api/v1/loans/:pool/contribute`

```json
{ "lenderId": "lender-alpha", "amountWei": "6000000000000000000" }
```

`POST /api/v1/loans/:pool/spend`

```json
{
  "borrowerId": "borrower",
  "merchant": "0x...",
  "amountWei": "2000000000000000000",
  "category": "equipment"
}
```

`POST /api/v1/loans/:pool/repay`

```json
{ "borrowerId": "borrower", "amountWei": "5400000000000000000" }
```

`POST /api/v1/loans/:pool/claim`

```json
{ "lenderId": "lender-alpha" }
```

`POST /api/v1/loans/:pool/default-vote`

```json
{ "lenderId": "lender-alpha" }
```

## State semantics

The create-loan flow can use a deterministic demo parser by default, or an optional Gemini adapter. In either case, the resulting term sheet is validated locally before it reaches the factory. Raw model output cannot become executable contract code.

The backend deliberately distinguishes:

- API accepted — request validation succeeded.
- Simulated — chain simulation succeeded.
- Submitted — transaction hash exists.
- Confirmed — receipt exists.
- Projected — event indexer has incorporated the confirmed event.

A future UI should expose these as a short transaction lifecycle instead of one generic “success” toast.

## Error contract

Write failures should be rendered as a stable object:

```json
{
  "code": "CHAIN_REVERT",
  "message": "...",
  "requestId": "req_..."
}
```

Domain codes to preserve in the UI include `UNKNOWN_PRINCIPAL`, `UNKNOWN_MERCHANT`, `CHAIN_REVERT`, and `REQUEST_FAILED`.
