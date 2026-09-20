# Credify UI Agent Handoff — revised

Build the Credify web application from:

- `docs/UI_GUIDE.md`
- `docs/API_CONTRACT.md`
- `docs/BLUEPRINT.md`

This handoff **replaces the previous 3D/confluence visual direction**.

## Product priority

The goal is a polished academic blockchain product demo that feels like mature SaaS/fintech software. The UI should make the workflow and blockchain mechanics understandable.

Do not create a “crypto aesthetic” just because the product is blockchain-based.

## Core implementation rule

**Build one excellent end-to-end workflow before expanding the number of screens.**

Start here:

`Demo login → Overview → Loan detail → Contribute → Transaction lifecycle → Activity evidence`

Then add creation, restricted spending, repayment, governance, verification, and evaluator surfaces.

## Component strategy

Prefer established open-source components and customize them.

Primary source:

```bash
npx shadcn@latest init
npx shadcn@latest add sidebar button badge card input textarea select tabs dialog sheet dropdown-menu tooltip table skeleton alert breadcrumb command
```

Add charts only where needed:

```bash
npx shadcn@latest add chart
npm i recharts
```

For application behavior:

```bash
npm i motion @tanstack/react-query lucide-react
```

Do not install a huge UI kit when a few copied components will do.

Use Radix primitives where needed for accessible dialogs, popovers, dropdowns, focus management, etc.

## Visual direction

Use:

- neutral canvas
- white surfaces
- subtle borders
- modest radius
- one restrained Credify accent
- clear status colors
- strong typography
- small technical monospace areas

Avoid:

- neon gradients
- glowing cards
- permanent particles
- spinning 3D objects
- floating coins/tokens
- confetti
- excessive glassmorphism
- giant “blockchain” headings

## Do not build custom graphics by default

Use the actual UI as the hero visual on the landing page.

For blockchain explanation use:

- timelines
- state rails
- contribution bars
- compact charts
- expandable raw event panels

3D is optional only if an existing open-source/lightweight component genuinely improves the explanation. It is not a required Credify component.

## Data rules

Use real API responses from the backend. Do not invent blockchain state in the client.

Use TanStack Query for server state. After a confirmed mutation:

1. show confirmation
2. invalidate/refetch affected aggregate
3. wait for projected activity state
4. reveal the new event row

## Demo rules

Demo Mode must be first-class.

No real money.
No real credentials.
No wallet setup required for the evaluator path.
Use the seeded demo principals and local-chain data exposed by the backend.

The UI must clearly say values are simulated / academic demo values.

## Blockchain explanation rules

Technical details should always have semantic context.

Example:

**Loan activated**

Funding reached the contract target. The pool transitioned from Funding to Active.

`Block 182 · LoanActivated · tx 0x8a4…c12`

The evaluator can expand the raw details.

## Motion

Use Motion for:

- route transitions
- dialogs/sheets
- progress changes
- list insertion/removal
- transaction state transitions
- tab movement

Do not animate continuously unless the motion is communicating live state.

Respect `prefers-reduced-motion`.

## Acceptance test

The UI is not finished because all routes exist.

It is finished when an evaluator can:

1. enter Demo Mode
2. understand the current loan
3. contribute as a lender
4. watch the transaction lifecycle
5. see funding update
6. inspect the on-chain activity
7. perform a restricted spend
8. attempt an invalid spend and understand why it fails
9. record repayment
10. inspect pro-rata lender allocation
11. inspect governance / default state
12. inspect verification evidence

Every primary button needs a meaningful result.
