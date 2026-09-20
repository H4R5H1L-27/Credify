# Credify UI Guide v2 — Product-First, Component-Driven

This replaces the previous UI direction.

The previous guide over-invested in an invented visual metaphor and a custom 3D signature component. That is the wrong trade-off for Credify: this is an academic product demo, so the UI should spend its complexity budget on **clarity, believable workflows, polished states, and showing the blockchain mechanics well**.

## 1. The new design thesis

### Credify should feel like a serious product operations console

Think:

- calm fintech / SaaS information density
- excellent hierarchy
- strong tables and detail views
- fast task completion
- restrained motion
- occasional editorial storytelling on the public site
- blockchain data exposed as evidence, not decoration

The visual target is **“a mature product that happens to use blockchain”**, not “a crypto website”.

The UI should be closer in spirit to high-craft software dashboards such as Linear’s deliberately quiet information hierarchy and Stripe-style operational dashboards than to neon Web3 landing pages. Linear explicitly describes its current refresh as trying to preserve information density without overwhelming users, with secondary navigation receding so the working surface gets priority. Stripe describes its Dashboard as the place to manage and operate an account with useful at-a-glance information. These are useful interaction patterns to study, not visual assets to copy. See the research links at the end of this document.

## 2. Absolute visual rules

### Do

- Use a restrained neutral foundation with one identifiable Credify accent.
- Make state and information hierarchy do most of the visual work.
- Use real component primitives from reputable libraries and modify them.
- Use a consistent 4/8px spacing rhythm.
- Use compact data density where it helps the evaluator.
- Reserve large type for page titles, key totals, and marketing moments.
- Use subtle elevation and borders instead of stacked shadows.
- Make important blockchain state visually recognizable but never theatrical.
- Make interaction feedback immediate and purposeful.

### Do not

- Do not create a custom 3D object as the product’s visual identity.
- Do not make “blockchain” synonymous with a glowing network of particles.
- Do not use permanent animated backgrounds behind application content.
- Do not put six giant metric cards above every page.
- Do not turn hashes and technical metadata into the main visual focal point.
- Do not use confetti for blockchain confirmation.
- Do not put charts on a page merely because a chart component exists.
- Do not build every component from scratch when a good accessible component already exists.
- Do not copy another company’s brand, logo, illustrations, proprietary screenshots, or exact page composition.

## 3. Component strategy: borrow the good parts

For an academic project, using mature open-source UI building blocks is not a shortcut; it is the sensible engineering choice. The custom work should be **composition, content model, state behavior, responsive behavior, and Credify-specific styling**.

### Primary component source

Use **shadcn/ui** as the main source for application components because its official library provides composable, themeable components and guides for sidebars, data tables, charts, dialogs, forms, etc. Its components are copied into the project and remain customizable rather than being a black box. Use only the pieces needed by Credify.

Recommended initial components:

- Sidebar
- Button
- Badge
- Card
- Input
- Textarea
- Select
- Tabs
- Dialog
- Sheet
- Dropdown Menu
- Tooltip
- Toast / Sonner pattern
- Table
- Data Table patterns
- Chart
- Skeleton
- Alert / Callout
- Breadcrumb
- Command palette

Official references:
- https://ui.shadcn.com/docs/components
- https://ui.shadcn.com/docs/components/base/sidebar
- https://ui.shadcn.com/docs/components/base/data-table
- https://ui.shadcn.com/docs/components/base/chart

### Accessibility primitives

Use Radix primitives where a shadcn component or custom composition needs accessible behavior such as dialogs, popovers, dropdowns, focus management, or keyboard navigation. Radix provides unstyled accessible primitives designed for high-quality application UIs.

Reference:
- https://www.radix-ui.com/primitives/docs/components

### Icons

Use Lucide icons consistently. Icons should be small, aligned to text, and communicate actions/status; they are not decoration.

Reference:
- https://lucide.dev/

### Charts

Use Recharts through the shadcn chart patterns. Keep charts small, labeled, and tied to a question. Do not build a custom visualization system.

Reference:
- https://ui.shadcn.com/docs/components/base/chart

### Animation

Use Motion for React for page transitions, shared layout changes, list entrance, progress/state morphs, and gesture feedback. Motion supports enter/exit animation and layout/gesture primitives; use it as a thin enhancement layer, not as the foundation of the UI.

Reference:
- https://motion.dev/docs/react

### Data fetching

Use TanStack Query for API queries, mutations, caching, and invalidation. After a chain mutation is confirmed, refetch/invalidate the affected aggregate and activity projections so the UI does not invent local blockchain state.

