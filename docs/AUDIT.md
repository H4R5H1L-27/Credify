# Credify Audit — 18 September 2026

## Repository availability

The supplied workspace did **not** contain the previously generated Credify repository, ZIP, Git history, contract files, or frontend scaffold. The only available artifact was the prior planning transcript. That transcript describes a previous scaffold and reported 15 checks passing, but those implementation files are not present in this workspace and therefore cannot be independently inspected or verified here.

## Audit conclusion

Do not patch an unavailable codebase. Rebuild from first principles using the documented product intent as the reference.

## Source-derived requirements

The prior material identifies:
- the core problem as multiple lenders funding one loan;
- a desire for custom mutual agreements;
- borrower spending restrictions;
- verification;
- blockchain-backed functionality;
- a free/local demo requirement;
- the safer natural-language → parameters → fixed contract factory approach;
- contributed-weighted default voting;
- on-chain reputation and transparent events;
- a future UI guide with a confluence visual concept.

See the original supplied material for those requirements. fileciteturn0file0L1-L8 fileciteturn0file0L20-L29

## Keep

- Multi-lender pooled funding.
- Escrow semantics.
- Restricted spend policy.
- Pro-rata repayment claims.
- Weighted default governance.
- Reputation outcome loop.
- Event-oriented auditability.
- Local-chain-first demo.

## Refactor

- Smart contracts into KYC, reputation, factory, and per-loan pool responsibilities.
- Backend into HTTP → application service → chain adapter → event projection layers.
- UI/backend contract into aggregate reads to reduce request chatter.

## Replace

- Raw LLM-generated contract deployment with validated terms fed to a fixed template factory.
- Unilateral default with contributed-weighted majority.
- Monolithic UI concept with separate journeys.

## Remove

- Any requirement for real currency.
- Any requirement for real financial credentials.
- Any dependency on a public testnet for the normal demo path.
- Decorative blockchain terminology without contract-backed behavior.

## Add

- Deterministic demo accounts.
- Demo scenario/reset runbook.
- Explicit chain lifecycle states.
- Event indexer/projection.
- Stable API error shape.
- Evaluator contract/event endpoints.
- UI build guide tied to the actual API and contract events.
