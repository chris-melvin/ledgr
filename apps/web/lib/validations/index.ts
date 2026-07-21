// Auth schemas
export {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  newPasswordSchema,
  type SignInInput,
  type SignUpInput,
  type ResetPasswordInput,
  type NewPasswordInput,
} from "./auth.schema";

// Expense schemas
export {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
  expenseMonthQuerySchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseQuery,
  type ExpenseMonthQuery,
} from "./expense.schema";

// Settings schemas
export {
  updateSettingsSchema,
  createSettingsSchema,
  type UpdateSettingsInput,
  type CreateSettingsInput,
} from "./settings.schema";

// Bill schemas
export {
  createBillSchema,
  updateBillSchema,
  markBillPaidSchema,
  type CreateBillInput,
  type UpdateBillInput,
  type MarkBillPaidInput,
  type BillFrequency,
  type BillStatus,
} from "./bill.schema";

// Income schemas
export {
  createIncomeSchema,
  updateIncomeSchema,
  markIncomeReceivedSchema,
  type CreateIncomeInput,
  type UpdateIncomeInput,
  type MarkIncomeReceivedInput,
  type IncomeFrequency,
  type IncomeStatus,
} from "./income.schema";

// Flex bucket schemas
export {
  updateFlexBucketSchema,
  createFlexAllocationSchema,
  updateFlexAllocationSchema,
  createDailyOverrideSchema,
  updateDailyOverrideSchema,
  type UpdateFlexBucketInput,
  type CreateFlexAllocationInput,
  type UpdateFlexAllocationInput,
  type CreateDailyOverrideInput,
  type UpdateDailyOverrideInput,
} from "./flex-bucket.schema";

// Feedback & roadmap schemas
export {
  submitFeedbackSchema,
  updateFeedbackStatusSchema,
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
  convertFeedbackToRoadmapSchema,
  toggleVoteSchema,
  feedbackQuerySchema,
  type SubmitFeedbackInput,
  type UpdateFeedbackStatusInput,
  type CreateRoadmapItemInput,
  type UpdateRoadmapItemInput,
  type ConvertFeedbackToRoadmapInput,
  type ToggleVoteInput,
  type FeedbackQueryInput,
  type FeedbackType,
  type FeedbackStatus,
  type RoadmapStatus,
} from "./feedback.schema";

// Ledger event schemas (spending-clarity)
export {
  createLedgerInflowSchema,
  createSavingsContributionSchema,
  setOpeningBalanceSchema,
  reconcileBalanceSchema,
  ledgerEventIdSchema,
  type CreateLedgerInflowInput,
  type CreateSavingsContributionInput,
  type SetOpeningBalanceInput,
  type ReconcileBalanceInput,
} from "./ledger-event.schema";

// Scheduled event schemas (runway-forecast)
export {
  createScheduledEventSchema,
  updateScheduledEventSchema,
  scheduledEventIdSchema,
  scheduledEventDirectionEnum,
  scheduledEventRecurrenceEnum,
  type CreateScheduledEventInput,
  type UpdateScheduledEventInput,
} from "./scheduled-event.schema";