Reference:
- https://tanstack.com/query/latest/docs/framework/react/quick-start

## 4. Credify visual language

### Overall character

**Quiet confidence.** The product should feel precise, technical, and trustworthy without pretending to be a bank or a live financial service.

### Color

Use a mostly neutral palette:

- canvas: very light warm gray / cool paper
- surface: white
- elevated surface: slightly darker neutral
- primary ink: near-black
- secondary ink: muted gray
- border: low-contrast gray
- Credify accent: a restrained blue-violet or blue-green family
- success: green
- warning: amber
- danger: red
- blockchain evidence: same Credify accent, not a separate neon color

The accent should appear in selected navigation, active controls, links, progress, and blockchain evidence markers. It should not wash over the entire page.

### Typography

Use one strong sans family, with a compact monospace only for:

- wallet addresses
- transaction hashes
- block numbers
- contract addresses

Suggested hierarchy:

- page title: 28–32px / 600
- section title: 18–22px / 600
- card title: 14–16px / 600
- body: 14–15px
- helper/meta: 12–13px
- technical metadata: 11–12px monospace

The UI should look comfortable at 100% browser zoom and remain readable when scaled up.

### Geometry

- 4px base unit
- 8px standard gap
- 12px compact radius
- 16px card radius
- 20px feature container radius only where it genuinely helps hierarchy
- 1px borders
- shallow shadows only for floating layers

Avoid “everything is a pill”. Pills are for compact status, not for every button or container.

## 5. Application shell

### Desktop

Use a fixed left navigation with a calm visual presence. The main content should own the visual weight.

Recommended structure:

```text
┌────────────────────────────────────────────────────────────────┐
│ Credify / Demo workspace                         profile / ⌄   │
├──────────────┬─────────────────────────────────────────────────┤
│ Overview     │ Page title                     primary action    │
│ Loans        │ subtitle / context                               │
│ Activity     │                                                 │
│ Reputation   │ ┌───────────────┐ ┌───────────────────────────┐ │
│ Verify       │ │ key status    │ │ current attention         │ │
│              │ │ / next step   │ │ / action                  │ │
│              │ └───────────────┘ └───────────────────────────┘ │
│              │                                                 │
│              │ main content                                    │
│              │                                                 │
│              │ recent activity / evidence                      │
└──────────────┴─────────────────────────────────────────────────┘
```

Use the official shadcn sidebar pattern rather than inventing a sidebar framework. The sidebar is a navigation tool, not a decorative side panel.

### Mobile

The desktop sidebar becomes a sheet/drawer. Keep a compact top bar with:

- menu
- page title or breadcrumb
- one primary page action when needed

Do not keep a miniature desktop sidebar visible on narrow screens.

## 6. Navigation architecture

Public:

```text
/
├── /how-it-works
├── /demo
├── /auth/login
└── /auth/onboarding
```

Authenticated:

```text
/app/overview
/app/loans
/app/loans/:loanId
/app/activity
/app/reputation
/app/verify/:loanId
/app/settings
/app/demo/evaluator
```

Keep the number of primary navigation items small. A page belongs in the sidebar only if users should return to it repeatedly.

## 7. Landing page: product site, not dashboard cosplay

The marketing experience should not visually resemble the authenticated app.

### Hero

Use a large, simple statement:

**“Shared agreements, enforced by code.”**

Supporting copy should immediately explain the academic purpose:

“Credify demonstrates how a multi-lender agreement can move from human-readable terms to a parameterized on-chain contract, with programmable spending, repayments, and auditable events.”

Primary CTA: **Explore the demo**
Secondary CTA: **See how the chain works**

### Hero visual

Do **not** create a custom illustration from scratch.

Instead, compose a polished product preview from the actual UI:

- one loan summary panel
- a funding progress bar
- 3 lender contribution rows
- a small blockchain event feed
- one “Recorded on demo chain” evidence marker

This is more credible because the marketing page shows the actual product language.

A subtle grid, texture, or abstract background from a permissively licensed / open-source library is acceptable, but keep it static or near-static.

### Story sections

1. Problem: multiple lenders, one agreement, shared state.
2. Product: define and review terms.
3. Enforcement: contract controls funding and spend policy.
4. Evidence: events make the state inspectable.
5. Resolution: repayment or default updates the record.
6. Demo disclosure: clearly state that all values are simulated and no real funds are involved.

### Interactive section

Use a simple stepper:

`Define → Fund → Enforce → Repay → Verify`

When the evaluator changes the step, the product preview changes content. This is enough motion; no 3D scene is required.

## 8. Authentication

Authentication should feel like a separate product surface.

