"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getChartTooltipStyle, useTheme } from "@/components/Theme/ThemeProvider";
import type { Category } from "@/lib/types/transaction";
import { CATEGORY_COLORS, SPENDING_CATEGORIES } from "@/lib/types/transaction";
import { formatCurrency } from "@/utils/formatters";

interface CategoryBarChartProps {
  categoryTotals: Record<Category, number>;
  currency: string;
  selectedCategory: Category | null;
  onCategoryClick: (category: Category | null) => void;
}

export function CategoryBarChart({
  categoryTotals,
  currency,
  selectedCategory,
  onCategoryClick,
}: CategoryBarChartProps) {
  const { theme } = useTheme();
  const data = SPENDING_CATEGORIES.map((cat) => ({
    name: cat.replace(" / ", "\n"),
    fullName: cat,
    amount: categoryTotals[cat],
  })).filter((d) => d.amount > 0);

  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No category data available
      </p>
    );
  }

  const gridColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const tickColor = theme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: tickColor, fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fill: tickColor, fontSize: 10 }}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={getChartTooltipStyle(theme === "dark")}
        />
        <Bar
          dataKey="amount"
          radius={[0, 4, 4, 0]}
          style={{ cursor: "pointer" }}
          onClick={(barData) => {
            const payload = barData as unknown as { fullName?: Category };
            if (payload.fullName) {
              onCategoryClick(
                selectedCategory === payload.fullName ? null : payload.fullName,
              );
            }
          }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.fullName}
              fill={CATEGORY_COLORS[entry.fullName]}
              opacity={
                selectedCategory && selectedCategory !== entry.fullName ? 0.35 : 1
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
