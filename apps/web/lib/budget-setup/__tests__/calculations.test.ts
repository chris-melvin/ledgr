import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeToMonthly,
  calculateTotalMonthlyIncome,
  calculateTotalMonthlyExpenses,
  calculateAvailableForBudget,
  calculateBucketAllocations,
  calculateDailyLimit,
  getDaysInCurrentMonth,
  getDaysRemainingInMonth,
  calculateBudgetSummary,
  validateBucketPercentages,
  generateBucketSlug,
} from "../calculations";
import type { WizardIncome, WizardBill, WizardBucket } from "../types";

describe("Budget Setup Calculations", () => {
  describe("normalizeToMonthly", () => {
    describe("weekly frequency", () => {
      it("should multiply by 4.33 for weekly", () => {
        expect(normalizeToMonthly(100, "weekly")).toBe(433);
      });

      it("should handle small amounts", () => {
        expect(normalizeToMonthly(10, "weekly")).toBe(43.3);
      });
    });

    describe("biweekly frequency", () => {
      it("should multiply by 2.17 for biweekly", () => {
        expect(normalizeToMonthly(1000, "biweekly")).toBe(2170);
      });

      it("should handle typical paycheck amount", () => {
        expect(normalizeToMonthly(2500, "biweekly")).toBe(5425);
      });
    });

    describe("monthly frequency", () => {
      it("should return same amount for monthly", () => {
        expect(normalizeToMonthly(5000, "monthly")).toBe(5000);
      });
    });

    describe("quarterly frequency", () => {
      it("should divide by 3 for quarterly", () => {
        expect(normalizeToMonthly(3000, "quarterly")).toBe(1000);
      });

      it("should handle non-divisible amounts", () => {
        expect(normalizeToMonthly(1000, "quarterly")).toBeCloseTo(333.33, 1);
      });
    });

    describe("yearly frequency", () => {
      it("should divide by 12 for yearly", () => {
        expect(normalizeToMonthly(12000, "yearly")).toBe(1000);
      });

      it("should handle annual bonus", () => {
        expect(normalizeToMonthly(60000, "yearly")).toBe(5000);
      });
    });

    describe("once frequency", () => {
      it("should return 0 for one-time payments", () => {
        expect(normalizeToMonthly(10000, "once")).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("should handle zero amount", () => {
        expect(normalizeToMonthly(0, "monthly")).toBe(0);
        expect(normalizeToMonthly(0, "weekly")).toBe(0);
      });

      it("should handle negative amounts", () => {
        expect(normalizeToMonthly(-100, "monthly")).toBe(-100);
      });

      it("should return amount for unknown frequency", () => {
        // @ts-expect-error Testing unknown frequency
        expect(normalizeToMonthly(100, "unknown")).toBe(100);
      });
    });
  });

  describe("calculateTotalMonthlyIncome", () => {
    it("should sum all incomes normalized to monthly", () => {
      const incomes: WizardIncome[] = [
        { id: "Salary_id", label: "Salary", amount: 5000, frequency: "monthly", isPrimary: true },
        { id: "Side gig_id", label: "Side gig", amount: 500, frequency: "weekly", isPrimary: true },
      ];

      const total = calculateTotalMonthlyIncome(incomes);
      // 5000 + (500 * 4.33) = 5000 + 2165 = 7165
      expect(total).toBe(7165);
    });

    it("should return 0 for empty incomes", () => {
      expect(calculateTotalMonthlyIncome([])).toBe(0);
    });

    it("should handle single income", () => {
      const incomes: WizardIncome[] = [
        { id: "Salary_id", label: "Salary", amount: 5000, frequency: "monthly", isPrimary: true },
      ];
      expect(calculateTotalMonthlyIncome(incomes)).toBe(5000);
    });

    it("should handle mixed frequencies", () => {
      const incomes: WizardIncome[] = [
        { id: "Salary_id", label: "Salary", amount: 4000, frequency: "biweekly", isPrimary: true }, // 8680
        { id: "Bonus_id", label: "Bonus", amount: 12000, frequency: "yearly", isPrimary: true }, // 1000
        { id: "Freelance_id", label: "Freelance", amount: 100, frequency: "weekly", isPrimary: true }, // 433
      ];

      const total = calculateTotalMonthlyIncome(incomes);
      expect(total).toBe(4000 * 2.17 + 12000 / 12 + 100 * 4.33);
    });
  });

  describe("calculateTotalMonthlyExpenses", () => {
    it("should sum all expenses normalized to monthly", () => {
      const bills: WizardBill[] = [
        { id: "Rent_id", label: "Rent", amount: 1500, frequency: "monthly", category: "housing" },
        { id: "Insurance_id", label: "Insurance", amount: 600, frequency: "yearly", category: "insurance" },
      ];

      const total = calculateTotalMonthlyExpenses(bills);
      // 1500 + (600 / 12) = 1500 + 50 = 1550
      expect(total).toBe(1550);
    });

    it("should return 0 for empty bills", () => {
      expect(calculateTotalMonthlyExpenses([])).toBe(0);
    });
  });

  describe("calculateAvailableForBudget", () => {
    it("should return income minus expenses", () => {
      expect(calculateAvailableForBudget(10000, 4000)).toBe(6000);
    });

    it("should return 0 when expenses exceed income", () => {
      expect(calculateAvailableForBudget(3000, 5000)).toBe(0);
    });

    it("should return 0 when expenses equal income", () => {
      expect(calculateAvailableForBudget(5000, 5000)).toBe(0);
    });

    it("should handle zero income", () => {
      expect(calculateAvailableForBudget(0, 1000)).toBe(0);
    });

    it("should handle zero expenses", () => {
      expect(calculateAvailableForBudget(5000, 0)).toBe(5000);
    });
  });

  describe("calculateBucketAllocations", () => {
    const baseBuckets: WizardBucket[] = [
      {
        id: "1",
        name: "Savings",
        slug: "savings",
        percentage: 20,
        targetAmount: null,
        color: "#22c55e",
        icon: "PiggyBank",
        isDefault: false,
        isSystem: true,
        allocatedAmount: 0,
      },
      {
        id: "2",
        name: "Daily Spending",
        slug: "daily-spending",
        percentage: 80,
        targetAmount: null,
        color: "#3b82f6",
        icon: "Wallet",
        isDefault: true,
        isSystem: true,
        allocatedAmount: 0,
      },
    ];

    it("should allocate amounts based on percentages", () => {
      const result = calculateBucketAllocations(baseBuckets, 10000);

      expect(result[0]?.allocatedAmount).toBe(2000); // 20% of 10000
      expect(result[1]?.allocatedAmount).toBe(8000); // 80% of 10000
    });

    it("should floor allocated amounts to avoid fractional cents", () => {
      const result = calculateBucketAllocations(baseBuckets, 9999);

      expect(result[0]?.allocatedAmount).toBe(1999); // floor(20% of 9999)
      expect(result[1]?.allocatedAmount).toBe(7999); // floor(80% of 9999)
    });

    it("should handle zero available amount", () => {
      const result = calculateBucketAllocations(baseBuckets, 0);

      expect(result[0]?.allocatedAmount).toBe(0);
      expect(result[1]?.allocatedAmount).toBe(0);
    });

    it("should preserve other bucket properties", () => {
      const result = calculateBucketAllocations(baseBuckets, 10000);

      expect(result[0]?.name).toBe("Savings");
      expect(result[0]?.isDefault).toBe(false);
      expect(result[1]?.isDefault).toBe(true);
    });
  });

  describe("calculateDailyLimit", () => {
    const bucketsWithDefault: WizardBucket[] = [
      {
        id: "1",
        name: "Daily Spending",
        slug: "daily-spending",
        percentage: 80,
        targetAmount: null,
        color: "#3b82f6",
        icon: "Wallet",
        isDefault: true,
        isSystem: true,
        allocatedAmount: 0,
      },
    ];

    const bucketsWithoutDefault: WizardBucket[] = [
      {
        id: "1",
        name: "Savings",
        slug: "savings",
        percentage: 100,
        targetAmount: null,
        color: "#22c55e",
        icon: "PiggyBank",
        isDefault: false,
        isSystem: true,
        allocatedAmount: 0,
      },
    ];

    it("should calculate daily limit from default bucket", () => {
      // 80% of 30000 = 24000, / 30 days = 800
      const limit = calculateDailyLimit(bucketsWithDefault, 30000, 30);
      expect(limit).toBe(800);
    });

    it("should use 50% fallback when no default bucket", () => {
      // 50% of 30000 = 15000, / 30 days = 500
      const limit = calculateDailyLimit(bucketsWithoutDefault, 30000, 30);
      expect(limit).toBe(500);
    });

    it("should floor the daily limit", () => {
      // 80% of 10000 = 8000, / 30 = 266.67 -> 266
      const limit = calculateDailyLimit(bucketsWithDefault, 10000, 30);
      expect(limit).toBe(266);
    });

    it("should handle different days in month", () => {
      // 80% of 30000 = 24000, / 31 days = 774.19 -> 774
      const limit = calculateDailyLimit(bucketsWithDefault, 30000, 31);
      expect(limit).toBe(774);

      // / 28 days = 857.14 -> 857
      const limit28 = calculateDailyLimit(bucketsWithDefault, 30000, 28);
      expect(limit28).toBe(857);
    });

    it("should default to 30 days if not specified", () => {
      const limit = calculateDailyLimit(bucketsWithDefault, 30000);
      expect(limit).toBe(800);
    });
  });

  describe("getDaysInCurrentMonth", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return 31 for January", () => {
      vi.setSystemTime(new Date("2024-01-15"));
      expect(getDaysInCurrentMonth()).toBe(31);
    });

    it("should return 29 for February in leap year", () => {
      vi.setSystemTime(new Date("2024-02-15")); // 2024 is leap year
      expect(getDaysInCurrentMonth()).toBe(29);
    });

    it("should return 28 for February in non-leap year", () => {
      vi.setSystemTime(new Date("2023-02-15"));
      expect(getDaysInCurrentMonth()).toBe(28);
    });

    it("should return 30 for April", () => {
      vi.setSystemTime(new Date("2024-04-15"));
      expect(getDaysInCurrentMonth()).toBe(30);
    });

    it("should return 31 for December", () => {
      vi.setSystemTime(new Date("2024-12-25"));
      expect(getDaysInCurrentMonth()).toBe(31);
    });
  });

  describe("getDaysRemainingInMonth", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return full month on first day", () => {
      vi.setSystemTime(new Date("2024-01-01"));
      expect(getDaysRemainingInMonth()).toBe(31);
    });

    it("should return 1 on last day", () => {
      vi.setSystemTime(new Date("2024-01-31"));
      expect(getDaysRemainingInMonth()).toBe(1);
    });

    it("should return correct remaining days mid-month", () => {
      vi.setSystemTime(new Date("2024-01-15"));
      // 31 - 15 + 1 = 17
      expect(getDaysRemainingInMonth()).toBe(17);
    });
  });

  describe("validateBucketPercentages", () => {
    it("should return valid for exactly 100%", () => {
      const buckets: WizardBucket[] = [
        { id: "A_id", name: "A", slug: "a", percentage: 50, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
        { id: "B_id", name: "B", slug: "b", percentage: 50, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
      ];

      const result = validateBucketPercentages(buckets);
      expect(result.isValid).toBe(true);
      expect(result.total).toBe(100);
      expect(result.message).toBe("Allocation complete");
    });

    it("should handle floating point near 100%", () => {
      const buckets: WizardBucket[] = [
        { id: "A_id", name: "A", slug: "a", percentage: 33.33, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
        { id: "B_id", name: "B", slug: "b", percentage: 33.33, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
        { id: "C_id", name: "C", slug: "c", percentage: 33.34, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
      ];

      const result = validateBucketPercentages(buckets);
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for under 100%", () => {
      const buckets: WizardBucket[] = [
        { id: "A_id", name: "A", slug: "a", percentage: 30, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
        { id: "B_id", name: "B", slug: "b", percentage: 40, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
      ];

      const result = validateBucketPercentages(buckets);
      expect(result.isValid).toBe(false);
      expect(result.total).toBe(70);
      expect(result.message).toBe("30.0% remaining");
    });

    it("should return invalid for over 100%", () => {
      const buckets: WizardBucket[] = [
        { id: "A_id", name: "A", slug: "a", percentage: 60, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
        { id: "B_id", name: "B", slug: "b", percentage: 60, targetAmount: null, color: "", icon: "", isDefault: false, isSystem: false, allocatedAmount: 0 },
      ];

      const result = validateBucketPercentages(buckets);
      expect(result.isValid).toBe(false);
      expect(result.total).toBe(120);
      expect(result.message).toBe("20.0% over allocated");
    });

    it("should handle empty buckets", () => {
      const result = validateBucketPercentages([]);
      expect(result.isValid).toBe(false);
      expect(result.total).toBe(0);
    });
  });

  describe("generateBucketSlug", () => {
    it("should convert to lowercase", () => {
      expect(generateBucketSlug("DAILY SPENDING")).toBe("daily-spending");
    });

    it("should replace spaces with hyphens", () => {
      expect(generateBucketSlug("Daily Spending")).toBe("daily-spending");
    });

    it("should remove special characters", () => {
      expect(generateBucketSlug("Food & Drinks!")).toBe("food-drinks");
    });

    it("should remove leading/trailing hyphens", () => {
      expect(generateBucketSlug("  Savings  ")).toBe("savings");
    });

    it("should handle numbers", () => {
      expect(generateBucketSlug("Fund 2024")).toBe("fund-2024");
    });

    it("should handle consecutive special characters", () => {
      expect(generateBucketSlug("A & B & C")).toBe("a-b-c");
    });
  });

  describe("calculateBudgetSummary", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15")); // June has 30 days
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should calculate complete budget summary", () => {
      const incomes: WizardIncome[] = [
        { id: "Salary_id", label: "Salary", amount: 10000, frequency: "monthly", isPrimary: true },
      ];

      const bills: WizardBill[] = [
        { id: "Rent_id", label: "Rent", amount: 3000, frequency: "monthly", category: "housing" },
      ];

      const buckets: WizardBucket[] = [
        { id: "Savings_id", name: "Savings", slug: "savings", percentage: 20, targetAmount: null, color: "#22c55e", icon: "PiggyBank", isDefault: false, isSystem: true, allocatedAmount: 0 },
        { id: "Daily Spending_id", name: "Daily Spending", slug: "daily-spending", percentage: 80, targetAmount: null, color: "#3b82f6", icon: "Wallet", isDefault: true, isSystem: true, allocatedAmount: 0 },
      ];

      const summary = calculateBudgetSummary(incomes, bills, buckets);

      expect(summary.totalMonthlyIncome).toBe(10000);
      expect(summary.totalFixedExpenses).toBe(3000);
      expect(summary.availableForBudgeting).toBe(7000);
      expect(summary.savingsAmount).toBe(1400); // 20% of 7000
      expect(summary.dailySpendingAmount).toBe(5600); // 80% of 7000
      expect(summary.calculatedDailyLimit).toBe(186); // floor(5600 / 30)
      expect(summary.daysInMonth).toBe(30);
    });

    it("should handle no savings bucket", () => {
      const incomes: WizardIncome[] = [
        { id: "Salary_id", label: "Salary", amount: 9000, frequency: "monthly", isPrimary: true },
      ];

      const buckets: WizardBucket[] = [
        { id: "Daily Spending_id", name: "Daily Spending", slug: "daily-spending", percentage: 100, targetAmount: null, color: "#3b82f6", icon: "Wallet", isDefault: true, isSystem: true, allocatedAmount: 0 },
      ];

      const summary = calculateBudgetSummary(incomes, [], buckets);

      expect(summary.savingsAmount).toBe(0);
      expect(summary.dailySpendingAmount).toBe(9000);
    });
  });
});
