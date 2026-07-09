# spend-buckets

## ADDED Requirements

### Requirement: Three tracking buckets
The system SHALL provide three system buckets for tracking mode — `Daily`, `Bills`, and `Non-daily` — where `Daily` is the default bucket for new expenses and is the only seeded bucket flagged as included in daily averages.

#### Scenario: Buckets seeded for tracking mode
- **WHEN** a tracking-only user has no tracking buckets
- **THEN** the system creates `Daily` (default, include_in_daily_avg = true), `Bills`, and `Non-daily` buckets

#### Scenario: Default classification
- **WHEN** the user enters an expense with no bucket tag and no shortcut default
- **THEN** the expense is assigned to the `Daily` bucket

### Requirement: Bucket classification at entry
Every expense SHALL carry exactly one bucket, resolvable at entry time via (in priority order): an explicit `:bucket` tag in the input, the shortcut's default bucket, or the `Daily` fallback. The entry UI SHALL allow changing an item's bucket before commit with a single interaction (Tab key or click).

#### Scenario: Explicit tag wins over shortcut default
- **WHEN** the user types `@grocery 620 :non-daily` and the `@grocery` shortcut has default bucket Bills
- **THEN** the parsed expense is classified as Non-daily

#### Scenario: Ambiguous item resolved at entry
- **WHEN** a parsed expense's bucket came from the Daily fallback (not an explicit tag or shortcut default)
- **THEN** the preview highlights its bucket chip as changeable and Tab cycles it through Daily → Bills → Non-daily

### Requirement: Shortcut default buckets
Shortcuts SHALL support an optional default bucket applied to expenses created through them.

#### Scenario: Shortcut carries its bucket
- **WHEN** the `@fare` shortcut has default bucket Daily and the user types `@fare 30`
- **THEN** the expense is classified Daily without further interaction

### Requirement: Bucket flag drives average inclusion
Whether an expense feeds daily spending averages SHALL be determined by its bucket's `include_in_daily_avg` flag, not by hardcoded bucket names.

#### Scenario: Only flagged buckets feed the average
- **WHEN** a day has 300 Daily, 2,500 Bills, and 1,200 Non-daily expenses
- **THEN** that day's average-relevant spend total is 300

#### Scenario: Re-bucketing an expense updates statistics
- **WHEN** the user edits a 620 expense from Daily to Non-daily
- **THEN** daily averages recompute without the 620
