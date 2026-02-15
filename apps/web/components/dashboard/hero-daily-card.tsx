"use client";

import { useMemo, lazy, Suspense } from "react";
import { Sparkles, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useShaderConfig } from "@/components/shaders/use-shader-config";
import { formatInTimezone } from "@/lib/utils/date";

const MeshGradient = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.MeshGradient }))
);

interface ExpenseItem {
  label: string;
  amount: number;
}

interface HeroDailyCardProps {
  remaining: number;
  limit?: number;
  spent: number;
  expenses?: ExpenseItem[];
  date?: Date;
  timezone?: string;
  isBudgetMode?: boolean;
}

type BudgetStatus = "safe" | "close" | "low" | "over";

function getBudgetStatus(remaining: number, limit: number): BudgetStatus {
  const percentRemaining = (remaining / limit) * 100;
  if (remaining < 0) return "over";
  if (percentRemaining < 20) return "low";
  if (percentRemaining < 50) return "close";
  return "safe";
}

const STATUS_SHADER_COLORS: Record<BudgetStatus, string[]> = {
  safe: ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399"],
  close: ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24"],
  low: ["#ffedd5", "#fed7aa", "#fdba74", "#fb923c"],
  over: ["#ffe4e6", "#fecdd3", "#fda4af", "#fb7185"],
};

const NEUTRAL_SHADER_COLORS = ["#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e"];
const NEUTRAL_CSS_GRADIENT = "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 50%, #e7e5e4 100%)";

const STATUS_CSS_GRADIENTS: Record<BudgetStatus, string> = {
  safe: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
  close: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)",
  low: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
  over: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)",
};

const STATUS_CONFIG = {
  safe: {
    message: "You're on track. Keep it up!",
    icon: Sparkles,
    ringColor: "stroke-emerald-500",
    ringBg: "stroke-emerald-100",
    textColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    barColor: "bg-emerald-400",
    label: "On Track",
  },
  close: {
    message: "Getting close. Spend mindfully.",
    icon: Zap,
    ringColor: "stroke-amber-500",
    ringBg: "stroke-amber-100",
    textColor: "text-amber-600",
    accentBg: "bg-amber-50",
    iconColor: "text-amber-500",
    barColor: "bg-amber-400",
    label: "Watch It",
  },
  low: {
    message: "Almost at limit. Consider pausing.",
    icon: TrendingDown,
    ringColor: "stroke-orange-500",
    ringBg: "stroke-orange-100",
    textColor: "text-orange-600",
    accentBg: "bg-orange-50",
    iconColor: "text-orange-500",
    barColor: "bg-orange-400",
    label: "Low",
  },
  over: {
    message: "Over budget. Tomorrow is a fresh start.",
    icon: AlertCircle,
    ringColor: "stroke-rose-500",
    ringBg: "stroke-rose-200",
    textColor: "text-rose-600",
    accentBg: "bg-rose-50",
    iconColor: "text-rose-500",
    barColor: "bg-rose-400",
    label: "Over",
  },
};

function CircularProgress({
  percent,
  status,
  size = 140,
  strokeWidth = 8,
}: {
  percent: number;
  status: BudgetStatus;
  size?: number;
  strokeWidth?: number;
}) {
  const config = STATUS_CONFIG[status];
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className={cn("transition-all duration-700", config.ringBg)}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-1000 ease-out", config.ringColor)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", config.textColor)}>
          <AnimatedNumber value={Math.round(clampedPercent)} duration={800} />%
        </span>
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">left</span>
      </div>
    </div>
  );
}

