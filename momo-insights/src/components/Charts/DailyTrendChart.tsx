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
import { getChartTooltipStyle, useTheme } from "@/components/Theme/ThemeProvider";
import type { DailyTrendPoint } from "@/lib/types/transaction";
import { formatCurrency } from "@/utils/formatters";
import { format, parseISO } from "date-fns";

interface DailyTrendChartProps {
  data: DailyTrendPoint[];
  currency: string;
}

export function DailyTrendChart({ data, currency }: DailyTrendChartProps) {
  const { theme } = useTheme();

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

  const gridColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const tickColor = theme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fill: tickColor, fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: tickColor, fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          labelFormatter={(label) => String(label)}
          contentStyle={getChartTooltipStyle(theme === "dark")}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="credit"
          name="Income"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="debit"
          name="Expenses"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
