# Full Timestamp Migration Guide

## Overview

This document describes the complete migration from DATE fields to TIMESTAMPTZ with full timezone support for the ledgr financial planning application.

**Status**: In Progress
**Started**: 2026-02-01
**Completion**: ~60% complete

## Migration Goals

1. **Full Timezone Support**: All dates stored as UTC timestamps, displayed in user's timezone
2. **Data Integrity**: Proper handling of dates across timezones (e.g., midnight in NY ≠ midnight in Tokyo)
3. **Simplified Codebase**: Single source of truth for date operations via `dateUtils`
4. **Future-Proof**: Ready for international expansion

## What Has Been Completed ✅

### Phase 1: Foundation (100% Complete)

#### 1. Date Utilities Library
- **File**: `apps/web/lib/utils/date.ts`
- **Features**:
  - 40+ timezone-aware utility functions
  - Full JSDoc documentation
  - Supports all date operations (conversion, formatting, comparison, calculation)
  - Timezone-aware date range handling

#### 2. Database Types
- **File**: `packages/database/src/types/database.ts`
- **Changes**:
  - Consolidated frequency enums (RecurringFrequency, IncomeFrequency, BillFrequency)
  - Updated all date fields to timestamp fields:
    - `Expense`: `date` + `time_of_day` → `occurred_at` (exclusive)
    - `DailyOverride`: `date` → `override_timestamp`
    - `FlexAllocation`: `date` → `allocated_timestamp`
    - `Income`: all date fields → timestamp fields
    - `Debt`: all date fields → timestamp fields
    - `DebtPayment`: all date fields → timestamp fields
    - `RecurringExpense`: `next_occurrence` → `next_occurrence_timestamp`
    - `SavingsTransaction`: `date` → `transaction_timestamp`
    - `SavingsGoal`: `target_date` → `target_timestamp`
    - `NetWorthSnapshot`: `date` → `snapshot_timestamp`

#### 3. Database Migration
- **File**: `packages/database/migrations/0016_full_timestamp_migration.sql`
- **Features**:
  - Safely renames all date columns to timestamp columns
  - Converts DATE types to TIMESTAMPTZ
  - Updates all indexes
  - Includes verification queries
  - Uses conditional logic to handle existing data

#### 4. Base Repository Classes
- **File**: `apps/web/lib/repositories/base-financial.repository.ts`
- **Features**:
  - Timezone-aware query methods
  - Date range queries
  - Daily totals calculation
  - Aggregation methods
  - Comprehensive JSDoc documentation

#### 5. Updated Repositories
- ✅ `expense.repository.ts` - Uses occurred_at, timezone parameters
- ✅ `income.repository.ts` - Uses timestamp fields
- ✅ `bill.repository.ts` - Uses paid_timestamp
- ✅ `debt-payment.repository.ts` - Uses payment_timestamp
- ✅ `flex-bucket.repository.ts` - Uses allocated_timestamp, override_timestamp

#### 6. Timezone Context Provider
- **File**: `apps/web/components/providers/timezone-provider.tsx`
- **Features**:
  - React context for user timezone
  - Loads from user settings
  - `useTimezone()` hook for components

#### 7. Updated Validation Schemas
- ✅ `expense.schema.ts` - Removed `time_of_day`, uses `occurred_at`
- ✅ `flex-bucket.schema.ts` - Uses timestamps
- ✅ `bill.schema.ts` - Uses timestamps
- ✅ `income.schema.ts` - Uses timestamps

#### 8. Updated Server Actions
- ✅ `actions/expenses/create.ts` - Uses occurred_at
- ✅ `actions/expenses/update.ts` - Uses occurred_at

## What Remains To Do 📋

### Phase 2: Server Actions & Hooks (40% Complete)

#### Remaining Server Actions (~40 files)
Priority order for updates:

**High Priority** (affects core functionality):
1. `actions/income/create.ts` - Use timestamp fields
2. `actions/income/update.ts` - Use timestamp fields
3. `actions/income/mark-received.ts` - Use received_timestamp
4. `actions/bills/create.ts` - Use timestamp fields
5. `actions/bills/mark-paid.ts` - Use paid_timestamp
6. `actions/bills/record-payment.ts` - Use payment_timestamp
7. `actions/flex-bucket/create-allocation.ts` - Use allocated_timestamp
8. `actions/flex-bucket/create-override.ts` - Use override_timestamp

