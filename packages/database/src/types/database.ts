/**
 * ledgr Database Types
 *
 * Manually maintained types that match our Supabase schema.
 * Keep in sync with migrations in /migrations folder.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Unified recurring frequency type for all recurring entities
 */
export type RecurringFrequency =
  | "once"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

/**
 * Income frequency - same as recurring frequency
 */
export type IncomeFrequency = RecurringFrequency;

export type IncomeStatus = "pending" | "expected" | "received";

/**
 * Bill frequency - excludes daily as bills are not typically daily
 */
export type BillFrequency = Exclude<RecurringFrequency, "daily">;

export type BillStatus = "pending" | "paid" | "overdue" | "partially_paid";

export type DebtPaymentType = "fixed" | "variable";

export type DebtPaymentMode = "manual" | "auto_deduct";

export type AssetType =
  | "cash"
  | "investment"
  | "property"
  | "vehicle"
  | "crypto"
  | "retirement"
  | "other";

export type LiabilityType =
  | "credit_card"
  | "personal_loan"
  | "auto_loan"
  | "mortgage"
  | "student_loan"
  | "other";

export type SavingsTransactionType =
  | "contribution"
  | "withdrawal"
  | "interest"
  | "adjustment";

export type FeedbackType = "bug" | "feature" | "improvement" | "other";

export type FeedbackStatus =
  | "new"
  | "reviewed"
  | "accepted"
  | "rejected"
  | "converted";

export type RoadmapStatus =
  | "under_consideration"
  | "planned"
  | "in_progress"
  | "completed";

export type TrackingMode = "tracking_only" | "budget_enabled";

// =============================================================================
// CORE TYPES (Updated)
// =============================================================================

export interface Expense {
  id: string;
  user_id: string;
  occurred_at: string; // TIMESTAMPTZ - when expense occurred
  amount: number;
  label: string;
  category: string | null;
  category_id: string | null;
  notes: string | null;
  recurring_expense_id: string | null;
  bucket_id: string | null; // Reference to budget bucket
  created_at: string;
  updated_at: string;
}

export interface DailyOverride {
  id: string;
  user_id: string;
  override_timestamp: string; // TIMESTAMPTZ - when override applies
  limit_amount: number;
  created_at: string;
}