Layout:

```text
┌──────────────────────────────────────┐
│ Credify                              │
│ Academic demo workspace              │
│                                      │
│ Welcome back                         │
│ [ email / demo identity ]            │
│ [ password ]                         │
│                                      │
│ [ Continue ]                         │
│                                      │
│ ───────── or ─────────               │
│ [ Continue with Demo Workspace ]     │
│                                      │
│ Demo • local/test environment        │
└──────────────────────────────────────┘
```

The demo path should be first-class. Never force the evaluator through wallet configuration just to explore the product.

## 9. Dashboard: answer questions, not “fill space”

The overview page should answer:

1. What is the current workspace state?
2. What needs attention?
3. What changed recently?
4. What is happening on-chain?
5. What is the next useful action?

### Recommended overview layout

```text
Page header
  Demo Workspace · Borrower
  “Your active agreement is 60% funded.”
  [View active loan]

Primary row
  ┌────────────────────────┐  ┌─────────────────────────────┐
  │ Current credibility    │  │ Action needed               │
  │ 82 / 100               │  │ Funding is still open       │
  │ on-chain history       │  │ 4 ETH remaining             │
  └────────────────────────┘  │ [Open loan]                 │
                              └─────────────────────────────┘

Main row
  ┌─────────────────────────────────────────────────────────┐
  │ Funding / repayment trend                               │
  │ compact chart with annotations                           │
  └─────────────────────────────────────────────────────────┘

Lower row
  ┌──────────────────────────────┐ ┌────────────────────────┐
  │ Recent loans                 │ │ Recent chain activity   │
  │ table/list                   │ │ event timeline          │
  └──────────────────────────────┘ └────────────────────────┘
```

Do not put reputation, funding, repayment, governance, and chain stats all into individual hero cards. Group related information.

## 10. Loans list

Make this a work surface.

Recommended columns:

- Loan
- Role
- Status
- Target
- Funded
- Repayment
- Maturity
- Updated
- action menu

Add:

- search
- status filter
- role filter
- sort
- pagination only if actually needed

On mobile, transform rows into compact cards with the same information hierarchy. Do not simply allow a six-column table to overflow the viewport.

## 11. Loan detail: the main product screen

This should be the best-designed authenticated page because it hosts the main demonstration workflow.

### Header

```text
← Loans
Academic equipment loan                        ACTIVE
Borrower: Maya Rao · Pool 0x8d…a71

[Contribute] [Record repayment] [More]
```

### First band: current state

```text
Funding
7.0 / 10.0 demo ETH                         70%
███████████████████░░░░░░

Next milestone
Loan activates when the target is reached.
```

### Main content tabs

**Overview**
- agreement terms
- lender composition
- spending policy
- next action

**Activity**
- normalized contract events
- transaction / block evidence
- filters by event type

**Governance**
- lender voting weight
- default vote state
- threshold explanation

The tabs keep one page from becoming a giant vertical document.

### Plain-language blockchain evidence

Always pair raw data with meaning.

Good:

**Loan activated**

“Funding reached the contract target. The LoanPool is now in the Active state.”

`Block 182 · tx 0x8a4…c12 · LoanActivated`

Then allow “View raw event” to expose technical details.

## 12. Core workflow UI patterns

### A. Create agreement

Use a 2-step flow:

**Step 1 — Describe it**

Large text area for the natural-language agreement.

**Step 2 — Review terms**

Show the parsed term sheet in editable fields:

- target
- duration
- rate/demo rate
- spending cap
- categories
- merchant allowlist
- default quorum

Primary action: **Create demo agreement**

Never put a raw AI response on the screen. Present a structured, validated term sheet.

### B. Contribute

Use a dialog/sheet:

- current funding
- your amount
- resulting share
- remaining amount to target
- clear demo-chain notice

Confirmation screen:

`Simulating → Submitted → Confirmed → Recorded`

The final state only appears after the aggregate/projected API state reflects the event.

### C. Restricted spend

Make the policy visible **before** the action.

Example:

```text
Spend policy
✓ Equipment merchants
✓ Approved supplier
✕ Unapproved merchant

Available under policy: 3.5 demo ETH
```

When a user tries an invalid merchant, the UI should show the contract-enforced reason:

**Spend blocked by contract policy**

“0x… is not on the approved merchant list.”

This is one of the strongest teaching moments in the product.

### D. Repayment

Show:

- amount to repay
- total repaid
- lender allocation preview
- borrower balance remaining

After confirmation, reveal the pro-rata split as data:

```text
Lender Alpha     60%     3.24 demo ETH claimable
Lender Beta      40%     2.16 demo ETH claimable
```