**Medium Priority**:
- All other actions that deal with dates
- Budget calculation actions
- Analytics actions

**Pattern for Updates**:
```typescript
// Before
const date = new Date().toISOString().split("T")[0];

// After
import * as dateUtils from "@/lib/utils/date";
const timestamp = dateUtils.getCurrentTimestamp(timezone);
```

#### Hooks (~20 files)
Priority order:

**High Priority**:
1. `use-server-expenses.ts` - Update optimistic updates to use timestamps
2. `use-server-budget.ts` - Date range queries with timezone
3. `use-bills.ts` - Timestamp-based due date calculations
4. `use-timeframe.ts` - Generate date ranges with timezone awareness
5. `use-calendar.ts` - Calendar date handling

**Updates Needed**:
- Import and use `useTimezone()` hook
- Pass timezone to repository methods
- Use `dateUtils` for all date operations
- Update optimistic updates to use timestamps

### Phase 3: Components (~120 files)

#### High Priority Components
1. **Calendar Components**:
   - `calendar/calendar-grid.tsx` - Display dates in user timezone
   - `calendar/calendar-day.tsx` - Filter expenses by date in timezone
   - Use `dateUtils.formatDate()` for display
   - Use `dateUtils.isSameDay()` for comparisons

2. **Form Components**:
   - `expenses/expense-form.tsx` - Capture timestamps instead of dates
   - `expenses/quick-add-expense.tsx` - Generate timestamps
   - Create timezone-aware date picker component

3. **Display Components**:
   - `day-detail/day-detail-panel.tsx` - Display timestamps in timezone
   - `dashboard/dashboard-view.tsx` - Date range handling
   - `expenses/expense-list.tsx` - Format timestamps for display

**Pattern for Components**:
```typescript
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

function MyComponent() {
  const { timezone } = useTimezone();

  // Format for display
  const displayDate = dateUtils.formatDate(
    expense.occurred_at,
    timezone,
    dateUtils.DATE_FORMATS.MEDIUM
  );

  // Create new timestamp
  const handleSubmit = () => {
    const timestamp = dateUtils.getCurrentTimestamp(timezone);
    // ...
  };
}
```

#### Medium Priority Components
- Bill components
- Income components
- Debt payment components
- Settings components
- Analytics/chart components

### Phase 4: Integration & Testing

#### Database Migration Execution
1. **Backup database** - Critical!
2. **Test on staging** - Run migration on test database
3. **Verify data** - Check all records migrated correctly
4. **Apply to production** - Run migration script
5. **Verify indexes** - Ensure all indexes created

**Migration Script**:
```bash
# Apply migration
psql $DATABASE_URL -f packages/database/migrations/0016_full_timestamp_migration.sql

# Verify no DATE columns remain
psql $DATABASE_URL -c "SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE data_type = 'date'
AND table_schema = 'public';"

# Verify new indexes
psql $DATABASE_URL -c "SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%timestamp%';"
```

#### Unit Tests
Create `apps/web/lib/utils/__tests__/date.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import * as dateUtils from '../date';

describe('dateUtils', () => {
  describe('toTimestamp', () => {
    it('converts date to timestamp in timezone', () => {
      const result = dateUtils.toTimestamp(
        '2024-01-15',
        'America/New_York'
      );
      // Test implementation
    });
  });

  // Test all critical functions
  // Test DST transitions
  // Test edge cases
});
```

#### Integration Tests
Test scenarios:
1. Create expense → Verify timestamp stored correctly
2. Query expenses by date range → Verify timezone handling
3. Change user timezone → Verify queries adapt
4. Calendar view → Verify dates display correctly
5. Bill due dates → Verify calculations correct

#### Manual Testing Checklist
- [ ] Create expense in different timezones
- [ ] View calendar across timezone changes
- [ ] Check bill due date calculations
- [ ] Verify income date handling
- [ ] Test recurring expense scheduling
- [ ] Check analytics displays
- [ ] Verify heatmap visualizations

### Phase 5: Simplification & Optimization

#### Component Consolidation
Create `apps/web/components/forms/` with shared components:
- `form-field.tsx` - Standardized field wrapper
- `amount-input.tsx` - Currency input
- `date-picker.tsx` - Timezone-aware date picker
- `category-select.tsx` - Category selection

