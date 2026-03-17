"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";

type BudgetStatus = "safe" | "close" | "low" | "over";

const STATUS_CONFIG = {
  safe: {
    ringColor: "stroke-emerald-500",
    ringBg: "stroke-emerald-100",
    textColor: "text-emerald-600",
  },
  close: {
    ringColor: "stroke-amber-500",
    ringBg: "stroke-amber-100",
    textColor: "text-amber-600",
  },
  low: {
    ringColor: "stroke-orange-500",
    ringBg: "stroke-orange-100",
    textColor: "text-orange-600",
  },
  over: {
    ringColor: "stroke-rose-500",
    ringBg: "stroke-rose-200",
    textColor: "text-rose-600",
  },
};

interface CircularProgressProps {
  percent: number;
  status: BudgetStatus;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  percent,
  status,
  size = 140,
  strokeWidth = 8,
}: CircularProgressProps) {
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
