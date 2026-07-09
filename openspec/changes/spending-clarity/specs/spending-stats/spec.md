# spending-stats

## ADDED Requirements

### Requirement: Trailing daily spend averages
The system SHALL compute trailing 7-day and 30-day daily spend statistics — both mean and median — over expenses in buckets flagged `include_in_daily_avg`, using calendar days in the user's timezone. Days within the window that have no qualifying expenses SHALL count as zero-spend days.

#### Scenario: Mean over a full window
- **WHEN** the trailing 7 days have Daily totals [300, 0, 250, 400, 0, 350, 300]
- **THEN** the 7-day mean displays 228.57 (1,600 ÷ 7) rounded per currency convention

#### Scenario: Median resists spikes
- **WHEN** the trailing 7 days have Daily totals [300, 280, 250, 3,000, 320, 350, 300]
- **THEN** the 7-day median displays 300 while the mean reflects the spike

#### Scenario: Timezone boundaries respected
- **WHEN** an expense occurs at 23:30 local time
- **THEN** it counts toward that local calendar day's total, regardless of UTC date

### Requirement: Insufficient data state
The system SHALL show a collecting state instead of an average when fewer than 7 calendar days have elapsed since the user's first qualifying expense.

#### Scenario: Early days
- **WHEN** the user's first Daily expense was 3 days ago
- **THEN** the stats area shows "collecting — 3 of 7 days" rather than a mean/median

### Requirement: Runway statistic
The system SHALL display runway as the running balance divided by the 30-day mean daily spend (falling back to the 7-day mean when the 30-day window is not yet full), expressed in whole days.

#### Scenario: Runway from balance and burn rate
- **WHEN** the running balance is 27,000 and the 30-day mean daily spend is 450
- **THEN** the runway displays 60 days

#### Scenario: No burn rate yet
- **WHEN** the mean daily spend is zero or still collecting
- **THEN** the runway shows an em-dash/placeholder rather than infinity or an error

### Requirement: Stats on the tracking hero
For tracking-only mode, the dashboard hero SHALL surface: running balance, today's Daily-bucket total, the 7-day and 30-day means (median available on the same surface), and runway. Budget-enabled mode SHALL retain its existing hero unchanged.

#### Scenario: Tracking hero contents
- **WHEN** a tracking-only user opens the dashboard
- **THEN** the hero shows running balance, today's Daily total, avg daily spend (7d/30d), and runway

#### Scenario: Budget mode unaffected
- **WHEN** a budget-enabled user opens the dashboard
- **THEN** the pre-existing hero renders with no behavioral change

### Requirement: Calendar spend intensity
The calendar view SHALL render per-day spend intensity (heatmap-style shading) based on Daily-bucket totals, so spending patterns are visible at a glance.

#### Scenario: Heavier days shade darker
- **WHEN** the calendar month contains days with totals 0, 250, and 900
- **THEN** the 900 day renders with visibly stronger intensity than the 250 day, and the 0 day renders neutral
