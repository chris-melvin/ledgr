"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { TimeOfDayBucket } from "@/lib/insights/types";

interface TimeOfDayChartProps {
  data: TimeOfDayBucket[];
}

const BUCKET_COLORS = ["#D4A843", "#1A9E9E", "#E87356", "#4A90D9"];

export function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  const maxCount = Math.max(...data.map((b) => b.count), 1);

  if (data.every((b) => b.count === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">
            Time of Day
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-400">No expenses to analyze</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Time of Day
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {data.map((bucket, i) => (
          <div key={bucket.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-neutral-700">{bucket.label}</span>
                <span className="text-[10px] text-neutral-400">
                  {bucket.range}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-neutral-500 tabular-nums">
                  {bucket.count} exp
                </span>
                <span className="text-sm font-medium text-neutral-800 tabular-nums">
                  {formatCurrency(bucket.total, CURRENCY)}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(bucket.count / maxCount) * 100}%`,
                  backgroundColor: BUCKET_COLORS[i],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
