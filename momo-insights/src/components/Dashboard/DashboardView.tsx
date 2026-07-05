"use client";

import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { ChartCard } from "@/components/Dashboard/DashboardGrid";
import { TransactionTable } from "@/components/Dashboard/TransactionTable";
import { CategoryBarChart } from "@/components/Charts/CategoryBarChart";
import { DailyTrendChart } from "@/components/Charts/DailyTrendChart";
import { ExpenditurePieChart } from "@/components/Charts/ExpenditurePieChart";
import { TransactionHeatmap } from "@/components/Charts/TransactionHeatmap";
import { ExportButtons } from "@/components/Export/ExportButtons";
import { InsightCards } from "@/components/Insights/InsightCards";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/types/transaction";
import { useStatementStore } from "@/store/useStatementStore";
import { AlertTriangle } from "lucide-react";

interface DashboardViewProps {
  analysis: AnalysisResult;
}

export function DashboardView({ analysis }: DashboardViewProps) {
  const { selectedCategory, setSelectedCategory, reset } = useStatementStore();
  const { metadata, categoryTotals, dailyTrend, heatmapData, insights, warnings, transactions } =
    analysis;

  return (
    <div className="space-y-8">
      <DashboardHeader metadata={metadata} />

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {selectedCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          <Badge variant="secondary">{selectedCategory}</Badge>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Expenditure Breakdown">
          <ExpenditurePieChart
            categoryTotals={categoryTotals}
            currency={metadata.currency}
            selectedCategory={selectedCategory}
            onCategoryClick={setSelectedCategory}
          />
        </ChartCard>

        <ChartCard title="Daily Income vs Expenses">
          <DailyTrendChart data={dailyTrend} currency={metadata.currency} />
        </ChartCard>

        <ChartCard title="Category Comparison">
          <CategoryBarChart
            categoryTotals={categoryTotals}
            currency={metadata.currency}
            selectedCategory={selectedCategory}
            onCategoryClick={setSelectedCategory}
          />
        </ChartCard>

        <ChartCard title="Transaction Activity Heatmap">
          <TransactionHeatmap data={heatmapData} />
        </ChartCard>
      </div>

      <InsightCards insights={insights} />

      <ChartCard title="All Transactions">
        <TransactionTable
          transactions={transactions}
          currency={metadata.currency}
          selectedCategory={selectedCategory}
          onClearFilter={() => setSelectedCategory(null)}
        />
      </ChartCard>

      <ExportButtons analysis={analysis} onReset={reset} />
    </div>
  );
}
