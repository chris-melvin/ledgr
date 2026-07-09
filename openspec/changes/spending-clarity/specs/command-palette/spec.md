# command-palette

## ADDED Requirements

### Requirement: Cmd+K opens the command palette
Pressing Cmd+K (Ctrl+K on non-mac) anywhere on the dashboard SHALL open a command palette listing searchable actions; it SHALL replace the previous behavior of Cmd+K opening smart input directly.

#### Scenario: Palette opens and filters
- **WHEN** the user presses Cmd+K and types "rec"
- **THEN** the palette opens and filters to matching actions (e.g., "Reconcile balance", "Register mode")

### Requirement: Core palette actions
The palette SHALL offer at minimum: Add expenses (smart input), Register mode, Add income, Add to savings, Withdraw from savings, Reconcile balance, and navigation to Today and Calendar tabs.

#### Scenario: Add expenses is the first result
- **WHEN** the user opens the palette with an empty query
- **THEN** "Add expenses" is the first highlighted action and Enter drops into smart input

#### Scenario: Ledger actions reachable
- **WHEN** the user selects "Reconcile balance"
- **THEN** the reconcile flow opens (actual-balance input) without any mouse interaction required

### Requirement: Direct smart-input shortcut preserved
A dedicated shortcut SHALL open smart input directly (bypassing the palette), so batch entry remains at most one keystroke away.

#### Scenario: Muscle-memory path
- **WHEN** the user presses the direct shortcut from the dashboard
- **THEN** smart input opens focused and ready for typing

### Requirement: Keyboard-first dashboard navigation
All primary tracking-mode flows — entering expenses, cycling buckets, committing batches, reconciling, switching tabs — SHALL be operable end-to-end without a pointer, and interactive affordances SHALL show visible focus states.

#### Scenario: Full entry session without a mouse
- **WHEN** the user performs: open palette → Add expenses → type a 3-item batch → adjust one bucket via Tab → commit via Enter
- **THEN** the entire flow completes using only the keyboard

#### Scenario: Palette dismisses cleanly
- **WHEN** the user presses Escape with the palette open
- **THEN** the palette closes and focus returns to the previously focused element
