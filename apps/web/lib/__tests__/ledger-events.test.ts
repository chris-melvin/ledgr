import { describe, it, expect } from "vitest";

/**
 * Ledger Event Tests (spending-clarity)
 *
 * Logic-mirror tests for:
 * - Running balance derivation (Σ signed ledger events − Σ expenses)
 * - Sign conventions per ledger event type
 * - Reconcile drift math
 * - Bucket resolution priority (explicit tag > shortcut default > fallback)
 * - Batch input segmentation (newline/comma)
 */

type LedgerEventType =
  | "opening_balance"
  | "income"
  | "savings_withdrawal"
  | "savings_contribution"
  | "adjustment";

interface LedgerEventLike {
  type: LedgerEventType;
  amount: number; // signed
}

interface ExpenseLike {
  amount: number;
  occurred_at: string;
}

// Mirrors ledgerEventRepository.getRunningBalance: only expenses AFTER
// the opening-balance snapshot drain the balance.
function runningBalanceScoped(
  events: Array<LedgerEventLike & { occurred_at?: string }>,
  expenses: ExpenseLike[]
): number {
  const opening = events.find((e) => e.type === "opening_balance");
  const eventSum = events.reduce((acc, e) => acc + e.amount, 0);
  const expenseSum = expenses
    .filter((e) => !opening?.occurred_at || e.occurred_at > opening.occurred_at)
    .reduce((acc, e) => acc + e.amount, 0);
  return eventSum - expenseSum;
}

// Convenience for tests where all expenses are post-opening
function runningBalance(
  events: LedgerEventLike[],
  expenseAmounts: number[]
): number {
  const withTs = events.map((e) => ({
    ...e,
    occurred_at: e.type === "opening_balance" ? "2026-07-01T00:00:00Z" : undefined,
  }));
  return runningBalanceScoped(
    withTs,
    expenseAmounts.map((amount) => ({ amount, occurred_at: "2026-07-05T00:00:00Z" }))
  );
}

// Mirrors createSavingsContribution's sign application
function savingsContributionAmount(entered: number): number {
  return -Math.abs(entered);
}

// Mirrors reconcileBalance drift math
function reconcileDrift(actual: number, derived: number): number {
  return Math.round((actual - derived) * 100) / 100;
}

// Mirrors the sign check constraint in 0019_ledger_events.sql
function isValidSign(type: LedgerEventType, amount: number): boolean {
  if (type === "adjustment") return true;
  if (type === "savings_contribution") return amount <= 0;
  return amount >= 0;
}

describe("running balance derivation", () => {
  it("balance reflects all money movement (spec: running-balance)", () => {
    // opening 10,000 + income 30,000 − expenses 5,000 − savings 8,000 = 27,000
    const events: LedgerEventLike[] = [
      { type: "opening_balance", amount: 10000 },
      { type: "income", amount: 30000 },
      { type: "savings_contribution", amount: savingsContributionAmount(8000) },
    ];
    expect(runningBalance(events, [3000, 2000])).toBe(27000);
  });

  it("bills reduce the balance like any expense", () => {
    const events: LedgerEventLike[] = [{ type: "opening_balance", amount: 10000 }];
    expect(runningBalance(events, [2500])).toBe(7500);
  });

  it("savings withdrawal re-enters as inflow", () => {
    const events: LedgerEventLike[] = [
      { type: "opening_balance", amount: 1000 },
      { type: "savings_withdrawal", amount: 3000 },
    ];
    expect(runningBalance(events, [])).toBe(4000);
  });

  it("historical expenses before the opening snapshot do not drain the balance (regression)", () => {
    // Returning user: 22,360 of old expenses, fresh 8,000 opening balance
    const events = [
      { type: "opening_balance" as const, amount: 8000, occurred_at: "2026-07-11T02:00:00Z" },
    ];
    const expenses = [
      { amount: 12360, occurred_at: "2026-03-10T05:00:00Z" },
      { amount: 10000, occurred_at: "2026-05-22T09:00:00Z" },
    ];
    expect(runningBalanceScoped(events, expenses)).toBe(8000);
  });

  it("backfills predating the snapshot are excluded, later expenses count", () => {
    const events = [
      { type: "opening_balance" as const, amount: 8000, occurred_at: "2026-07-11T02:00:00Z" },
    ];
    const expenses = [
      { amount: 500, occurred_at: "2026-07-10T12:00:00Z" }, // backfilled to yesterday
      { amount: 300, occurred_at: "2026-07-11T08:00:00Z" }, // after snapshot
    ];
    expect(runningBalanceScoped(events, expenses)).toBe(7700);
  });
});