export interface FlexBucket {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface FlexAllocation {
  id: string;
  user_id: string;
  allocated_timestamp: string; // TIMESTAMPTZ - when allocation was made
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  day_of_month: number | null; // 1-31, nullable for non-monthly frequencies
  frequency: IncomeFrequency;
  day_of_week: number | null; // 0-6 (Sunday-Saturday)
  start_timestamp: string | null; // TIMESTAMPTZ - when income starts
  end_timestamp: string | null; // TIMESTAMPTZ - when income ends
  is_active: boolean;
  expected_timestamp: string | null; // TIMESTAMPTZ - when income is expected
  received_timestamp: string | null; // TIMESTAMPTZ - when income was received
  status: IncomeStatus;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  label: string;
  creditor: string | null; // Person or company the debt is owed to
  amount: number; // Payment amount per period (for variable debts, this is the default/suggested amount)
  due_date: number | null; // Day of month 1-31, nullable for non-monthly
  icon: string | null;
  total_amount: number | null; // Original debt amount
  remaining_balance: number | null;
  interest_rate: number | null; // APR as decimal (e.g., 0.1299 for 12.99%)
  minimum_payment: number | null;
  frequency: BillFrequency;
  day_of_week: number | null;
  start_timestamp: string | null; // TIMESTAMPTZ - when debt starts
  end_timestamp: string | null; // TIMESTAMPTZ - when debt ends
  is_recurring: boolean;
  payment_type: DebtPaymentType; // 'fixed' = same amount every period, 'variable' = user adjusts each period
  payment_mode: DebtPaymentMode; // 'manual' = user records payment, 'auto_deduct' = deduct from bucket
  payment_bucket_id: string | null; // Bucket to deduct from when payment_mode is 'auto_deduct'
  status: BillStatus;
  paid_timestamp: string | null; // TIMESTAMPTZ - when debt was paid
  receive_timestamp: string | null; // TIMESTAMPTZ - when payment was received
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  amount: number;
  payment_timestamp: string; // TIMESTAMPTZ - when payment was made
  period_start_timestamp: string; // TIMESTAMPTZ - start of payment period
  period_end_timestamp: string; // TIMESTAMPTZ - end of payment period
  notes: string | null;
  source_bucket_id: string | null; // Bucket that was deducted when this payment was made (if any)
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_daily_limit: number;
  currency: string;
  timezone: string;
  week_starts_on: number; // 0-6 (Sunday-Saturday)
  show_savings_in_allocation: boolean;
  budget_setup_completed: boolean;
  total_monthly_income: number | null;
  total_fixed_expenses: number | null;
  calculated_daily_limit: number | null;
  tracking_mode: TrackingMode; // tracking_only or budget_enabled
  card_preferences: Record<string, unknown>; // JSONB - hero card customization
  created_at: string;
  updated_at: string;
}

// =============================================================================
// NEW TYPES
// =============================================================================

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  category_id: string | null;
  category: string | null;
  notes: string | null;
  icon: string | null;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
  next_occurrence_timestamp: string; // TIMESTAMPTZ - when next occurrence is scheduled
  is_active: boolean;
  auto_log: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shortcut {
  id: string;
  user_id: string;
  trigger: string; // Without @ prefix
  label: string;
  category_id: string | null;
  category: string | null;
  icon: string | null;
  default_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_balance: number;
  icon: string | null;
  color: string | null;
  target_timestamp: string | null; // TIMESTAMPTZ - target date for goal
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  user_id: string;
  savings_goal_id: string;
  amount: number; // Positive = contribution, negative = withdrawal
  type: SavingsTransactionType;
  notes: string | null;
  transaction_timestamp: string; // TIMESTAMPTZ - when transaction occurred
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  balance: number;
  institution: string | null;
  account_number: string | null;
  notes: string | null;
  is_liquid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  institution: string | null;
  account_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_timestamp: string; // TIMESTAMPTZ - when snapshot was taken
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  created_at: string;
}

// =============================================================================
// FEEDBACK & ROADMAP TYPES
// =============================================================================

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  roadmap_item_id: string | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  category: string | null;
  vote_count: number;
  is_public: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapVote {
  id: string;
  user_id: string;
  roadmap_item_id: string;
  created_at: string;
}

// =============================================================================
// INSERT TYPES (for creating new records)
// =============================================================================

export type ExpenseInsert = Omit<Expense, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DailyOverrideInsert = Omit<DailyOverride, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type FlexBucketInsert = Omit<FlexBucket, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

export type FlexAllocationInsert = Omit<FlexAllocation, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type IncomeInsert = Omit<Income, "id" | "created_at" | "updated_at"> & {
  id?: string;
  frequency?: IncomeFrequency;
  is_active?: boolean;
  status?: IncomeStatus;
  created_at?: string;
  updated_at?: string;
};

export type DebtInsert = Omit<Debt, "id" | "created_at" | "updated_at"> & {
  id?: string;
  creditor?: string | null;
  frequency?: BillFrequency;
  is_recurring?: boolean;
  payment_type?: DebtPaymentType;
  payment_mode?: DebtPaymentMode;
  payment_bucket_id?: string | null;
  status?: BillStatus;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DebtPaymentInsert = Omit<DebtPayment, "id" | "created_at"> & {
  id?: string;
  notes?: string | null;
  source_bucket_id?: string | null;
  created_at?: string;
};

export type UserSettingsInsert = {
  user_id: string;
  id?: string;
  default_daily_limit?: number;
  currency?: string;
  timezone?: string;
  week_starts_on?: number;
  show_savings_in_allocation?: boolean;
  budget_setup_completed?: boolean;
  total_monthly_income?: number | null;
  total_fixed_expenses?: number | null;
  calculated_daily_limit?: number | null;
  tracking_mode?: TrackingMode;
  card_preferences?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at"> & {
  id?: string;
  is_system?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type RecurringExpenseInsert = Omit<RecurringExpense, "id" | "created_at" | "updated_at"> & {
  id?: string;
  frequency?: RecurringFrequency;
  is_active?: boolean;
  auto_log?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ShortcutInsert = Omit<Shortcut, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SavingsGoalInsert = Omit<SavingsGoal, "id" | "created_at" | "updated_at"> & {
  id?: string;
  current_balance?: number;
  is_hidden?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SavingsTransactionInsert = Omit<SavingsTransaction, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type AssetInsert = Omit<Asset, "id" | "created_at" | "updated_at"> & {
  id?: string;
  balance?: number;
  is_liquid?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LiabilityInsert = Omit<Liability, "id" | "created_at" | "updated_at"> & {
  id?: string;
  balance?: number;
  created_at?: string;
  updated_at?: string;
};

export type NetWorthSnapshotInsert = Omit<NetWorthSnapshot, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type FeedbackInsert = {
  user_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  id?: string;
  status?: FeedbackStatus;
  roadmap_item_id?: string | null;
  user_email?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RoadmapItemInsert = {
  title: string;
  description: string;
  id?: string;
  status?: RoadmapStatus;
  category?: string | null;
  vote_count?: number;
  is_public?: boolean;
  sort_order?: number;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RoadmapVoteInsert = {
  user_id: string;
  roadmap_item_id: string;
  id?: string;
  created_at?: string;
};

// =============================================================================
// UPDATE TYPES (for updating records)
// =============================================================================

export type ExpenseUpdate = Partial<Omit<Expense, "id" | "user_id">>;
export type DailyOverrideUpdate = Partial<Omit<DailyOverride, "id" | "user_id">>;
export type FlexBucketUpdate = Partial<Omit<FlexBucket, "id" | "user_id">>;
export type FlexAllocationUpdate = Partial<Omit<FlexAllocation, "id" | "user_id">>;
export type IncomeUpdate = Partial<Omit<Income, "id" | "user_id">>;
export type DebtUpdate = Partial<Omit<Debt, "id" | "user_id">>;
export type DebtPaymentUpdate = Partial<Omit<DebtPayment, "id" | "user_id" | "debt_id">>;
export type UserSettingsUpdate = Partial<Omit<UserSettings, "id" | "user_id">>;
export type CategoryUpdate = Partial<Omit<Category, "id" | "user_id">>;
export type RecurringExpenseUpdate = Partial<Omit<RecurringExpense, "id" | "user_id">>;
export type ShortcutUpdate = Partial<Omit<Shortcut, "id" | "user_id">>;
export type SavingsGoalUpdate = Partial<Omit<SavingsGoal, "id" | "user_id">>;
export type AssetUpdate = Partial<Omit<Asset, "id" | "user_id">>;
export type LiabilityUpdate = Partial<Omit<Liability, "id" | "user_id">>;
export type FeedbackUpdate = Partial<Omit<Feedback, "id" | "user_id">>;
export type RoadmapItemUpdate = Partial<Omit<RoadmapItem, "id">>;
export type RoadmapVoteUpdate = Partial<Omit<RoadmapVote, "id" | "user_id">>;

// =============================================================================
// ONBOARDING TYPES
// =============================================================================

export interface ProgressiveHintState {
  shown_at: string;
  dismissed: boolean;
}

export interface UserOnboarding {
  id: string;
  user_id: string;
  has_completed_tour: boolean;
  current_step: number;
  tour_skipped_at: string | null;
  tour_completed_at: string | null;
  progressive_hints_shown: Record<string, ProgressiveHintState>;
  features_discovered: Record<string, string>; // feature_id -> timestamp
  expense_count: number;
  days_active: number;
  last_active_date: string | null;
  budget_setup_completed: boolean;
  budget_setup_step: number;
  created_at: string;
  updated_at: string;
}

export type UserOnboardingInsert = {
  user_id: string;
  id?: string;
  has_completed_tour?: boolean;
  current_step?: number;
  tour_skipped_at?: string | null;
  tour_completed_at?: string | null;
  progressive_hints_shown?: Record<string, ProgressiveHintState>;
  features_discovered?: Record<string, string>;
  expense_count?: number;
  days_active?: number;
  last_active_date?: string | null;
  budget_setup_completed?: boolean;
  budget_setup_step?: number;
  created_at?: string;
  updated_at?: string;
};

export type UserOnboardingUpdate = Partial<Omit<UserOnboarding, "id" | "user_id">>;

// =============================================================================
// BUDGET BUCKET TYPES
// =============================================================================

export type BucketMatchType = "category" | "label" | "keyword";

export interface BudgetBucket {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  percentage: number | null; // Percentage of remaining budget (0-100), nullable for fixed-amount buckets
  target_amount: number | null; // Fixed monthly amount, alternative to percentage
  allocated_amount: number | null;
  color: string | null;
  icon: string | null;
  description: string | null; // User-facing description for tooltips
  is_default: boolean;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseBucketRule {
  id: string;
  user_id: string;
  bucket_id: string;
  match_type: BucketMatchType;
  match_value: string;
  priority: number;
  created_at: string;
}

export type BudgetBucketInsert = {
  user_id: string;
  name: string;
  slug: string;
  id?: string;
  percentage?: number | null;
  target_amount?: number | null;
  allocated_amount?: number | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  is_default?: boolean;
  is_system?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type BudgetBucketUpdate = Partial<Omit<BudgetBucket, "id" | "user_id">>;

export type ExpenseBucketRuleInsert = {
  user_id: string;
  bucket_id: string;
  match_type: BucketMatchType;
  match_value: string;
  id?: string;
  priority?: number;
  created_at?: string;
};

export type ExpenseBucketRuleUpdate = Partial<Omit<ExpenseBucketRule, "id" | "user_id">>;

// =============================================================================
// SUBSCRIPTION & PAYMENT TYPES
// =============================================================================

export type PaymentProvider = "paddle" | "lemonsqueezy";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired";

export type BillingCycle = "monthly" | "yearly";

export type SubscriptionTier = "free" | "pro";

export interface Subscription {
  id: string;
  user_id: string;
  provider: PaymentProvider;
  provider_subscription_id: string;
  provider_customer_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionInsert = {
  user_id: string;
  provider: PaymentProvider;
  provider_subscription_id: string;
  provider_customer_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  id?: string;
  cancel_at_period_end?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionUpdate = Partial<Omit<Subscription, "id" | "user_id">>;

// =============================================================================
// CREDITS TYPES
// =============================================================================

export type CreditTransactionType =
  | "subscription_grant"
  | "purchase"
  | "consumption"
  | "refund"
  | "adjustment";

export type AIFeatureId =
  | "insights"
  | "budget_improvement"
  | "expense_analysis"
  | "savings_recommendations";

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  subscription_credits_per_month: number;
  last_refresh_at: string | null;
  next_refresh_at: string | null;
  total_granted: number;
  total_consumed: number;
  total_purchased: number;
  created_at: string;
  updated_at: string;
}

export type UserCreditsInsert = {
  user_id: string;
  id?: string;
  balance?: number;
  subscription_credits_per_month?: number;
  last_refresh_at?: string | null;
  next_refresh_at?: string | null;
  total_granted?: number;
  total_consumed?: number;
  total_purchased?: number;
  created_at?: string;
  updated_at?: string;
};

export type UserCreditsUpdate = Partial<Omit<UserCredits, "id" | "user_id">>;

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: CreditTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  feature_id: AIFeatureId | null;
  reference_id: string | null;
  created_at: string;
}

export type CreditTransactionInsert = {
  user_id: string;
  transaction_type: CreditTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  id?: string;
  feature_id?: AIFeatureId | null;
  reference_id?: string | null;
  created_at?: string;
};
