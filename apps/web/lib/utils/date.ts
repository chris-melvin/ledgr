/**
 * Centralized Date Utilities with Full Timezone Support
 *
 * This module provides timezone-aware date operations for the usemargin application.
 * All functions handle timezone conversions properly to ensure dates are displayed
 * and stored correctly regardless of the user's timezone.
 *
 * Key Concepts:
 * - Storage: All timestamps stored in database as UTC TIMESTAMPTZ
 * - Display: Dates displayed in user's local timezone
 * - Conversion: Use these utilities for all date operations
 *
 * @module lib/utils/date
 */

import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  subDays,
  subMonths,
  isSameDay as dateFnsIsSameDay,
  isSameMonth as dateFnsIsSameMonth,
  isSameYear as dateFnsIsSameYear,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isAfter,
  isBefore,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

/**
 * Default timezone used when none is specified
 */
export const DEFAULT_TIMEZONE = "UTC";

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
  // Display formats
  SHORT: "MMM d, yyyy", // Jan 1, 2024
  MEDIUM: "MMMM d, yyyy", // January 1, 2024
  LONG: "EEEE, MMMM d, yyyy", // Monday, January 1, 2024
  ISO_DATE: "yyyy-MM-dd", // 2024-01-01

  // Time formats
  TIME_12H: "h:mm a", // 1:30 PM
  TIME_24H: "HH:mm", // 13:30
  DATETIME_SHORT: "MMM d, h:mm a", // Jan 1, 1:30 PM
  DATETIME_MEDIUM: "MMM d, yyyy h:mm a", // Jan 1, 2024 1:30 PM

  // Special formats
  MONTH_YEAR: "MMMM yyyy", // January 2024
  MONTH_DAY: "MMM d", // Jan 1
  YEAR: "yyyy", // 2024
  WEEKDAY_LONG: "EEEE, MMMM d, yyyy", // Monday, January 1, 2024 (same as LONG)
  WEEKDAY_SHORT: "EEE, MMM d", // Mon, Jan 1
} as const;

/**
 * Converts any date input to a UTC timestamp string (ISO 8601)
 *
 * @param date - Date input (Date object, ISO string, or timestamp string)
 * @param timezone - User's timezone (e.g., 'America/New_York')
 * @returns UTC timestamp string in ISO 8601 format
 *
 * @example
 * // User in New York selects "2024-01-15" in their calendar
 * toTimestamp("2024-01-15", "America/New_York")
 * // Returns: "2024-01-15T05:00:00.000Z" (midnight in NY = 5am UTC)
 */
export function toTimestamp(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  // If the input is already a full ISO timestamp, parse it as-is
  if (typeof date === "string" && date.includes("T")) {
    return dateObj.toISOString();
  }

  // If it's a date-only string (YYYY-MM-DD), treat it as midnight in the user's timezone
  const zonedDate = fromZonedTime(dateObj, timezone);
  return zonedDate.toISOString();
}

/**
 * Converts a UTC timestamp to a Date object in the user's timezone
 *
 * @param timestamp - UTC timestamp string
 * @param timezone - User's timezone
 * @returns Date object adjusted to user's timezone
 *
 * @example
 * // Convert UTC timestamp to user's local time
 * toUserDate("2024-01-15T05:00:00.000Z", "America/New_York")
 * // Returns Date object representing 2024-01-15 00:00:00 in New York
 */
export function toUserDate(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const utcDate = parseISO(timestamp);
  return toZonedTime(utcDate, timezone);
}

/**
 * Formats a timestamp for display in the user's timezone
 *
 * @param timestamp - UTC timestamp string
 * @param timezone - User's timezone
 * @param formatString - Format pattern (use DATE_FORMATS constants or custom pattern)
 * @returns Formatted date string
 *
 * @example
 * formatDate("2024-01-15T05:00:00.000Z", "America/New_York", DATE_FORMATS.MEDIUM)
 * // Returns: "January 15, 2024"
 */
export function formatDate(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE,
  formatString: string = DATE_FORMATS.MEDIUM
): string {
  return formatInTimeZone(timestamp, timezone, formatString);
}

/**
 * Gets the current timestamp in UTC, optionally starting from a specific time in user's timezone
 *
 * @param timezone - User's timezone
 * @param startOfDayInTimezone - If true, returns midnight in user's timezone as UTC
 * @returns Current UTC timestamp string
 *
 * @example
 * // Get current timestamp
 * getCurrentTimestamp()
 * // Returns: "2024-01-15T14:30:00.000Z"
 *
 * // Get midnight today in user's timezone
 * getCurrentTimestamp("America/New_York", true)
 * // Returns: "2024-01-15T05:00:00.000Z" (midnight in NY)
 */
