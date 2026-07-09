# Tasks — Spending Clarity

## 1. Database & Types

- [x] 1.1 Migration: create `ledger_events` table (id, user_id, type enum [opening_balance, income, savings_withdrawal, savings_contribution, adjustment], amount numeric signed, occurred_at timestamptz, note text null, timestamps; RLS policies matching expenses)
- [x] 1.2 Migration: add `include_in_daily_avg boolean NOT NULL DEFAULT false` to `budget_buckets`; add `bucket_id uuid NULL` (FK) to `shortcuts`
- [x] 1.3 Seed/upsert logic for the three tracking buckets (`Daily` default + flag true, `Bills`, `Non-daily`) for tracking-only users without them
- [x] 1.4 Update `packages/database` types: `LedgerEvent`, `LedgerEventType`, extend `BudgetBucket` and `Shortcut`

## 2. Shared Calculations (`packages/shared`)

- [x] 2.1 Pure utils: `dailyTotals(expenses, tz, window)`, `trailingMean`, `trailingMedian` (zero-fill missing days per D5), `runwayDays(balance, meanDaily)`
- [x] 2.2 Unit tests: full-window mean, spike-resistant median, timezone day-boundary (23:30 local), zero-fill, runway fallback and zero-burn cases

## 3. Ledger Backend (`apps/web`)

- [x] 3.1 `ledger-event.repository.ts` + server actions: create income / savings contribution / savings withdrawal / adjustment; enforce single active `opening_balance`
- [x] 3.2 Balance query: derived balance = Σ ledger_events − Σ expenses (server-side, per user)
- [x] 3.3 Reconcile action: accept actual balance, compute drift vs. derived, record signed `adjustment`
- [x] 3.4 Stats query/hook: fetch trailing 30d of avg-flagged expenses + balance; expose 7d/30d mean+median, today's Daily total, runway via shared utils
- [x] 3.5 History integration: ledger events render as distinct line items alongside expenses (type-labeled, excluded from spend totals)

## 4. Tracking Hero (dashboard)

- [x] 4.1 New tracking hero card gated on `tracking_mode = 'tracking_only'`: running balance, today's Daily total, 7d/30d avg (median on same surface), runway; verify budget-enabled hero untouched
- [x] 4.2 Opening-balance empty state on the hero (prompt → creates `opening_balance` event)
- [x] 4.3 Collecting state: "collecting — N of 7 days" until 7 days since first qualifying expense; runway placeholder when no burn rate
- [x] 4.4 Calendar tab: per-day Daily-total intensity shading (heatmap)

## 5. Batch Entry — Rapid-fire

- [x] 5.1 Verify/extend parser for newline separation and per-item `:bucket` resolution priority (explicit tag > shortcut default > Daily fallback) using new shortcut `bucket_id`
- [x] 5.2 Staged preview UI in smart input: row per parsed item (label, amount, bucket chip), batch total, Tab/click cycles bucket, row removal, Enter commits all
- [x] 5.3 Batched create-many server action + optimistic update in `useServerExpenses` (single round trip)

## 6. Batch Entry — Register Mode

- [x] 6.1 Register table component: focused empty row; Enter commits + opens next row; Tab cycles bucket; Esc discards row; session count + total footer
- [x] 6.2 Day selector: Today default, one-key Yesterday toggle, date pick fallback; backfilled entries logged 12:00 local
- [x] 6.3 Wire register commits through the batched action + optimistic updates; surface register mode entry point on dashboard

## 7. Command Palette & Keyboard

- [x] 7.1 Add `cmdk`; palette component with actions: Add expenses, Register mode, Add income, Add to savings, Withdraw from savings, Reconcile balance, Go to Today/Calendar
- [x] 7.2 Rebind Cmd/Ctrl+K to palette; dedicated direct shortcut for smart input (Cmd+Shift+K); Esc returns focus to prior element
- [x] 7.3 Income / savings / reconcile mini-flows reachable and completable keyboard-only from the palette
- [x] 7.4 Focus-visible states audit across new surfaces; full no-mouse entry session works end-to-end

## 8. Verification & Docs

- [x] 8.1 Vitest coverage for repository/actions (ledger types, single opening balance, reconcile drift math) and parser bucket priority
- [ ] 8.2 Manual pass of every spec scenario (running-balance, spend-buckets, spending-stats, batch-entry, command-palette); `pnpm --filter web build` + tests green — build+tests ✅; manual pass blocked until migrations 0019/0020 are applied to Supabase
- [x] 8.3 Confirm migrations are additive & dormant mobile client unaffected (sync ignores new tables/columns); note mobile parity backlog pointer in specs
