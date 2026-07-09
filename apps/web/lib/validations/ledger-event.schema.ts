import { z } from "zod";

/**
 * Ledger event schemas (spending-clarity)
 *
 * Ledger events are non-expense money movement for the running balance.
 * User-facing actions take POSITIVE amounts; the sign is applied by type
 * in the server action (savings_contribution stored negative, etc.).
 */

const positiveAmount = z.coerce
  .number()
  .positive("Amount must be positive")
  .max(999999999.99, "Amount too large");

export const createLedgerInflowSchema = z.object({
  type: z.enum(["income", "savings_withdrawal"]),
  amount: positiveAmount,
  occurred_at: z.string().datetime("Invalid timestamp format (ISO 8601)").optional(),
  note: z.string().max(1000).optional().nullable(),
});

export const createSavingsContributionSchema = z.object({
  amount: positiveAmount,
  occurred_at: z.string().datetime("Invalid timestamp format (ISO 8601)").optional(),
  note: z.string().max(1000).optional().nullable(),
});

export const setOpeningBalanceSchema = z.object({
  amount: z.coerce
    .number()
    .min(0, "Opening balance cannot be negative")
    .max(999999999.99, "Amount too large"),
});

export const reconcileBalanceSchema = z.object({
  actual_balance: z.coerce
    .number()
    .min(-999999999.99, "Amount too small")
    .max(999999999.99, "Amount too large"),
  note: z.string().max(1000).optional().nullable(),
});

export const ledgerEventIdSchema = z.object({
  id: z.string().uuid("Invalid ledger event ID"),
});

export type CreateLedgerInflowInput = z.infer<typeof createLedgerInflowSchema>;
export type CreateSavingsContributionInput = z.infer<
  typeof createSavingsContributionSchema
>;
export type SetOpeningBalanceInput = z.infer<typeof setOpeningBalanceSchema>;
export type ReconcileBalanceInput = z.infer<typeof reconcileBalanceSchema>;