export function getCurrentTimestamp(
  timezone: string = DEFAULT_TIMEZONE,
  startOfDayInTimezone: boolean = false
): string {
  const now = new Date();

  if (startOfDayInTimezone) {
    const zonedNow = toZonedTime(now, timezone);
    const startOfDayZoned = startOfDay(zonedNow);
    return fromZonedTime(startOfDayZoned, timezone).toISOString();
  }

  return now.toISOString();
}

/**
 * Converts a date range (start and end dates) to UTC timestamps
 *
 * @param startDate - Start date (YYYY-MM-DD or Date)
 * @param endDate - End date (YYYY-MM-DD or Date)
 * @param timezone - User's timezone
 * @param includeFullDay - If true, end timestamp is end of day instead of start
 * @returns Object with start and end UTC timestamps
 *
 * @example
 * // Get timestamp range for a month view
 * dateRangeToTimestamps("2024-01-01", "2024-01-31", "America/New_York", true)
 * // Returns: {
 * //   start: "2024-01-01T05:00:00.000Z", // midnight Jan 1 in NY
 * //   end: "2024-02-01T04:59:59.999Z"    // end of Jan 31 in NY
 * // }
 */
export function dateRangeToTimestamps(
  startDate: Date | string,
  endDate: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
  includeFullDay: boolean = false
): { start: string; end: string } {
  const startDateObj = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const endDateObj = typeof endDate === "string" ? parseISO(endDate) : endDate;

  const startZoned = fromZonedTime(startOfDay(startDateObj), timezone);
  const endZoned = includeFullDay
    ? fromZonedTime(endOfDay(endDateObj), timezone)
    : fromZonedTime(startOfDay(endDateObj), timezone);

  return {
    start: startZoned.toISOString(),
    end: endZoned.toISOString(),
  };
}

/**
 * Checks if two timestamps represent the same day in the user's timezone
 *
 * @param timestamp1 - First UTC timestamp
 * @param timestamp2 - Second UTC timestamp
 * @param timezone - User's timezone
 * @returns True if both timestamps are on the same day in the user's timezone
 *
 * @example
 * isSameDay(
 *   "2024-01-15T04:00:00.000Z", // 11pm Jan 14 in NY
 *   "2024-01-15T06:00:00.000Z", // 1am Jan 15 in NY
 *   "America/New_York"
 * )
 * // Returns: false (different days in NY timezone)
 */
export function isSameDay(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const date1 = toUserDate(timestamp1, timezone);
  const date2 = toUserDate(timestamp2, timezone);
  return dateFnsIsSameDay(date1, date2);
}

/**
 * Checks if two timestamps are in the same month in the user's timezone
 */
export function isSameMonth(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const date1 = toUserDate(timestamp1, timezone);
  const date2 = toUserDate(timestamp2, timezone);
  return dateFnsIsSameMonth(date1, date2);
}

/**
 * Checks if two timestamps are in the same year in the user's timezone
 */
export function isSameYear(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const date1 = toUserDate(timestamp1, timezone);
  const date2 = toUserDate(timestamp2, timezone);
  return dateFnsIsSameYear(date1, date2);
}

/**
 * Adds days to a timestamp, accounting for timezone
 *
 * @param timestamp - UTC timestamp
 * @param days - Number of days to add (negative to subtract)
 * @param timezone - User's timezone
 * @returns New UTC timestamp
 */
