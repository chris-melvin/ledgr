import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatKey, daysInMonth, firstDayOfMonth, isToday, formatCurrency } from "../utils";

describe("utils", () => {
  describe("formatKey", () => {
    it("should format date as YYYY-MM-DD string", () => {
      // Use local date to avoid timezone issues
      const date = new Date(2024, 2, 15, 10, 30, 0); // March 15, 2024 10:30:00 local
      expect(formatKey(date)).toBe("2024-03-15");
    });

    it("should handle dates at midnight", () => {
      const date = new Date(2024, 0, 1, 0, 0, 0); // Jan 1, 2024 midnight local
      expect(formatKey(date)).toBe("2024-01-01");
    });

    it("should handle dates near end of day", () => {
      const date = new Date(2024, 11, 31, 23, 59, 59); // Dec 31, 2024 23:59:59 local
      expect(formatKey(date)).toBe("2024-12-31");
    });

    it("should handle leap year date", () => {
      const date = new Date(2024, 1, 29, 12, 0, 0); // Feb 29, 2024 local
      expect(formatKey(date)).toBe("2024-02-29");
    });

    it("should return consistent format for same day different times", () => {
      const morning = new Date(2024, 5, 15, 8, 0, 0); // June 15, 2024 8:00 local
      const evening = new Date(2024, 5, 15, 20, 0, 0); // June 15, 2024 20:00 local
      expect(formatKey(morning)).toBe(formatKey(evening));
    });
  });

  describe("daysInMonth", () => {
    it("should return 31 for January", () => {
      expect(daysInMonth(2024, 0)).toBe(31);
    });

    it("should return 28 for February in non-leap year", () => {
      expect(daysInMonth(2023, 1)).toBe(28);
    });

    it("should return 29 for February in leap year", () => {
      expect(daysInMonth(2024, 1)).toBe(29);
    });

    it("should return 30 for April", () => {
      expect(daysInMonth(2024, 3)).toBe(30);
    });

    it("should return 31 for December", () => {
      expect(daysInMonth(2024, 11)).toBe(31);
    });

    it("should handle century years that are not leap years", () => {
      // 1900 is not a leap year (divisible by 100 but not 400)
      expect(daysInMonth(1900, 1)).toBe(28);
    });

    it("should handle century years that are leap years", () => {
      // 2000 is a leap year (divisible by 400)
      expect(daysInMonth(2000, 1)).toBe(29);
    });
  });

  describe("firstDayOfMonth", () => {
    it("should return correct day of week for first of month", () => {
      // January 1, 2024 is Monday (1)
      expect(firstDayOfMonth(2024, 0)).toBe(1);
    });

    it("should return Sunday as 0", () => {
      // September 1, 2024 is Sunday (0)
      expect(firstDayOfMonth(2024, 8)).toBe(0);
    });

    it("should return Saturday as 6", () => {
      // June 1, 2024 is Saturday (6)
      expect(firstDayOfMonth(2024, 5)).toBe(6);
    });

    it("should work for different years", () => {
      // January 1, 2023 is Sunday (0)
      expect(firstDayOfMonth(2023, 0)).toBe(0);
    });
  });

  describe("isToday", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true for today's date", () => {
      // Use local time to avoid timezone issues
      const fakeNow = new Date(2024, 5, 15, 12, 0, 0); // June 15, 2024 12:00 local
      vi.setSystemTime(fakeNow);

      const today = new Date(2024, 5, 15, 8, 30, 0); // June 15, 2024 8:30 local
      expect(isToday(today)).toBe(true);
    });

    it("should return false for yesterday", () => {
      const fakeNow = new Date(2024, 5, 15, 12, 0, 0); // June 15, 2024 local
      vi.setSystemTime(fakeNow);

      const yesterday = new Date(2024, 5, 14, 12, 0, 0); // June 14, 2024 local
      expect(isToday(yesterday)).toBe(false);
    });

    it("should return false for tomorrow", () => {
      const fakeNow = new Date(2024, 5, 15, 12, 0, 0); // June 15, 2024 local
      vi.setSystemTime(fakeNow);

      const tomorrow = new Date(2024, 5, 16, 12, 0, 0); // June 16, 2024 local
      expect(isToday(tomorrow)).toBe(false);
    });

    it("should handle edge of day correctly", () => {
      const fakeNow = new Date(2024, 5, 15, 23, 59, 59); // June 15, 2024 23:59:59 local
      vi.setSystemTime(fakeNow);

      const startOfToday = new Date(2024, 5, 15, 0, 0, 0); // June 15, 2024 00:00:00 local
      expect(isToday(startOfToday)).toBe(true);
    });
  });

  describe("formatCurrency", () => {
    it("should format positive amount with PHP peso symbol", () => {
      expect(formatCurrency(1234, "₱")).toBe("₱1,234");
    });

    it("should format negative amount as absolute value", () => {
      expect(formatCurrency(-500, "₱")).toBe("₱500");
    });

    it("should format zero", () => {
      expect(formatCurrency(0, "₱")).toBe("₱0");
    });

    it("should use default currency symbol when not specified", () => {
      expect(formatCurrency(100)).toBe("₱100");
    });

    it("should handle large numbers with thousand separators", () => {
      expect(formatCurrency(1000000, "₱")).toBe("₱1,000,000");
    });

    it("should handle custom currency symbols", () => {
      expect(formatCurrency(500, "$")).toBe("$500");
      expect(formatCurrency(500, "€")).toBe("€500");
    });

    it("should handle decimal amounts correctly", () => {
      // Note: toLocaleString behavior may vary, this tests the actual output
      const result = formatCurrency(99.5, "₱");
      expect(result).toMatch(/₱99/);
    });

    it("should handle very small amounts", () => {
      expect(formatCurrency(0.01, "₱")).toMatch(/₱0/);
    });

    it("should handle very large amounts", () => {
      expect(formatCurrency(999999999, "₱")).toBe("₱999,999,999");
    });
  });
});
