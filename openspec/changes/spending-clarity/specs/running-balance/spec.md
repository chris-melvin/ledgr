# running-balance

## ADDED Requirements

### Requirement: Running balance derivation
The system SHALL compute the running balance as the sum of all signed ledger events minus the sum of all expense amounts, across all buckets. The balance SHALL be derived at read time and never stored as a mutable counter.

#### Scenario: Balance reflects all money movement
- **WHEN** the user has an opening balance of 10,000, a received income of 30,000, expenses totaling 5,000 (any mix of buckets), and a savings contribution of 8,000
- **THEN** the running balance displays 27,000

#### Scenario: Bills reduce the balance
- **WHEN** the user logs an expense of 2,500 in the Bills bucket
- **THEN** the running balance decreases by 2,500

### Requirement: Ledger event types
The system SHALL support ledger events of type `opening_balance` (+), `income` (+), `savings_withdrawal` (+), `savings_contribution` (−), and `adjustment` (±), each with an amount, an occurred-at timestamp, and an optional note.

#### Scenario: Savings contribution exits the ledger
- **WHEN** the user records a savings contribution of 5,000
- **THEN** the running balance decreases by 5,000
- **THEN** no savings balance is displayed or tracked anywhere in the app

#### Scenario: Savings withdrawal re-enters as inflow
- **WHEN** the user records a savings withdrawal of 3,000
- **THEN** the running balance increases by 3,000

#### Scenario: Income recorded
- **WHEN** the user records an income event of 30,000 labeled "Salary"
- **THEN** the running balance increases by 30,000
- **THEN** the event appears in history with its label and date

### Requirement: Opening balance setup
The system SHALL prompt the user to enter an opening balance when tracking mode is active and no opening balance exists, and SHALL allow exactly one active opening balance event.

#### Scenario: First-run prompt
- **WHEN** a user in tracking-only mode opens the dashboard with no opening balance recorded
- **THEN** the hero shows an empty state asking for a starting balance, and submitting a value creates the `opening_balance` event

### Requirement: Balance reconciliation
The system SHALL let the user reconcile by entering the actual real-world balance; the system SHALL compute the difference from the derived balance and record it as an `adjustment` event with the signed drift amount.

#### Scenario: Reconciling downward
- **WHEN** the derived balance is 12,400 and the user reconciles to an actual balance of 12,000
- **THEN** an `adjustment` event of −400 is recorded and the balance displays 12,000

#### Scenario: Adjustments are visible history
- **WHEN** the user views transaction history after reconciling
- **THEN** the adjustment appears as its own line item, distinct from expenses and income

### Requirement: Adjustments excluded from spending statistics
Ledger events of every type SHALL be excluded from daily spending totals and averages; only expenses participate in spending statistics.

#### Scenario: Reconciliation does not distort the average
- **WHEN** an adjustment of −400 is recorded on a day with 300 of Daily expenses
- **THEN** that day's Daily spend total remains 300
