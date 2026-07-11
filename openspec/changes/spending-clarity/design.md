# Design — Spending Clarity

## Context

ledgr is being repurposed as a laptop-only, batch-entry spending tracker. The owner enters 3–5 expenses per sitting, wants a running balance of spendable money, and a trustworthy average-daily-spend to budget around. Much of the plumbing already exists:

- `use-ai-parser.ts` already parses **multiple expenses per input** (comma / "and" smart-split), `:bucket` tags, `#category` tags, `@shortcuts`, and relative dates ("yesterday").
- `budget_buckets` table + repository exist end-to-end (parser resolves `:slug` → `bucket_id`, expense create actions persist it).
- `UserSettings.tracking_mode` already distinguishes `tracking_only` from `budget_enabled`.
- `smart-input-overhaul` change is 25/30 tasks complete; this change builds on its parser, not against it.
- Mobile app is dormant but shares the Supabase schema — **all migrations must be additive**.

## Goals / Non-Goals

**Goals:**
- One derived running-balance number: inflows − outflows, reconcilable.
- 3-bucket lens (`Daily`/`Bills`/`Non-daily`) where only `Daily` feeds averages.
- Mean + median trailing daily spend (7d/30d) and runway stat.
- Batch entry: rapid-fire smart input preview + register-mode table.
- Cmd+K command palette; keyboard-first dashboard.

**Non-Goals:**
- Tracking savings balances (deliberate: contributions exit the ledger, withdrawals re-enter as inflows).
- Envelope/percentage budgeting (bucket `percentage`/allocation machinery stays dormant in tracking mode).
- Any mobile app changes (specs double as the mobile catch-up backlog).
- Bank/account integration, net worth, multi-currency.

## Decisions

### D1: Running balance is derived, never stored
Balance = Σ signed `ledger_events` − Σ `expenses.amount` **where `occurred_at` > the opening balance timestamp**. The opening balance snapshots reality; expenses before it (historical data, pre-snapshot backfills) are already baked into that number and must not drain it again. Spending stats windows are clipped to the opening timestamp for the same reason. Computed server-side per request (indexed sums are cheap at personal scale).
- *Alternative — stored counter updated transactionally*: rejected; drift risk, race conditions, and the dormant mobile sync client would corrupt it.
- *Alternative — count all expenses ever*: rejected after real use; a returning user's historical expenses produced an instantly negative balance.

### D2: New `ledger_events` table for non-expense money movement
One additive table covers every inflow and adjustment with a signed `amount`:

| `type` | sign | meaning |
|---|---|---|
| `opening_balance` | + | starting point (one active) |
| `income` | + | salary etc. received |
| `savings_withdrawal` | + | money re-entering from savings |
| `savings_contribution` | − | money leaving to savings (not spending) |
| `adjustment` | ± | reconciliation drift correction |

Expenses stay in `expenses` — spending and money-movement are different domains.
- *Alternative — reuse `Income` table + negative expenses*: rejected; savings contributions modeled as expenses would need exclusion hacks in every spending query, and `Income` carries recurrence machinery irrelevant here.

### D3: Bucket lens reuses `budget_buckets`, gated by a new flag
Add additive column `include_in_daily_avg boolean NOT NULL DEFAULT false` to `budget_buckets`. Seed three system buckets for tracking mode: `daily` (default, flag true), `bills`, `non-daily`. Averages filter expenses by the bucket flag, not hardcoded slugs — user-created buckets compose correctly later.
- *Alternative — new `spend_class` enum column on expenses*: rejected; buckets already flow parser → action → row, and two parallel classification systems would fight.

### D4: Shortcuts carry a default bucket
Additive `bucket_id uuid NULL` column on `shortcuts`. `@fare` → Daily automatically; `@grocery` left null → entry UI prompts the toggle. Explicit `:bucket` tag in input always wins.

### D5: Averages count every calendar day in the window
7d/30d mean and median treat no-entry days as ₱0 spend days. Rationale: the number answers "what's my daily burn rate," and runway math (`balance ÷ mean`) only works with calendar-day denominators. Trade-off: forgotten days deflate the average — mitigated by reconciliation adjustments surfacing untracked drift. Median shown alongside mean to resist one-off spikes. Windows computed in the user's timezone via existing `packages/shared` date utils; new pure functions (`dailyTotals`, `trailingMean`, `trailingMedian`, `runwayDays`) live in `packages/shared` so mobile reuses them later.

### D6: Batch entry rides the existing parser; the work is UX
Rapid-fire: smart input already returns `ParsedExpense[]`; add a **staged preview** (each parsed item as a row: label, amount, bucket chip; total; per-item bucket cycling via Tab/click) before a single commit. Register mode: a separate lightweight table component on the dashboard — Enter commits row + opens next, Tab cycles bucket, Esc cancels row; day selector defaults Today with one-key Yesterday toggle. Both commit through the same batched server action (one round trip, one optimistic update).
- Day granularity: entries logged with current time for today; backfilled days use 12:00 local (averages only consume dates, so time precision is cosmetic).

### D7: Command palette via `cmdk`
Cmd+K opens a palette (Linear-style) instead of jumping straight to smart input. First-class actions: *Add expenses* (drops into smart input), *Register mode*, *Add income*, *Add to savings / Withdraw from savings*, *Reconcile balance*, *Go to Today/Calendar*. `cmdk` is the de-facto standard (shadcn-compatible, tiny). Smart input remains reachable in ≤2 keystrokes (Cmd+K, Enter) and gets its own direct shortcut (`Cmd+Shift+K` or `n`) to preserve muscle memory.

### D8: Hero refresh is gated on `tracking_mode = 'tracking_only'`
New hero surfaces: running balance, today's Daily total, 7d/30d avg (mean, median on hover/subline), runway days. `budget_enabled` users keep the existing hero untouched — zero regression surface.

## Risks / Trade-offs

- [Dormant mobile client writes stale-shaped data] → additive-only migrations; new columns nullable/defaulted; mobile sync ignores unknown tables.
- [Early data window: averages meaningless for first days] → show "collecting — N of 7 days" state instead of a misleading number.
- [Bucket toggle friction makes entry slower than a spreadsheet] → defaults do the work: shortcut default bucket + `daily` as fallback; toggle only for genuinely ambiguous items.
- [Palette vs. existing Cmd+K muscle memory] → smart input stays one Enter away inside the palette; direct shortcut preserved.
- [Two entry surfaces (rapid-fire + register) double maintenance] → both are thin shells over the same parser output shape and the same batch commit action.
- [Reconciliation adjustments could silently absorb bad habits] → adjustments display as their own line items in history with cumulative drift visible.

## Migration Plan

1. Additive migrations: `ledger_events` table; `budget_buckets.include_in_daily_avg`; `shortcuts.bucket_id`. Seed/upsert the three tracking buckets for the owner's account.
2. Ship shared calc utils + server queries behind the `tracking_only` gate; existing dashboards unaffected.
3. Ship entry UX (preview, register, palette) — purely client-side + one new batched action.
4. Rollback = feature-gate off; tables/columns are inert if unused.

## Open Questions

- Onboarding the opening balance: settings field vs. first-run prompt on the new hero (leaning: hero empty-state prompt, one input, done).
- Should salary entry eventually auto-suggest from the existing `Income` recurrence table? Deferred — manual `income` ledger events first; revisit after real usage.
