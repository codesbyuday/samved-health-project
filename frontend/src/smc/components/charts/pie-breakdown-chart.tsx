"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#10b981", // Emerald (Active)
  "#f43f5e", // Rose (Inactive)
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
];

export function PieBreakdownChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const chartData = data && data.length > 0 ? data : [{ label: "None", value: 1 }];

  return (
    <div className="h-72 min-h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            outerRadius={85}
            innerRadius={50}
            paddingAngle={chartData.length > 1 ? 4 : 0}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
