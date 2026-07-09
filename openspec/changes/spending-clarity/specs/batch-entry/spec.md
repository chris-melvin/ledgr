# batch-entry

## ADDED Requirements

### Requirement: Rapid-fire multi-expense input
The smart input SHALL accept multiple expenses in one submission, separated by commas or newlines, parsing each item's label, amount, optional `:bucket` tag, optional `#category`, and optional `@shortcut`.

#### Scenario: Comma-separated batch
- **WHEN** the user types `fare 30, lunch 145, coffee 90` and submits
- **THEN** three expenses are parsed with their respective labels and amounts

#### Scenario: Mixed tags in a batch
- **WHEN** the user types `@fare 30, grocery 620 :non-daily, lunch 145`
- **THEN** the fare uses the shortcut's default bucket, the grocery is Non-daily, and lunch falls back to Daily

### Requirement: Staged preview before commit
Parsed batch items SHALL be shown as a staged preview — one row per item with label, amount, and bucket chip, plus a batch total — and nothing SHALL be persisted until the user confirms. Individual rows SHALL be editable (bucket cycling, removal) from the preview.

#### Scenario: Preview then commit
- **WHEN** the user submits `fare 30, lunch 145` in smart input
- **THEN** a preview shows 2 rows and total 175, and pressing Enter again commits both

#### Scenario: Fix a row before commit
- **WHEN** the preview shows a grocery item bucketed Daily and the user Tabs its chip to Non-daily and commits
- **THEN** the grocery persists as Non-daily and the other rows are unaffected

### Requirement: Register mode
The dashboard SHALL offer a register-mode table for keyboard-driven entry: Enter commits the current row and opens a new one, Tab cycles the active row's bucket, Escape discards the in-progress row, and a running count/total for the session is visible.

#### Scenario: Sequential row entry
- **WHEN** the user opens register mode, types `fare` and `30`, and presses Enter
- **THEN** the row is committed, appears in the table, and an empty row receives focus

#### Scenario: Cancel an in-progress row
- **WHEN** the user has typed into a new row and presses Escape
- **THEN** the row is discarded and no expense is created

### Requirement: Day-granularity entry and backfill
Batch entry SHALL operate at day granularity: entries default to today (logged at current time), and the user SHALL be able to switch the target day to yesterday (or a picked date) with a single interaction; backfilled entries are logged at 12:00 local time on the target day.

#### Scenario: Backfill yesterday
- **WHEN** the user switches register mode's day to Yesterday and commits `fare 30`
- **THEN** the expense's occurred-at falls on yesterday's local calendar date

#### Scenario: No time picking required
- **WHEN** the user enters any batch for today
- **THEN** no time input is requested at any point in the flow

### Requirement: Single batched commit
Committing a batch (rapid-fire preview or register rows committed in one sitting) SHALL persist via a batched server action with optimistic UI update, so a batch of N items does not issue N sequential round trips from the client.

#### Scenario: Batch commits atomically from the client
- **WHEN** the user commits a 4-item rapid-fire preview
- **THEN** one create-many request is sent and all 4 items appear immediately (optimistically) in today's list
