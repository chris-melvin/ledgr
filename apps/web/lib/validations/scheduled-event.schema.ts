import { z } from "zod";

/**
 * Scheduled event schemas (runway-forecast)
 *
 * Scheduled events are known upcoming money movements the runway forecast
 * projects against. User-facing input takes a POSITIVE amount plus a
 * `direction`; the sign is derived from the direction when forecasting.
 */

export const scheduledEventDirectionEnum = z.enum(["inflow", "outflow"]);
export const scheduledEventRecurrenceEnum = z.enum([
  "none",
  "weekly",
  "biweekly",
  "monthly",
]);

export const createScheduledEventSchema = z.object({
  direction: scheduledEventDirectionEnum,
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  label: z.string().trim().min(1, "Add a short label").max(100, "Label too long"),
  next_at: z.string().datetime("Invalid timestamp format (ISO 8601)"),
  recurrence: scheduledEventRecurrenceEnum.default("none"),
});

export const updateScheduledEventSchema = z.object({
  id: z.string().uuid("Invalid scheduled event ID"),
  direction: scheduledEventDirectionEnum.optional(),
  amount: z.coerce.number().positive().max(999999999.99).optional(),
  label: z.string().trim().min(1).max(100).optional(),
  next_at: z.string().datetime().optional(),
  recurrence: scheduledEventRecurrenceEnum.optional(),
  is_active: z.boolean().optional(),
});

export const scheduledEventIdSchema = z.object({
  id: z.string().uuid("Invalid scheduled event ID"),
});

export type CreateScheduledEventInput = z.infer<typeof createScheduledEventSchema>;
export type UpdateScheduledEventInput = z.infer<typeof updateScheduledEventSchema>;
export type ScheduledEventDirection = z.infer<typeof scheduledEventDirectionEnum>;
export type ScheduledEventRecurrence = z.infer<typeof scheduledEventRecurrenceEnum>;
