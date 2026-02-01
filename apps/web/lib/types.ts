// Bucket spending summary for calendar visualization
export interface BucketSpendingSummary {
  bucketId: string;
  bucketSlug: string;
  bucketName: string;
  bucketColor: string;
  amount: number;
  transactionCount: number;
}

// Calendar day data computed from expenses
export interface CalendarDay {
  day: number;
  date: Date;
  key: string; // YYYY-MM-DD
  limit: number;
  spent: number;
  remaining: number;
  isPadding?: boolean;
  // Bucket-aware spending (only daily-spending bucket counts toward status)
  dailySpendingSpent?: number;
  // Transaction metadata
  transactionCount?: number;
  bucketSummary?: BucketSpendingSummary[];
  // Income/Bill indicators
  hasIncome?: boolean;
  incomeAmount?: number;
  hasBill?: boolean;
  billAmount?: number;
  billLabel?: string;
}

// Local expense type for state management
// Note: Matches Expense type from database with occurred_at as primary timestamp
export interface LocalExpense {
  id: string;
  date?: string; // DEPRECATED: Legacy field, use occurred_at instead
  amount: number;
  label: string;
  category?: string | null; // Can be null from database
  occurred_at: string; // ISO timestamp when expense occurred (required)
  bucket_id?: string | null; // Budget bucket reference
}

// Income type
export interface LocalIncome {
  id: string;
  label: string;
  amount: number;
  dayOfMonth: number; // 1-31 (for recurring)

  // Enhanced date tracking
  expectedDate?: string; // ISO date for specific income
  receivedDate?: string; // ISO date when actually received

  // Recurring config
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    endDate?: string;
  };

  // Status
  status: 'pending' | 'received' | 'expected';
}

// Bill/Debt type - Enhanced with full date tracking
export interface LocalBill {
  id: string;
  label: string;
  amount: number;
  icon?: string;

  // Date tracking (FULL)
  receiveDate?: string;     // ISO date when bill notice was received
  dueDate: string;          // ISO date when payment is due
  paidDate?: string;        // ISO date when actually paid (null if unpaid)

  // Legacy support - day of month for recurring bills
  dueDayOfMonth?: number;   // Day 1-31 for recurring bills

  // Recurring config
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    dayOfMonth?: number;    // For monthly bills
    endDate?: string;       // Optional end date
  };

  // Status
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
}

// Income allocation for pie chart
export interface IncomeAllocation {
  category: string;     // "Daily Budget", "Bills", "Flex Bucket", "Savings"
  amount: number;
  percentage: number;
  color: string;        // Tailwind color
}

// Savings allocation
export interface SavingsAllocation {
  id: string;
  name: string;         // "Emergency Fund", "Travel"
  targetAmount: number;
  currentBalance: number;
  isHidden: boolean;    // Toggle visibility in graphs
  icon?: string;
  createdAt: string;    // ISO string
}

// Timeline event for day detail view
export interface TimelineEvent {
  id: string;
  type: 'expense' | 'bill' | 'income' | 'bill_due' | 'bill_received';
  time?: string;        // Time of day (HH:mm)
  label: string;
  amount: number;
  icon?: string;
  status?: string;      // For bills: pending, paid, overdue
  originalData?: LocalExpense | LocalBill | LocalIncome;
}

// Custom shortcut type for @keyword expenses
export interface CustomShortcut {
  id: string;
  trigger: string; // e.g., "book" (without @)
  label: string; // e.g., "Book Purchase"
  category?: string;
  icon?: string;
  defaultBucketId?: string;   // Default bucket for this shortcut
  defaultBucketSlug?: string; // For display
  createdAt: string; // ISO string
}

// ============================================
// ANALYTICS TYPES
// ============================================

// Asset for net worth tracking
export interface Asset {
  id: string;
  name: string;           // "Savings Account", "Investments"
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'crypto' | 'other';
  balance: number;
  lastUpdated: string;    // ISO date
}

// Liability for net worth tracking
export interface Liability {
  id: string;
  name: string;           // "Credit Card Debt", "Car Loan"
  type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  balance: number;
  interestRate?: number;
  lastUpdated: string;
}

// Net worth snapshot for time series
export interface NetWorthSnapshot {
  date: string;           // ISO date
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

// Sankey diagram node
export interface CashFlowNode {
  id: string;
  name: string;
  type: 'income' | 'allocation' | 'category' | 'expense';
  color?: string;
}

// Sankey diagram link
export interface CashFlowLink {
  source: string;         // node id
  target: string;         // node id
  value: number;
}

// Cash flow data for Sankey
export interface CashFlowData {
  nodes: CashFlowNode[];
  links: CashFlowLink[];
}

// Treemap node for category hierarchy
export interface SpendingNode {
  name: string;
  value?: number;         // Amount (for leaf nodes)
  color?: string;
  children?: SpendingNode[];
}

// Heatmap cell data
export interface HeatmapCell {
  date: string;           // ISO date
  dayOfWeek: number;      // 0-6 (Sun-Sat)
  week: number;           // Week number in year
  amount: number;
  count: number;          // Number of expenses
}

// Timeframe options
export type TimeframeOption = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

// Date range for analytics
export interface DateRange {
  start: string;          // ISO date
  end: string;            // ISO date
}
