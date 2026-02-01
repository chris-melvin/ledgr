import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date to YYYY-MM-DD string
 *
 * Note: For timezone-aware operations, prefer using dateUtils.toDateString()
 * from lib/utils/date.ts instead.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Check if a date is today (local timezone)
 *
 * Note: For timezone-aware operations, prefer using dateUtils.isToday()
 * from lib/utils/date.ts instead.
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatKey(date) === formatKey(today);
}

export function formatCurrency(amount: number, currency: string = "₱"): string {
  return `${currency}${Math.abs(amount).toLocaleString()}`;
}