describe("ledger event sign conventions", () => {
  it("savings contributions are stored negative", () => {
    expect(savingsContributionAmount(5000)).toBe(-5000);
    expect(savingsContributionAmount(-5000)).toBe(-5000); // defensive
  });

  it("sign constraint matches migration check", () => {
    expect(isValidSign("opening_balance", 1000)).toBe(true);
    expect(isValidSign("opening_balance", -1)).toBe(false);
    expect(isValidSign("income", 30000)).toBe(true);
    expect(isValidSign("income", -1)).toBe(false);
    expect(isValidSign("savings_withdrawal", 3000)).toBe(true);
    expect(isValidSign("savings_contribution", -5000)).toBe(true);
    expect(isValidSign("savings_contribution", 5000)).toBe(false);
    expect(isValidSign("adjustment", -400)).toBe(true);
    expect(isValidSign("adjustment", 400)).toBe(true);
  });
});

describe("reconcile drift", () => {
  it("reconciling downward records negative drift (spec scenario)", () => {
    expect(reconcileDrift(12000, 12400)).toBe(-400);
  });

  it("reconciling upward records positive drift", () => {
    expect(reconcileDrift(12500, 12400)).toBe(100);
  });

  it("zero drift records nothing", () => {
    expect(reconcileDrift(12400, 12400)).toBe(0);
  });

  it("rounds float noise to currency precision", () => {
    // 0.3 − 0.19 = 0.11000000000000004 in binary floats
    expect(reconcileDrift(12400.3, 12400.19)).toBe(0.11);
  });

  it("applying the drift makes derived match actual", () => {
    const derived = 12400;
    const actual = 12000;
    const drift = reconcileDrift(actual, derived);
    expect(derived + drift).toBe(actual);
  });
});

// ─── Bucket resolution priority (mirrors use-ai-parser resolution) ──────────

interface BucketResolutionInput {
  explicitBucketId?: string; // from :tag
  shortcutBucketId?: string; // from @shortcut default
  defaultBucketId?: string; // Daily fallback
}

function resolveBucket(input: BucketResolutionInput): string | undefined {
  return input.explicitBucketId ?? input.shortcutBucketId ?? input.defaultBucketId;
}

describe("bucket resolution priority", () => {
  const DAILY = "bucket-daily";
  const BILLS = "bucket-bills";
  const NON_DAILY = "bucket-non-daily";

  it("explicit tag wins over shortcut default (spec: spend-buckets)", () => {
    expect(
      resolveBucket({
        explicitBucketId: NON_DAILY,
        shortcutBucketId: BILLS,
        defaultBucketId: DAILY,
      })
    ).toBe(NON_DAILY);
  });

  it("shortcut default wins over fallback", () => {
    expect(
      resolveBucket({ shortcutBucketId: BILLS, defaultBucketId: DAILY })
    ).toBe(BILLS);
  });

  it("falls back to Daily", () => {
    expect(resolveBucket({ defaultBucketId: DAILY })).toBe(DAILY);
  });
});

// ─── Batch segmentation (mirrors parseLocally splitting) ────────────────────

function splitSegments(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

describe("batch input segmentation", () => {
  it("splits comma-separated batches", () => {
    expect(splitSegments("fare 30, lunch 145, coffee 90")).toEqual([
      "fare 30",
      "lunch 145",
      "coffee 90",
    ]);
  });

  it("splits newline-separated batches", () => {
    expect(splitSegments("fare 30\nlunch 145\ncoffee 90")).toEqual([
      "fare 30",
      "lunch 145",
      "coffee 90",
    ]);
  });

  it("keeps per-item tags attached to their segment", () => {
    const segments = splitSegments("@fare 30, grocery 620 :non-daily, lunch 145");
    expect(segments).toHaveLength(3);
    expect(segments[1]).toBe("grocery 620 :non-daily");
    expect(segments[0]).not.toContain(":non-daily");
    expect(segments[2]).not.toContain(":non-daily");
  });

  it("ignores empty segments and stray separators", () => {
    expect(splitSegments("fare 30,, \n lunch 145,")).toEqual([
      "fare 30",
      "lunch 145",
    ]);
  });
});
