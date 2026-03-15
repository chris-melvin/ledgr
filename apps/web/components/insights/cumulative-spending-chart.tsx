"use client";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CumulativeSpendingPoint } from "@/lib/insights/types";

interface CumulativeSpendingChartProps {
  data: CumulativeSpendingPoint[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CumulativeSpendingPoint }>;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  const d = new Date(point.date + "T12:00:00");
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const value = point.actual ?? point.projected ?? 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-900 tabular-nums">
        {formatCurrency(value, CURRENCY)}
      </p>
      {point.actual === null && (
        <p className="text-[10px] text-neutral-400">projected</p>
      )}
    </div>
  );
}

export function CumulativeSpendingChart({ data }: CumulativeSpendingChartProps) {
  if (data.length === 0) return null;

  const projectedTotal = data[data.length - 1]?.projected;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">
          Cumulative Spending
        </h3>
        {projectedTotal !== null && projectedTotal !== undefined && (
          <span className="text-[10px] text-neutral-400">
            Projected: {formatCurrency(projectedTotal, CURRENCY)}
          </span>
        )}
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
              interval={6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#1A9E9E"
              fill="#1A9E9E"
              fillOpacity={0.1}
              strokeWidth={2}
              connectNulls={false}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#a3a3a3"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              connectNulls
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
