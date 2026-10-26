"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "@/smc/lib/types/schema";

export function LineTrendChart({
  data,
  dataKey = "value",
  secondaryKey,
}: {
  data: TrendPoint[];
  dataKey?: string;
  secondaryKey?: string;
}) {
  return (
    <div className="h-72 min-h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="var(--chart-1)"
            strokeWidth={3}
            dot={false}
          />
          {secondaryKey ? (
            <Line
              type="monotone"
              dataKey={secondaryKey}
              stroke="var(--chart-5)"
              strokeWidth={2}
              dot={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