### E. Default governance

Make the voting math understandable.

```text
Default vote
Current support: 40%
Required: > 50% of contributed value

Alpha      ████████████░░  40%
Beta       ████████░░░░░░  30%
Gamma      ████████░░░░░░  30%
```

The bar should make it obvious that governance power is weighted by contributed amount, not one-person-one-vote.

### F. Verification / audit

Create a dedicated verification view that can be shown to an evaluator.

Sections:

1. agreement identity
2. contract address
3. current state
4. important events
5. event hashes / transaction hashes
6. plain-language explanation
7. local-chain disclosure

This is where technical evidence belongs — not scattered throughout every page.

## 13. Blockchain UI language

Use blockchain terms when they teach something.

Preferred:

- “Recorded on the local demo chain”
- “Contract state updated”
- “Transaction confirmed”
- “Event indexed”
- “Spend blocked by contract policy”
- “Weighted vote recorded”

Avoid:

- “Trustless future finance”
- “Blockchain magic”
- “Next-gen DeFi revolution”
- “Guaranteed”
- “Fully decentralized” unless the exact architecture supports the claim
- “Gasless” unless it is technically true

## 14. Motion strategy — make it feel fast, not animated

The feeling of quality should come from **responsive state transitions**, not lots of movement.

### Use Motion for

- route transitions
- dialog/sheet entrance
- list insertion/removal
- tab indicator movement
- progress changes
- expanding technical details
- transaction lifecycle transitions
- hover/focus refinement when it adds meaning

### Suggested timing

- hover/press: 100–160ms
- normal UI transition: 160–220ms
- panel enter: 220–300ms
- workflow state change: 300–420ms
- chain pending indicator: slow 1.4–2.0s pulse

### The key trick

After a blockchain mutation:

```text
button
  ↓
processing state
  ↓
confirmed state
  ↓
projection refresh
  ↓
new activity row appears
```

Animate that sequence once. Do not continuously animate the whole page.

### Reduced motion

Respect `prefers-reduced-motion`. Replace state movement with instant or opacity-only transitions.

## 15. Visualizing blockchain data without custom graphics

This is intentionally different from the old guide.

You do **not** need a custom WebGL scene.

The preferred visualization toolkit is already available in normal UI libraries:

### Use a transaction/event timeline

A vertical timeline with:

- event icon
- semantic title
- human explanation
- timestamp
- block number
- transaction hash

This communicates blockchain state better than abstract particles.

### Use contribution bars

For lenders, use proportionally sized bars and percentages.

### Use state diagrams

For the loan lifecycle:

`Created → Funding → Active → Repaid / Defaulted`

Use a compact stepper / status rail.

### Use charts where they add analytical value

Examples:

- funding progress over time
- repayment accumulation
- reputation history across resolved loans

### Optional decorative motion

A tiny, low-opacity SVG line/grid texture can be used on marketing backgrounds, but it should be static by default.

## 16. 3D policy

3D is **optional**, not a design requirement.

Only add 3D if the UI agent finds an existing lightweight component/library effect that improves the demo story and can be dropped without making the application harder to understand.

Good uses:

- a subtle landing-page depth effect
- a small interactive “contract → events” explainer

Bad uses:

- persistent 3D object behind dashboard content
- spinning blockchain globe
- floating coins/tokens
- 3D replacing a table/timeline that already communicates the information better

If 3D is added, keep it behind the informational hierarchy and provide a non-3D fallback.

## 17. Landing-page visual resources

Do not draw custom illustrations unless there is a real product reason.

Prefer, in order:

1. actual Credify UI screenshots / composed mockups
2. open-source icon sets
3. simple CSS shapes / grids
4. permissively licensed abstract SVGs
5. reputable open-source animation components

Any third-party component should be checked for license and copied into the project where appropriate. The UI should still look like one Credify system after customization.

## 18. Tables, cards, and density rules

### Cards

A card needs a job:

- summarize
- group controls
- show evidence
- contain an interaction

Do not turn every sentence into a card.

### Tables

Use when users compare rows.

Use a table for:

- loans
- lender allocations
- activity logs
- verification evidence

Use cards for:

- mobile lender rows
- compact status summaries
- action confirmations

### Charts

A chart should answer a specific question and have:

- title
- unit
- timeframe
- visible annotation for important changes
- accessible text alternative or table view

## 19. Demo Mode

Demo mode must be visually obvious but not ugly.

Use a small top-bar/workspace indicator:

`DEMO • Local chain`

Clicking it opens:

