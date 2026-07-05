"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getChartTooltipStyle, useTheme } from "@/components/Theme/ThemeProvider";
import type { Category } from "@/lib/types/transaction";
import { CATEGORY_COLORS, SPENDING_CATEGORIES } from "@/lib/types/transaction";
import { formatCurrency } from "@/utils/formatters";

interface ExpenditurePieChartProps {
  categoryTotals: Record<Category, number>;
  currency: string;
  selectedCategory: Category | null;
  onCategoryClick: (category: Category | null) => void;
}

export function ExpenditurePieChart({
  categoryTotals,
  currency,
  selectedCategory,
  onCategoryClick,
}: ExpenditurePieChartProps) {
  const { theme } = useTheme();
  const data = SPENDING_CATEGORIES.map((cat) => ({
    name: cat,
    value: categoryTotals[cat],
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No spending data to display
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          onClick={(_, index) => {
            const cat = data[index]?.name as Category;
            onCategoryClick(selectedCategory === cat ? null : cat);
          }}
          style={{ cursor: "pointer" }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name as Category]}
              opacity={
                selectedCategory && selectedCategory !== entry.name ? 0.35 : 1
              }
              stroke={selectedCategory === entry.name ? "currentColor" : "none"}
              strokeWidth={2}
              className="text-foreground"
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={getChartTooltipStyle(theme === "dark")}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