export function HeroDailyCard({
  remaining,
  limit = 300,
  spent,
  expenses = [],
  date,
  timezone,
  isBudgetMode = false,
}: HeroDailyCardProps) {
  const status = useMemo(() => getBudgetStatus(remaining, limit), [remaining, limit]);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const percentRemaining = Math.max(0, (remaining / limit) * 100);
  const { enabled, speed } = useShaderConfig();

  const now = new Date();
  const displayDate = date ?? now;
  const isDateToday = isSameDay(displayDate, now);
  const isYesterday = isSameDay(displayDate, subDays(now, 1));

  const dayLabel = isDateToday ? "Today" : isYesterday ? "Yesterday" : (
    timezone
      ? formatInTimezone(displayDate, timezone, "EEEE")
      : displayDate.toLocaleDateString("en-US", { weekday: "long" })
  );

  const dateDisplay = timezone
    ? formatInTimezone(displayDate, timezone, "EEEE, MMMM d")
    : displayDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

  const emptyText = isDateToday
    ? "No expenses yet today. Start fresh!"
    : isYesterday
      ? "No expenses recorded"
      : "No expenses yet";

  const expensesLabel = isDateToday ? "Today\u2019s Expenses" : "Expenses";

  return (
    <div
      className={cn(
        "relative w-full max-w-md mx-auto overflow-hidden",
        "rounded-3xl border border-stone-200/60",
        "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
      )}
    >
      {/* MeshGradient background (replaces CSS gradient + SVG noise) */}
      <div className="absolute inset-0">
        {enabled ? (
          <Suspense
            fallback={
              <div className="w-full h-full" style={{ background: isBudgetMode ? STATUS_CSS_GRADIENTS[status] : NEUTRAL_CSS_GRADIENT }} />
            }
          >
            <MeshGradient
              colors={isBudgetMode ? STATUS_SHADER_COLORS[status] : NEUTRAL_SHADER_COLORS}
              speed={speed}
              distortion={0.25}
              swirl={0.1}
              grainOverlay={0.02}
              width="100%"
              height="100%"
            />
          </Suspense>
        ) : (
          <div className="w-full h-full" style={{ background: isBudgetMode ? STATUS_CSS_GRADIENTS[status] : NEUTRAL_CSS_GRADIENT }} />
        )}
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium mb-1">
              {dayLabel}
            </p>
            <h2 className="text-sm sm:text-base text-neutral-600 font-medium">{dateDisplay}</h2>
          </div>
          {isBudgetMode && (
            <div
              className={cn(
                "animate-in fade-in zoom-in duration-500 delay-100",
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                config.accentBg
              )}
            >
              <StatusIcon className={cn("w-3.5 h-3.5", config.iconColor)} />
              <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
            </div>
          )}
        </div>

        {isBudgetMode ? (
          <>
            {/* Budget mode: circular progress + remaining amount */}
            <div className="flex items-center gap-6 sm:gap-8 mb-6">
              <div className="animate-in fade-in zoom-in duration-700 delay-200 flex-shrink-0">
                <CircularProgress percent={percentRemaining} status={status} />
              </div>

              <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-300 flex-1 min-w-0">
                <div className="mb-1">
                  <span
                    className={cn(
                      "text-4xl sm:text-5xl font-bold tracking-tight",
                      status === "over" ? "text-rose-600" : "text-neutral-900"
                    )}
                  >
                    {status === "over" && "-"}
                    {CURRENCY}
                    <AnimatedNumber value={Math.abs(remaining)} duration={600} />
                  </span>
                </div>
                <p className="text-sm text-neutral-400">
                  {status === "over" ? (
                    <>
                      over your {CURRENCY}
                      {limit.toLocaleString()} budget
                    </>
                  ) : (
                    <>
                      remaining of {CURRENCY}
                      {limit.toLocaleString()}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Insight message */}
            <div
              className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400",
                "flex items-center gap-2 px-4 py-3 rounded-2xl mb-4",
                "bg-white/60 border border-stone-100"
              )}
            >
              <div className={cn("w-1 h-8 rounded-full", config.barColor)} />
              <p className="text-sm text-neutral-600 font-medium">{config.message}</p>
            </div>
          </>
        ) : (
          /* Tracking mode: just total spent */
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 mb-6">
            <div className="mb-1">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
                {CURRENCY}
                <AnimatedNumber value={spent} duration={600} />
              </span>
            </div>
            <p className="text-sm text-neutral-400">spent {dayLabel.toLowerCase()}</p>
          </div>
        )}

        {/* Today's expenses */}
        {expenses.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.15em] mb-2">
              {expensesLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {expenses.map((expense, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "bg-white/80 border border-stone-100",
                    "text-xs text-neutral-600 font-medium",
                    "animate-in fade-in zoom-in duration-300"
                  )}
                  style={{ animationDelay: `${600 + i * 50}ms` }}
                >
                  {expense.label}
                  <span className="text-neutral-400 tabular-nums">
                    {CURRENCY}
                    {expense.amount}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {expenses.length === 0 && spent === 0 && (
          <div className="animate-in fade-in duration-500 delay-500 text-center py-2">
            <p className="text-xs text-neutral-400">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
