# Credify Security Notes

Credify is deliberately scoped to an academic local-chain demonstration.

## Boundary decisions

- No real banking, card, identity, or payment credentials are accepted.
- Demo accounts use deterministic local-only private keys.
- Natural language is converted into validated parameters; the model never deploys arbitrary Solidity.
- Contract state transitions are explicit and terminal where appropriate.
- Critical writes use simulation before submission in the API adapter.
- Contracts use custom errors for deterministic application handling.
- Payout/refund transfers use a non-reentrancy guard and pull-payment pattern.
- Reputation writes are restricted to factory-authorized pools.
- Default is contributed-weighted voting rather than a unilateral lender action.

## Important academic disclaimer

This implementation is evidence of blockchain mechanics, not production lending infrastructure. The simplified APR and reputation formulas are chosen for demonstrability and are not financial advice or a production credit model.
