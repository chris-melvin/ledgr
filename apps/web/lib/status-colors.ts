/**
 * Standardized status color system for ledgr
 *
 * Use these constants instead of hardcoding Tailwind color classes
 * to ensure consistent status indication across the app.
 */

export type StatusType = "safe" | "warning" | "danger" | "info" | "neutral";

export interface StatusColors {
  bg: string;
  bgSubtle: string;
  text: string;
  textMuted: string;
  border: string;
  ring: string;
  icon: string;
}

/**
 * Status color mappings using Tailwind classes
 * These map to the semantic colors defined in globals.css
 */
export const STATUS_COLORS: Record<StatusType, StatusColors> = {
  safe: {
    bg: "bg-emerald-500",
    bgSubtle: "bg-emerald-50",
    text: "text-emerald-600",
    textMuted: "text-emerald-500",
    border: "border-emerald-200",
    ring: "ring-emerald-500/20",
    icon: "text-emerald-500",
  },
  warning: {
    bg: "bg-amber-500",
    bgSubtle: "bg-amber-50",
    text: "text-amber-600",
    textMuted: "text-amber-500",
    border: "border-amber-200",
    ring: "ring-amber-500/20",
    icon: "text-amber-500",
  },
  danger: {
    bg: "bg-rose-500",
    bgSubtle: "bg-rose-50",
    text: "text-rose-600",
    textMuted: "text-rose-500",
    border: "border-rose-200",
    ring: "ring-rose-500/20",
    icon: "text-rose-500",
  },
  info: {
    bg: "bg-teal-500",
    bgSubtle: "bg-teal-50",
    text: "text-teal-600",
    textMuted: "text-teal-500",
    border: "border-teal-200",
    ring: "ring-teal-500/20",
    icon: "text-teal-500",
  },
  neutral: {
    bg: "bg-neutral-400",
    bgSubtle: "bg-neutral-50",
    text: "text-neutral-600",
    textMuted: "text-neutral-500",
    border: "border-neutral-200",
    ring: "ring-neutral-500/20",
    icon: "text-neutral-500",
  },
};

/**
 * Budget status types specific to daily spending
 */
export type BudgetStatus = "safe" | "close" | "low" | "over";

/**
 * Budget status color mappings
 * Used for hero daily card, calendar days, and spending indicators
 */
export const BUDGET_STATUS_COLORS: Record<BudgetStatus, StatusColors> = {
  safe: STATUS_COLORS.safe,
  close: {
    bg: "bg-amber-500",
    bgSubtle: "bg-amber-50",
    text: "text-amber-600",
    textMuted: "text-amber-500",
    border: "border-amber-200",
    ring: "ring-amber-500/20",
    icon: "text-amber-500",
  },
  low: {
    bg: "bg-orange-500",
    bgSubtle: "bg-orange-50",
    text: "text-orange-600",
    textMuted: "text-orange-500",
    border: "border-orange-200",
    ring: "ring-orange-500/20",
    icon: "text-orange-500",
  },
  over: STATUS_COLORS.danger,
};

/**
 * Get status based on percentage remaining
 */
export function getBudgetStatus(percentRemaining: number): BudgetStatus {
  if (percentRemaining <= 0) return "over";
  if (percentRemaining <= 20) return "low";
  if (percentRemaining <= 40) return "close";
  return "safe";
}

/**
 * Brand colors for consistent usage across the app
 */
export const BRAND_COLORS = {
  primary: {
    50: "#F0FAFA",
    100: "#CCEBEB",
    200: "#99D6D6",
    300: "#66C2C2",
    400: "#40B0B0",
    500: "#1A9E9E",
    600: "#148585",
    700: "#0F6B6B",
    800: "#0A5252",
    900: "#063C3C",
  },
  coral: {
    50: "#FEF5F2",
    100: "#FDE8E1",
    200: "#FAD0C3",
    300: "#F5B49F",
    400: "#EF9278",
    500: "#E87356",
    600: "#D45A3E",
    700: "#B44530",
    800: "#8F3626",
    900: "#6B291D",
  },
} as const;

/**
 * Chart color palette - teal complementary
 */
export const CHART_COLORS = [
  "#1A9E9E", // Primary teal
  "#E87356", // Coral
  "#D4A017", // Warm gold
  "#3B82F6", // Ocean blue
  "#22C55E", // Sage green
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F97316", // Orange
] as const;

/**
 * Bucket category colors for budget allocation
 */
export const BUCKET_COLORS = [
  { name: "Teal", value: "#1A9E9E", light: "#CCEBEB" },
  { name: "Coral", value: "#E87356", light: "#FDE8E1" },
  { name: "Gold", value: "#D4A017", light: "#FEF9C3" },
  { name: "Ocean", value: "#3B82F6", light: "#DBEAFE" },
  { name: "Sage", value: "#22C55E", light: "#DCFCE7" },
  { name: "Violet", value: "#8B5CF6", light: "#EDE9FE" },
  { name: "Rose", value: "#F43F5E", light: "#FFE4E6" },
  { name: "Amber", value: "#F59E0B", light: "#FEF3C7" },
  { name: "Slate", value: "#64748B", light: "#F1F5F9" },
  { name: "Emerald", value: "#059669", light: "#D1FAE5" },
] as const;
