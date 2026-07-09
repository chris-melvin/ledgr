# Spending Clarity

## Why

The owner is returning to daily use of ledgr as a web-first (laptop-only) tool. The goal is not full personal-finance management but **clarity in spending habits**: a simple running balance of spendable money, a trustworthy average-daily-spend number to budget around, and entry fast enough to beat a spreadsheet. Current dashboard/budget machinery (daily limits, budget setup, savings goals) is heavier than needed and the input flow is optimized for one-at-a-time mobile-style entry, while the real workflow is batching 3–5 expenses at a desk.

## What Changes

- **Running balance ledger**: a single "spendable money" number. Starts from a user-entered opening balance; salary/income adds to it; every expense (all buckets) subtracts from it. Savings contributions are outflows that leave the ledger entirely — ledgr does NOT track a savings balance (deliberate non-goal). Withdrawing from savings re-enters as income. Occasional reconciliation adjustments (+/-) correct drift against reality and are recorded as their own event type.
- **3-bucket spend lens**: every expense is classified at entry as `Daily`, `Bills`, or `Non-daily`. All buckets reduce the running balance equally; **only `Daily` feeds the spending averages**. Buckets exist to protect the average from distortion, not as envelopes. Shortcuts carry a default bucket; ambiguous items (e.g., groceries) are resolved with a one-tap/keystroke toggle at entry time.
- **Spending stats**: trailing 7-day and 30-day average daily spend (mean AND median, Daily bucket only), and a runway stat ("balance lasts N more days at current average"). These replace the daily-limit framing as the hero numbers.
- **Batch entry (rapid-fire)**: the smart input parser accepts multiple expenses in one submission (comma/newline separated, e.g., `fare 30, lunch 145, coffee 90`), with a preview of parsed items + total before commit, and bucket tags per item.
- **Batch entry (register mode)**: a spreadsheet-style table on the dashboard — Enter commits a row and opens the next; Tab cycles the bucket; day-granularity only (no time picking), with an easy "yesterday" switch for backfilling.
- **Cmd+K command palette**: Linear-style palette replacing the current Cmd+K → smart-input shortcut. Actions: add expense(s), add income, reconcile balance, switch day/tab, open register mode. Keyboard-first navigation throughout the dashboard.
- **Dashboard hero refresh**: hero surfaces running balance, today's Daily total, avg daily spend, and runway — replacing daily-limit-centric cards for tracking-only mode.
- **Web only**: mobile app stays dormant. These specs double as the mobile catch-up backlog later; no mobile code changes in this change.

## Capabilities

### New Capabilities

- `running-balance`: the spendable-money ledger — opening balance, income inflows, expense outflows, savings-contribution outflows, reconciliation adjustments; balance computation rules.
- `spend-buckets`: 3-way classification (`Daily`/`Bills`/`Non-daily`) at entry time; default buckets on shortcuts; which buckets feed which calculations.
- `spending-stats`: mean/median trailing daily spend (7d/30d, Daily bucket only), runway calculation, and where these surface on the dashboard.
- `batch-entry`: multi-expense rapid-fire parsing in smart input and the register-mode table; day-granularity entry and backfill.
- `command-palette`: Cmd+K palette actions and keyboard-first navigation model for the web dashboard.

### Modified Capabilities

_None — existing specs (`mobile-budget-calculation`, `mobile-simple-tracking-ui`) are mobile-scoped and untouched; mobile parity is deferred._

## Impact

- **Database (`packages/database`, Supabase migrations)**: likely a `balance_events` (or similar) table for opening balance / income received / reconciliation entries; a `bucket` classification on expenses (schema already has `bucket_id`/`FlexBucket` — design will decide reuse vs. replace); shortcuts gain a default bucket.
- **Web app (`apps/web`)**: dashboard hero cards (`hero-daily-card.tsx`, `dashboard-client.tsx`), smart input parser (`useAiParser` / smart-input-overhaul work, 25/30 tasks done — batch parsing builds on it), new register-mode component, new command palette, `useServerExpenses` and stats hooks.
- **Shared (`packages/shared`)**: date/average/runway calculation utilities so mobile can reuse them later.
- **Existing features**: daily-limit/budget-setup flows de-emphasized for `tracking_only` mode (already a `tracking_mode` enum in `UserSettings`); savings goals UI untouched but not integrated with running balance.
- **Mobile (`apps/mobile`)**: no changes; sync schema additions must remain backward-compatible with the dormant client (additive columns/tables only).
