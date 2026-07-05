"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyTrendPoint } from "@/lib/types/transaction";
import { formatCurrency } from "@/utils/formatters";
import { format, parseISO } from "date-fns";

interface DailyTrendChartProps {
  data: DailyTrendPoint[];
  currency: string;
}

export function DailyTrendChart({ data, currency }: DailyTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No trend data available
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "dd MMM"),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            background: "hsl(222 47% 11%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="credit"
          name="Income"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="debit"
          name="Expenses"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
