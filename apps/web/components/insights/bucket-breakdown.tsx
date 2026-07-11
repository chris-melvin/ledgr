"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { BucketTotal } from "@/lib/insights/types";

interface BucketBreakdownProps {
  data: BucketTotal[];
}

/**
 * Where money actually goes: Daily vs Bills vs Non-daily (spending-clarity).
 * Horizontal bars with direct labels — identity is never color-alone.
 */
export function BucketBreakdown({ data }: BucketBreakdownProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((b) => b.total));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">Where It Goes</h3>
      </div>
      <div className="p-4 space-y-3">
        {data.map((bucket) => (
          <div key={bucket.bucketId ?? bucket.slug}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: bucket.color }}
                  aria-hidden
                />
                <span className="text-xs font-medium text-neutral-700 truncate">
                  {bucket.name}
                </span>
                <span className="text-[10px] text-neutral-400">
                  · {bucket.count} {bucket.count === 1 ? "item" : "items"}
                </span>
              </div>
              <span className="text-xs font-semibold text-neutral-800 tabular-nums flex-shrink-0">
                {formatCurrency(bucket.total, CURRENCY)}
                <span className="text-neutral-400 font-normal ml-1">
                  {Math.round(bucket.percentage)}%
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${max > 0 ? Math.max(2, (bucket.total / max) * 100) : 0}%`,
                  backgroundColor: bucket.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
