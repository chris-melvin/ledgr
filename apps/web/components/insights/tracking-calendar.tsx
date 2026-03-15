"use client";

import type { TrackingCalendarDay } from "@/lib/insights/types";

interface TrackingCalendarProps {
  data: TrackingCalendarDay[];
}

const LEVEL_COLORS = [
  "bg-neutral-100", // 0 - no activity
  "bg-teal-200",    // 1
  "bg-teal-300",    // 2
  "bg-teal-500",    // 3
  "bg-teal-700",    // 4
];

export function TrackingCalendar({ data }: TrackingCalendarProps) {
  if (data.length === 0) return null;

  // Arrange into 7-row grid (Sun-Sat rows, columns = weeks)
  const firstDate = new Date(data[0]!.date + "T12:00:00");
  const firstDayOfWeek = firstDate.getDay(); // 0=Sun

  // Pad the beginning with nulls so column 0 starts on correct weekday
  const padded: (TrackingCalendarDay | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...data,
  ];

  const numCols = Math.ceil(padded.length / 7);
  const grid: (TrackingCalendarDay | null)[][] = Array.from({ length: 7 }, () => []);
  for (let i = 0; i < padded.length; i++) {
    const row = i % 7;
    grid[row]!.push(padded[i] ?? null);
  }

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Tracking Consistency
        </h3>
        <p className="text-[10px] text-neutral-400 mt-0.5">Last 13 weeks</p>
      </div>
      <div className="p-4">
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="w-3 h-3 flex items-center justify-center text-[8px] text-neutral-400"
              >
                {i % 2 === 1 ? label : ""}
              </div>
            ))}
          </div>
          {/* Grid columns */}
          {Array.from({ length: numCols }, (_, col) => (
            <div key={col} className="flex flex-col gap-[3px]">
              {grid.map((row, rowIdx) => {
                const cell = row[col];
                if (!cell) {
                  return (
                    <div key={rowIdx} className="w-3 h-3 rounded-sm" />
                  );
                }
                return (
                  <div
                    key={rowIdx}
                    className={`w-3 h-3 rounded-sm ${LEVEL_COLORS[cell.level]} transition-colors`}
                    title={`${cell.date}: ${cell.count} expense${cell.count !== 1 ? "s" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[9px] text-neutral-400 mr-1">Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${color}`} />
          ))}
          <span className="text-[9px] text-neutral-400 ml-1">More</span>
        </div>
      </div>
    </div>
  );
}