export function addDaysToTimestamp(
  timestamp: string,
  days: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = addDays(date, days);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Subtracts days from a timestamp, accounting for timezone
 */
export function subtractDaysFromTimestamp(
  timestamp: string,
  days: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = subDays(date, days);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Gets the start of day timestamp in user's timezone
 *
 * @param timestamp - UTC timestamp
 * @param timezone - User's timezone
 * @returns UTC timestamp representing start of day (midnight) in user's timezone
 */
export function getStartOfDay(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const start = startOfDay(date);
  return fromZonedTime(start, timezone).toISOString();
}

/**
 * Gets the end of day timestamp in user's timezone
 */
export function getEndOfDay(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const end = endOfDay(date);
  return fromZonedTime(end, timezone).toISOString();
}

/**
 * Gets the start of month timestamp in user's timezone
 */
export function getStartOfMonth(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const start = startOfMonth(date);
  return fromZonedTime(start, timezone).toISOString();
}

/**
 * Gets the end of month timestamp in user's timezone
 */
export function getEndOfMonth(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const end = endOfMonth(date);
  return fromZonedTime(end, timezone).toISOString();
}

/**
 * Gets the start of week timestamp in user's timezone
 */
export function getStartOfWeek(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): string {
  const date = toUserDate(timestamp, timezone);
  const start = startOfWeek(date, { weekStartsOn });
  return fromZonedTime(start, timezone).toISOString();
}

/**
 * Gets the end of week timestamp in user's timezone
 */
export function getEndOfWeek(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): string {
  const date = toUserDate(timestamp, timezone);
  const end = endOfWeek(date, { weekStartsOn });
  return fromZonedTime(end, timezone).toISOString();
}

/**
 * Gets the start of year timestamp in user's timezone
 */
export function getStartOfYear(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const start = startOfYear(date);
  return fromZonedTime(start, timezone).toISOString();
}

/**
 * Gets the end of year timestamp in user's timezone
 */
export function getEndOfYear(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const end = endOfYear(date);
  return fromZonedTime(end, timezone).toISOString();
}

/**
 * Adds months to a timestamp, accounting for timezone
 */
export function addMonthsToTimestamp(
  timestamp: string,
  months: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = addMonths(date, months);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Subtracts months from a timestamp, accounting for timezone
 */
export function subtractMonthsFromTimestamp(
  timestamp: string,
  months: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = subMonths(date, months);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Adds years to a timestamp, accounting for timezone
 */
export function addYearsToTimestamp(
  timestamp: string,
  years: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = addYears(date, years);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Adds weeks to a timestamp, accounting for timezone
 */
export function addWeeksToTimestamp(
  timestamp: string,
  weeks: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = addWeeks(date, weeks);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Adds quarters to a timestamp, accounting for timezone
 */
export function addQuartersToTimestamp(
  timestamp: string,
  quarters: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = toUserDate(timestamp, timezone);
  const newDate = addQuarters(date, quarters);
  return fromZonedTime(newDate, timezone).toISOString();
}

/**
 * Calculates difference in days between two timestamps in user's timezone
 */
export function getDifferenceInDays(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): number {
  const date1 = toUserDate(timestamp1, timezone);
  const date2 = toUserDate(timestamp2, timezone);
  return differenceInDays(date1, date2);
}

/**
 * Calculates difference in months between two timestamps in user's timezone
 */
export function getDifferenceInMonths(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): number {
  const date1 = toUserDate(timestamp1, timezone);
  const date2 = toUserDate(timestamp2, timezone);
  return differenceInMonths(date1, date2);
}

/**
 * Calculates difference in years between two timestamps in user's timezone
 */
export function getDifferenceInYears(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): number {
  const date1 = toUserDate(timestamp1, timezone);
  const date2 = toUserDate(timestamp2, timezone);
  return differenceInYears(date1, date2);
}

/**
 * Checks if timestamp1 is after timestamp2
 */
export function isAfterTimestamp(timestamp1: string, timestamp2: string): boolean {
  return isAfter(parseISO(timestamp1), parseISO(timestamp2));
}

/**
 * Checks if timestamp1 is before timestamp2
 */
export function isBeforeTimestamp(timestamp1: string, timestamp2: string): boolean {
  return isBefore(parseISO(timestamp1), parseISO(timestamp2));
}

/**
 * Checks if a timestamp is within a date range
 */
export function isWithinTimestampInterval(
  timestamp: string,
  start: string,
  end: string
): boolean {
  return isWithinInterval(parseISO(timestamp), {
    start: parseISO(start),
    end: parseISO(end),
  });
}

/**
 * Gets an array of all days between two timestamps
 *
 * @param startTimestamp - Start timestamp
 * @param endTimestamp - End timestamp
 * @param timezone - User's timezone
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getEachDayInInterval(
  startTimestamp: string,
  endTimestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string[] {
  const start = toUserDate(startTimestamp, timezone);
  const end = toUserDate(endTimestamp, timezone);

  const days = eachDayOfInterval({ start, end });
  return days.map(day => format(day, DATE_FORMATS.ISO_DATE));
}

/**
 * Gets an array of all months between two timestamps
 *
 * @param startTimestamp - Start timestamp
 * @param endTimestamp - End timestamp
 * @param timezone - User's timezone
 * @returns Array of date strings representing first day of each month
 */
export function getEachMonthInInterval(
  startTimestamp: string,
  endTimestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string[] {
  const start = toUserDate(startTimestamp, timezone);
  const end = toUserDate(endTimestamp, timezone);

  const months = eachMonthOfInterval({ start, end });
  return months.map(month => format(month, DATE_FORMATS.ISO_DATE));
}

/**
 * Converts a timestamp to a date string in user's timezone (YYYY-MM-DD)
 *
 * @param timestamp - UTC timestamp
 * @param timezone - User's timezone
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * toDateString("2024-01-15T05:00:00.000Z", "America/New_York")
 * // Returns: "2024-01-15"
 */
export function toDateString(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(timestamp, timezone, DATE_FORMATS.ISO_DATE);
}

/**
 * Parses a date string (YYYY-MM-DD) into a timestamp at midnight in user's timezone
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timezone - User's timezone
 * @returns UTC timestamp representing midnight in user's timezone
 *
 * @example
 * fromDateString("2024-01-15", "America/New_York")
 * // Returns: "2024-01-15T05:00:00.000Z" (midnight in NY = 5am UTC)
 */
export function fromDateString(
  dateString: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = parseISO(dateString);
  return fromZonedTime(startOfDay(date), timezone).toISOString();
}

/**
 * Gets the current date string in user's timezone (YYYY-MM-DD)
 *
 * @param timezone - User's timezone
 * @returns Current date string in YYYY-MM-DD format
 */
export function getCurrentDateString(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date();
  return formatInTimeZone(now, timezone, DATE_FORMATS.ISO_DATE);
}

/**
 * Helper to get a timestamp for "today" in user's timezone
 * Useful for default values in forms
 */
export function getTodayTimestamp(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const startOfToday = startOfDay(zonedNow);
  return fromZonedTime(startOfToday, timezone).toISOString();
}

/**
 * Helper to check if a timestamp is today in user's timezone
 */
export function isToday(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const todayTimestamp = getTodayTimestamp(timezone);
  return isSameDay(timestamp, todayTimestamp, timezone);
}

/**
 * Helper to check if a timestamp is in the past in user's timezone
 */
export function isPast(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const now = getCurrentTimestamp(timezone);
  return isBeforeTimestamp(timestamp, now);
}

/**
 * Helper to check if a timestamp is in the future in user's timezone
 */
export function isFuture(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const now = getCurrentTimestamp(timezone);
  return isAfterTimestamp(timestamp, now);
}

// =============================================================================
// ADDITIONAL HELPERS FOR COMPATIBILITY
// =============================================================================

/**
 * Format a timestamp or Date in a specific timezone
 *
 * @param input - UTC timestamp string or Date object
 * @param timezone - Target timezone
 * @param formatString - Optional format pattern
 */
export function formatInTimezone(
  input: string | Date,
  timezone: string = DEFAULT_TIMEZONE,
  formatString: string = DATE_FORMATS.ISO_DATE
): string {
  const timestamp = typeof input === "string" ? input : input.toISOString();
  return formatInTimeZone(timestamp, timezone, formatString);
}

/**
 * Parse a date string in a specific timezone
 *
 * @param dateStr - Date string to parse (e.g., "2024-01-15")
 * @param timezone - Timezone to interpret the date in
 * @param _formatStr - Format string (unused, for compatibility)
 * @returns Date object
 */
export function parseInTimezone(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE,
  _formatStr?: string // Accept but ignore format string for compatibility
): Date {
  const date = parseISO(dateStr);
  return toZonedTime(date, timezone);
}

/**
 * Get start of day for a Date object in a timezone
 * Returns a Date object (not timestamp string)
 */
export function startOfDayInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zoned = toZonedTime(date, timezone);
  return startOfDay(zoned);
}

/**
 * Get end of day for a Date object in a timezone
 * Returns a Date object (not timestamp string)
 */
export function endOfDayInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zoned = toZonedTime(date, timezone);
  return endOfDay(zoned);
}

/**
 * Get start of week for a Date object in a timezone
 * Returns a Date object (not timestamp string)
 */
export function startOfWeekInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0
): Date {
  const zoned = toZonedTime(date, timezone);
  return startOfWeek(zoned, { weekStartsOn });
}

/**
 * Get start of month for a Date object in a timezone
 * Returns a Date object (not timestamp string)
 */
export function startOfMonthInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zoned = toZonedTime(date, timezone);
  return startOfMonth(zoned);
}

/**
 * Get start of year for a Date object in a timezone
 * Returns a Date object (not timestamp string)
 */
export function startOfYearInTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zoned = toZonedTime(date, timezone);
  return startOfYear(zoned);
}

/**
 * Add years to a Date object with timezone awareness
 * Returns a Date object
 */
export function addYearsToDate(
  date: Date,
  years: number,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const zoned = toZonedTime(date, timezone);
  return addYears(zoned, years);
}

// Aliases for backward compatibility (Date-based versions)
export const startOfDay_tz = startOfDayInTimezone;
export const endOfDay_tz = endOfDayInTimezone;
export const startOfWeek_tz = startOfWeekInTimezone;
export const startOfMonth_tz = startOfMonthInTimezone;
export const startOfYear_tz = startOfYearInTimezone;
export const addYears_tz = addYearsToDate;

/**
 * Convert a date string (YYYY-MM-DD) to a timestamp at start of day in the given timezone
 * Useful for converting form date inputs to timestamps for storage
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timezone - Timezone to interpret the date in
 * @returns ISO timestamp string at start of day in UTC
 */
export function toStartOfDayTimestamp(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const date = parseISO(dateStr);
  const zonedDate = toZonedTime(date, timezone);
  const startOfDayZoned = startOfDay(zonedDate);
  return fromZonedTime(startOfDayZoned, timezone).toISOString();
}