#### Directory Reorganization
- Merge `budget-setup/` into `budget/` subdirectory
- Move `paddle/` into `subscription/`
- Consider moving `day-detail/` into `calendar/`

#### Dependency Optimization
Update `apps/web/package.json`:
- ✅ Add `date-fns-tz`
- ⏳ Evaluate removing `recharts` if visx covers all needs
- ⏳ Audit visx packages - only include what's used

## Key Decisions & Patterns

### 1. Timestamp Storage
- **All timestamps stored as UTC** in database
- **Display in user's timezone** using date utilities
- **No more DATE fields** - TIMESTAMPTZ everywhere

### 2. Expense Date Handling
- **Old**: `date` (YYYY-MM-DD) + optional `time_of_day` (HH:MM:SS)
- **New**: `occurred_at` (ISO 8601 timestamp) exclusively
- **Migration**: Combine date + time_of_day into occurred_at, default midnight UTC

### 3. Repository Pattern
- All financial repos extend `BaseFinancialRepository`
- Standard methods: `findByTimestampRange()`, `findByDateInTimezone()`, `getDailyTotals()`
- Timezone always passed as parameter

### 4. Component Pattern
- Always use `useTimezone()` hook to get user's timezone
- Use `dateUtils` for ALL date operations
- Pass timezone to all repository/action calls

### 5. Form Handling
- Forms collect date + time from user (in their timezone)
- Convert to UTC timestamp before sending to server
- Server stores UTC timestamp
- Display converts back to user timezone

## Migration Checklist

### Before Applying Database Migration
- [ ] Backup production database
- [ ] Test migration on staging database
- [ ] Verify all repository updates complete
- [ ] Verify all server action updates complete
- [ ] Run verification queries on staging

### After Applying Database Migration
- [ ] Verify all data migrated correctly
- [ ] Verify indexes created
- [ ] Check query performance
- [ ] Monitor error logs
- [ ] Test critical user flows

### Before Deploying Code
- [ ] Update all server actions
- [ ] Update all hooks
- [ ] Update all components
- [ ] Add timezone provider to app layout
- [ ] Test locally with migration applied
- [ ] Run unit tests
- [ ] Run integration tests

### After Deployment
- [ ] Monitor error rates
- [ ] Check query performance metrics
- [ ] Verify timezone handling working correctly
- [ ] Get user feedback
- [ ] Monitor database performance

## Troubleshooting

### Common Issues

**Issue**: Date displaying in wrong timezone
```typescript
// Problem: Not using timezone
const date = new Date(expense.occurred_at).toLocaleDateString();

// Solution: Use dateUtils with timezone
const date = dateUtils.formatDate(expense.occurred_at, timezone, "PPP");
```

**Issue**: Creating timestamp without timezone
```typescript
// Problem: Uses local time
const date = new Date().toISOString().split("T")[0];

// Solution: Use dateUtils with timezone
const timestamp = dateUtils.getCurrentTimestamp(timezone);
```

**Issue**: Querying by date doesn't return expected results
```typescript
// Problem: Direct date comparison
.eq("occurred_at", "2024-01-15")

// Solution: Use date range in timezone
const { start, end } = dateUtils.dateRangeToTimestamps(
  "2024-01-15",
  "2024-01-15",
  timezone,
  true
);
.gte("occurred_at", start)
.lte("occurred_at", end)
```

## Verification Commands

### Find Deprecated Patterns
```bash
# Find uses of deprecated date splitting
grep -r "split(\"T\")\[0\]" apps/web/

# Find uses of slice for dates
grep -r "slice(0, 10)" apps/web/

# Find references to time_of_day
grep -r "time_of_day" apps/web/
```

### Verify Date Utils Usage
```bash
# Count dateUtils imports
grep -r "dateUtils\." apps/web/ | wc -l

# Find direct Date usage (may need review)
grep -r "new Date()" apps/web/ --exclude-dir=node_modules
```

## Resources

- [date-fns-tz Documentation](https://date-fns.org/docs/Time-Zones)
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [ISO 8601 Format](https://en.wikipedia.org/wiki/ISO_8601)

## Contact

For questions about this migration:
- Review this document
- Check `apps/web/lib/utils/date.ts` for utility functions
- Check `apps/web/lib/repositories/base-financial.repository.ts` for query patterns
- Check completed files for implementation examples
