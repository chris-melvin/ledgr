/**
 * Date Utilities Test Suite
 *
 * Tests for timezone-aware date operations used throughout the application.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as dateUtils from "../date";

describe("Date Utilities", () => {
  describe("toTimestamp", () => {
    it("should convert date string to UTC timestamp", () => {
      const result = dateUtils.toTimestamp("2024-01-15", "America/New_York");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should handle full ISO timestamp by returning it as-is", () => {
      const input = "2024-01-15T12:30:00.000Z";
      const result = dateUtils.toTimestamp(input, "America/New_York");
      expect(result).toBe(input);
    });

    it("should handle Date object input", () => {
      const date = new Date("2024-01-15T00:00:00.000Z");
      const result = dateUtils.toTimestamp(date, "UTC");
      // Date object passed to toTimestamp gets converted based on its local representation
      // The result should be a valid ISO timestamp
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should use UTC as default timezone", () => {
      const result = dateUtils.toTimestamp("2024-01-15");
      expect(result).toContain("2024-01-15T00:00:00");
    });
  });

  describe("toUserDate", () => {
    it("should convert UTC timestamp to Date in user timezone", () => {
      const result = dateUtils.toUserDate("2024-01-15T05:00:00.000Z", "America/New_York");
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle UTC timezone", () => {
      const result = dateUtils.toUserDate("2024-01-15T12:00:00.000Z", "UTC");
      // toUserDate returns a Date object in the zoned time
      // The hours in the zoned date (as displayed) should be 12
      expect(result.getHours()).toBe(12);
    });
  });

  describe("formatDate", () => {
    it("should format timestamp with default format", () => {
      const result = dateUtils.formatDate("2024-01-15T12:00:00.000Z", "UTC");
      expect(result).toContain("January");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("should format with custom format string", () => {
      const result = dateUtils.formatDate(
        "2024-01-15T12:00:00.000Z",
        "UTC",
        dateUtils.DATE_FORMATS.ISO_DATE
      );
      expect(result).toBe("2024-01-15");
    });

    it("should format with short format", () => {
      const result = dateUtils.formatDate(
        "2024-01-15T12:00:00.000Z",
        "UTC",
        dateUtils.DATE_FORMATS.SHORT
      );
      expect(result).toBe("Jan 15, 2024");
    });
  });

  describe("getCurrentTimestamp", () => {
    it("should return current timestamp in ISO format", () => {
      const result = dateUtils.getCurrentTimestamp();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should return start of day when requested", () => {
      const result = dateUtils.getCurrentTimestamp("UTC", true);
      expect(result).toContain("T00:00:00.000Z");
    });
  });

  describe("dateRangeToTimestamps", () => {
    it("should convert date range to UTC timestamps", () => {
      const result = dateUtils.dateRangeToTimestamps(
        "2024-01-01",
        "2024-01-31",
        "UTC"
      );
      expect(result.start).toContain("2024-01-01");
      expect(result.end).toContain("2024-01-31");
    });

    it("should include full day when requested", () => {
      const result = dateUtils.dateRangeToTimestamps(
        "2024-01-01",
        "2024-01-31",
        "UTC",
        true
      );
      expect(result.end).toContain("T23:59:59");
    });
  });

  describe("isSameDay", () => {
    it("should return true for same day timestamps", () => {
      const result = dateUtils.isSameDay(
        "2024-01-15T10:00:00.000Z",
        "2024-01-15T22:00:00.000Z",
        "UTC"
      );
      expect(result).toBe(true);
    });

    it("should return false for different day timestamps", () => {
      const result = dateUtils.isSameDay(
        "2024-01-15T10:00:00.000Z",
        "2024-01-16T10:00:00.000Z",
        "UTC"
      );
      expect(result).toBe(false);
    });

    it("should handle timezone differences", () => {
      // 11pm on Jan 14 in NY (which is Jan 15 04:00 UTC)
      // vs 1am on Jan 15 in NY (which is Jan 15 06:00 UTC)
      // These are different days in NY timezone
      const result = dateUtils.isSameDay(
        "2024-01-15T04:00:00.000Z", // Jan 14 11pm in NY
        "2024-01-15T06:00:00.000Z", // Jan 15 1am in NY
        "America/New_York"
      );
      expect(result).toBe(false);
    });
  });

  describe("isSameMonth", () => {
    it("should return true for same month timestamps", () => {
      const result = dateUtils.isSameMonth(
        "2024-01-01T00:00:00.000Z",
        "2024-01-31T00:00:00.000Z",
        "UTC"
      );
      expect(result).toBe(true);
    });

    it("should return false for different month timestamps", () => {
      const result = dateUtils.isSameMonth(
        "2024-01-31T00:00:00.000Z",
        "2024-02-01T00:00:00.000Z",
        "UTC"
      );
      expect(result).toBe(false);
    });
  });

  describe("addDaysToTimestamp", () => {
    it("should add days to timestamp", () => {
      const result = dateUtils.addDaysToTimestamp("2024-01-15T00:00:00.000Z", 5, "UTC");
      expect(result).toContain("2024-01-20");
    });

    it("should handle negative days", () => {
      const result = dateUtils.addDaysToTimestamp("2024-01-15T00:00:00.000Z", -5, "UTC");
      expect(result).toContain("2024-01-10");
    });

    it("should handle month boundaries", () => {
      const result = dateUtils.addDaysToTimestamp("2024-01-31T00:00:00.000Z", 1, "UTC");
      expect(result).toContain("2024-02-01");
    });
  });

  describe("addMonthsToTimestamp", () => {
    it("should add months to timestamp", () => {
      const result = dateUtils.addMonthsToTimestamp("2024-01-15T00:00:00.000Z", 3, "UTC");
      expect(result).toContain("2024-04-15");
    });

    it("should handle year boundaries", () => {
      const result = dateUtils.addMonthsToTimestamp("2024-11-15T00:00:00.000Z", 3, "UTC");
      expect(result).toContain("2025-02-15");
    });
  });

  describe("getStartOfDay", () => {
    it("should return start of day in user timezone", () => {
      const result = dateUtils.getStartOfDay("2024-01-15T14:30:00.000Z", "UTC");
      expect(result).toContain("T00:00:00.000Z");
    });
  });

  describe("getEndOfDay", () => {
    it("should return end of day in user timezone", () => {
      const result = dateUtils.getEndOfDay("2024-01-15T14:30:00.000Z", "UTC");
      expect(result).toContain("T23:59:59");
    });
  });

  describe("getStartOfMonth", () => {
    it("should return start of month", () => {
      const result = dateUtils.getStartOfMonth("2024-01-15T14:30:00.000Z", "UTC");
      expect(result).toContain("2024-01-01T00:00:00");
    });
  });

  describe("getEndOfMonth", () => {
    it("should return end of month", () => {
      const result = dateUtils.getEndOfMonth("2024-01-15T14:30:00.000Z", "UTC");
      expect(result).toContain("2024-01-31T23:59:59");
    });

    it("should handle February in leap year", () => {
      const result = dateUtils.getEndOfMonth("2024-02-15T14:30:00.000Z", "UTC");
      expect(result).toContain("2024-02-29");
    });

    it("should handle February in non-leap year", () => {
      const result = dateUtils.getEndOfMonth("2023-02-15T14:30:00.000Z", "UTC");
      expect(result).toContain("2023-02-28");
    });
  });

  describe("getDifferenceInDays", () => {
    it("should calculate difference in days", () => {
      const result = dateUtils.getDifferenceInDays(
        "2024-01-20T00:00:00.000Z",
        "2024-01-15T00:00:00.000Z",
        "UTC"
      );
      expect(result).toBe(5);
    });

    it("should return negative for earlier date first", () => {
      const result = dateUtils.getDifferenceInDays(
        "2024-01-15T00:00:00.000Z",
        "2024-01-20T00:00:00.000Z",
        "UTC"
      );
      expect(result).toBe(-5);
    });
  });

  describe("isAfterTimestamp / isBeforeTimestamp", () => {
    it("should correctly compare timestamps", () => {
      expect(
        dateUtils.isAfterTimestamp(
          "2024-01-20T00:00:00.000Z",
          "2024-01-15T00:00:00.000Z"
        )
      ).toBe(true);
      expect(
        dateUtils.isBeforeTimestamp(
          "2024-01-15T00:00:00.000Z",
          "2024-01-20T00:00:00.000Z"
        )
      ).toBe(true);
    });
  });

  describe("isWithinTimestampInterval", () => {
    it("should return true for timestamp within interval", () => {
      const result = dateUtils.isWithinTimestampInterval(
        "2024-01-15T12:00:00.000Z",
        "2024-01-01T00:00:00.000Z",
        "2024-01-31T23:59:59.999Z"
      );
      expect(result).toBe(true);
    });

    it("should return false for timestamp outside interval", () => {
      const result = dateUtils.isWithinTimestampInterval(
        "2024-02-15T12:00:00.000Z",
        "2024-01-01T00:00:00.000Z",
        "2024-01-31T23:59:59.999Z"
      );
      expect(result).toBe(false);
    });
  });

  describe("getEachDayInInterval", () => {
    it("should return array of dates in interval", () => {
      const result = dateUtils.getEachDayInInterval(
        "2024-01-01T00:00:00.000Z",
        "2024-01-05T00:00:00.000Z",
        "UTC"
      );
      expect(result).toHaveLength(5);
      expect(result[0]).toBe("2024-01-01");
      expect(result[4]).toBe("2024-01-05");
    });
  });

  describe("getEachMonthInInterval", () => {
    it("should return array of months in interval", () => {
      const result = dateUtils.getEachMonthInInterval(
        "2024-01-15T00:00:00.000Z",
        "2024-06-15T00:00:00.000Z",
        "UTC"
      );
      expect(result).toHaveLength(6);
    });
  });

  describe("toDateString", () => {
    it("should convert timestamp to date string in timezone", () => {
      const result = dateUtils.toDateString("2024-01-15T12:00:00.000Z", "UTC");
      expect(result).toBe("2024-01-15");
    });
  });

  describe("fromDateString", () => {
    it("should convert date string to timestamp at midnight in timezone", () => {
      const result = dateUtils.fromDateString("2024-01-15", "UTC");
      expect(result).toContain("2024-01-15T00:00:00");
    });
  });

  describe("getCurrentDateString", () => {
    it("should return current date as string", () => {
      const result = dateUtils.getCurrentDateString("UTC");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getTodayTimestamp", () => {
    it("should return today at midnight in timezone", () => {
      const result = dateUtils.getTodayTimestamp("UTC");
      expect(result).toContain("T00:00:00.000Z");
    });
  });

  describe("isToday", () => {
    it("should return true for today's timestamp", () => {
      const today = new Date().toISOString();
      const result = dateUtils.isToday(today, "UTC");
      expect(result).toBe(true);
    });

    it("should return false for yesterday's timestamp", () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const result = dateUtils.isToday(yesterday, "UTC");
      expect(result).toBe(false);
    });
  });

  describe("isPast / isFuture", () => {
    it("should correctly identify past timestamps", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(dateUtils.isPast(past, "UTC")).toBe(true);
      expect(dateUtils.isFuture(past, "UTC")).toBe(false);
    });

    it("should correctly identify future timestamps", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(dateUtils.isFuture(future, "UTC")).toBe(true);
      expect(dateUtils.isPast(future, "UTC")).toBe(false);
    });
  });

  describe("DATE_FORMATS", () => {
    it("should have all expected format patterns", () => {
      expect(dateUtils.DATE_FORMATS.SHORT).toBe("MMM d, yyyy");
      expect(dateUtils.DATE_FORMATS.MEDIUM).toBe("MMMM d, yyyy");
      expect(dateUtils.DATE_FORMATS.LONG).toBe("EEEE, MMMM d, yyyy");
      expect(dateUtils.DATE_FORMATS.ISO_DATE).toBe("yyyy-MM-dd");
      expect(dateUtils.DATE_FORMATS.TIME_12H).toBe("h:mm a");
      expect(dateUtils.DATE_FORMATS.TIME_24H).toBe("HH:mm");
      expect(dateUtils.DATE_FORMATS.MONTH_YEAR).toBe("MMMM yyyy");
    });
  });

  describe("DEFAULT_TIMEZONE", () => {
    it("should be UTC", () => {
      expect(dateUtils.DEFAULT_TIMEZONE).toBe("UTC");
    });
  });
});

describe("Timezone Edge Cases", () => {
  describe("DST Transitions", () => {
    it("should handle spring forward correctly", () => {
      // March 10, 2024 - DST starts in US (2am becomes 3am)
      const beforeDST = "2024-03-10T06:00:00.000Z"; // 1am EST
      const afterDST = "2024-03-10T08:00:00.000Z"; // 4am EDT

      // Both should be on March 10 in New York
      expect(
        dateUtils.toDateString(beforeDST, "America/New_York")
      ).toBe("2024-03-10");
      expect(
        dateUtils.toDateString(afterDST, "America/New_York")
      ).toBe("2024-03-10");
    });

    it("should handle fall back correctly", () => {
      // November 3, 2024 - DST ends in US (2am becomes 1am)
      const beforeDSTEnd = "2024-11-03T05:00:00.000Z"; // 1am EDT
      const afterDSTEnd = "2024-11-03T07:00:00.000Z"; // 2am EST

      // Both should be on November 3 in New York
      expect(
        dateUtils.toDateString(beforeDSTEnd, "America/New_York")
      ).toBe("2024-11-03");
      expect(
        dateUtils.toDateString(afterDSTEnd, "America/New_York")
      ).toBe("2024-11-03");
    });
  });

  describe("International Date Line", () => {
    it("should handle dates across international date line", () => {
      // Same moment in time, different dates
      const timestamp = "2024-01-15T10:00:00.000Z";

      // In Tokyo (UTC+9), this is Jan 15, 7pm
      const tokyoDate = dateUtils.toDateString(timestamp, "Asia/Tokyo");
      expect(tokyoDate).toBe("2024-01-15");

      // In Honolulu (UTC-10), this is Jan 15, 12am
      const honoluluDate = dateUtils.toDateString(timestamp, "Pacific/Honolulu");
      expect(honoluluDate).toBe("2024-01-15");
    });

    it("should handle day boundary crossings", () => {
      // Midnight UTC on Jan 15
      const timestamp = "2024-01-15T00:00:00.000Z";

      // In Tokyo (UTC+9), this is Jan 15, 9am
      const tokyoDate = dateUtils.toDateString(timestamp, "Asia/Tokyo");
      expect(tokyoDate).toBe("2024-01-15");

      // In Los Angeles (UTC-8), this is Jan 14, 4pm
      const laDate = dateUtils.toDateString(timestamp, "America/Los_Angeles");
      expect(laDate).toBe("2024-01-14");
    });
  });

  describe("Month/Year Boundaries", () => {
    it("should handle year boundary correctly", () => {
      const timestamp = "2024-01-01T00:00:00.000Z";
      const prevDay = dateUtils.subtractDaysFromTimestamp(timestamp, 1, "UTC");
      expect(prevDay).toContain("2023-12-31");
    });

    it("should handle leap year February correctly", () => {
      const feb28_2024 = "2024-02-28T00:00:00.000Z";
      const nextDay = dateUtils.addDaysToTimestamp(feb28_2024, 1, "UTC");
      expect(nextDay).toContain("2024-02-29");

      const feb28_2023 = "2023-02-28T00:00:00.000Z";
      const nextDay2023 = dateUtils.addDaysToTimestamp(feb28_2023, 1, "UTC");
      expect(nextDay2023).toContain("2023-03-01");
    });
  });
});