- active persona
- seeded scenario
- reset scenario
- chain health
- contract addresses

Do not put a giant “DEMO MODE” banner across every page.

## 20. Error, loading, and empty states

Every data-backed component needs a real state for:

- loading
- empty
- error
- stale / refreshing
- transaction pending
- transaction reverted
- projected event delayed

### Loading

Prefer skeletons that match final geometry.

### Error

Explain the user-relevant cause first, then allow technical detail.

### Empty

Tell the user what should happen next.

Bad:

“No data.”

Good:

“No loans yet. Create a demo agreement to start the funding workflow.”

## 21. Responsive rules

### ≥ 1200px

- full sidebar
- 2-column detail sections where useful
- tables visible
- charts at comfortable width

### 768–1199px

- narrower sidebar / collapsible navigation
- two-column cards collapse selectively
- detail page remains structured
- tables can horizontally scroll only when the information genuinely needs tabular comparison

### < 768px

- drawer navigation
- single-column page content
- action bar becomes stacked or sticky bottom sheet when appropriate
- lender tables become cards
- event metadata collapses behind a disclosure row
- charts reduce labels rather than becoming tiny

Do not simply shrink desktop typography until everything fits.

## 22. Accessibility rules

Minimum bar:

- semantic HTML
- keyboard navigation for all actions
- visible focus state
- labels on every input
- errors linked to inputs
- state not conveyed by color alone
- sufficient contrast
- touch targets around 44px
- reduced-motion support
- dialogs trap focus correctly
- screen-reader text for icon-only buttons
- event timeline remains understandable when color/animation is removed

## 23. Suggested component inventory

### Foundation

`AppShell`
`PageHeader`
`SectionHeader`
`Breadcrumbs`
`StatusBadge`
`ButtonGroup`
`CopyButton`
`ConfirmDialog`
`CommandMenu`

### Domain

`LoanStatus`
`FundingProgress`
`LenderAllocationTable`
`SpendPolicyCard`
`RepaymentSummary`
`DefaultVotePanel`
`ReputationSummary`
`ChainEventTimeline`
`ChainEvidence`
`TransactionLifecycle`
`DemoWorkspaceMenu`
`EvaluatorPanel`

### System states

`SkeletonBlock`
`InlineError`
`EmptyState`
`PendingState`
`SuccessState`
`RevertedState`

Build the domain components from the base library components. Avoid a separate custom design system package until repeated patterns prove it is necessary.

## 24. Implementation order

The separate UI agent should build in this order:

### Phase 1 — application foundation

1. Vite/React/TypeScript setup
2. shadcn component baseline
3. tokens / theme
4. router
5. TanStack Query provider
6. app shell + mobile navigation

### Phase 2 — one complete workflow

Build only:

`login → overview → loan detail → contribute → confirmation → activity`

Do not move to secondary pages until this feels excellent.

### Phase 3 — the rest of the core workflow

Add:

`create agreement → restricted spend → repayment → claim → default vote`

### Phase 4 — evaluator surfaces

Add:

- activity explorer
- verification
- evaluator panel
- reset/demo controls

### Phase 5 — marketing/auth polish

Build the landing page and auth shell separately from the app shell.

### Phase 6 — motion and responsive refinement

Only after the static UX is strong.

## 25. Acceptance criteria

The UI build is successful when:

- a first-time evaluator understands Credify within 20–30 seconds
- Demo Mode is obvious and requires no wallet setup
- the main workflow can be completed without reading documentation
- every major chain mutation exposes pending → confirmed → projected states
- blockchain evidence is inspectable without overwhelming non-blockchain users
- the application does not resemble a generic crypto dashboard
- the same components visibly belong to the same design system across public, auth, and app surfaces
- mobile layouts are intentionally designed
- reduced-motion mode remains fully usable
- there are no dead primary buttons or fake interactions
- realistic seeded data is used throughout

## 26. Research references

Use these references for interaction patterns and component implementation ideas, not as brand-copy templates:

- Linear: https://linear.app/
- Linear design refresh: https://linear.app/now/behind-the-latest-design-refresh
- Stripe Dashboard: https://support.stripe.com/topics/dashboard
- Vercel Dashboard concepts: https://vercel.com/kb/dashboard
- shadcn/ui: https://ui.shadcn.com/
- Radix Primitives: https://www.radix-ui.com/primitives
- Motion for React: https://motion.dev/docs/react
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/quick-start
- Lucide: https://lucide.dev/

## 27. Final design test

Before adding another visual effect, ask:

**Does this make the blockchain workflow easier to understand, the task faster to complete, or the product more trustworthy?**

If not, remove it.
