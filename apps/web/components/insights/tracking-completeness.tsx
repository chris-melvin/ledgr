"use client";

import type { TrackingCompleteness } from "@/lib/insights/types";

interface TrackingCompletenessProps {
  data: TrackingCompleteness;
}

export function TrackingCompletenessCard({ data }: TrackingCompletenessProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.percentage / 100) * circumference;

  const color =
    data.percentage >= 80
      ? "#1A9E9E"
      : data.percentage >= 50
        ? "#D4A843"
        : "#E87356";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Tracking Completeness
        </h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#f5f5f5"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-neutral-900 tabular-nums">
                {data.percentage}%
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <p className="text-sm text-neutral-700">
              <span className="font-semibold tabular-nums">{data.trackedDays}</span> of{" "}
              <span className="tabular-nums">{data.totalDays}</span> days tracked
            </p>
            {data.missedDates.length > 0 && data.missedDates.length <= 5 && (
              <div className="mt-1.5">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Missed
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.missedDates.slice(0, 5).map((date) => {
                    const d = new Date(date + "T12:00:00");
                    const label = d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    return (
                      <span
                        key={date}
                        className="text-[10px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {data.missedDates.length > 5 && (
              <p className="text-xs text-neutral-400 mt-1">
                {data.missedDates.length} days without expenses
              </p>
            )}
            {data.missedDates.length === 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                Perfect tracking!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
