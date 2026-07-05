import type {
  AnalysisResult,
  Category,
  DailyTrendPoint,
  HeatmapPoint,
  ParseResult,
  Transaction,
} from "@/lib/types/transaction";
import { ALL_CATEGORIES } from "@/lib/types/transaction";
import { categorizeTransactions } from "@/lib/analyzers/categorizer";
import { generateInsights } from "@/lib/analyzers/insights";
import { format } from "date-fns";

function initCategoryTotals(): Record<Category, number> {
  return ALL_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = 0;
      return acc;
    },
    {} as Record<Category, number>,
  );
}

function buildDailyTrend(transactions: Transaction[]): DailyTrendPoint[] {
  const map = new Map<string, { credit: number; debit: number }>();

  for (const txn of transactions) {
    const key = format(txn.date, "yyyy-MM-dd");
    const entry = map.get(key) ?? { credit: 0, debit: 0 };
    if (txn.type === "Credit") {
      entry.credit += txn.amount;
    } else {
      entry.debit += txn.amount;
    }
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));
}

function buildHeatmap(transactions: Transaction[]): HeatmapPoint[] {
  const map = new Map<string, number>();

  for (const txn of transactions) {
    const key = `${txn.dayOfWeek}-${txn.hour}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const points: HeatmapPoint[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = map.get(`${day}-${hour}`) ?? 0;
      if (count > 0) {
        points.push({ day, hour, count });
      }
    }
  }

  return points;
}

function enrichTransactions(
  transactions: Omit<Transaction, "category" | "dayOfWeek" | "hour">[],
): Transaction[] {
  const withMeta = transactions.map((txn) => ({
    ...txn,
    dayOfWeek: txn.date.getDay(),
    hour: txn.date.getHours(),
  }));

  return categorizeTransactions(withMeta);
}

export function analyzeStatement(parseResult: ParseResult): AnalysisResult {
  const transactions = enrichTransactions(parseResult.transactions);
  const categoryTotals = initCategoryTotals();

  for (const txn of transactions) {
    categoryTotals[txn.category] += txn.amount;
  }

  const dailyTrend = buildDailyTrend(transactions);
  const heatmapData = buildHeatmap(transactions);
  const insights = generateInsights(parseResult.metadata, transactions, categoryTotals);

  return {
    metadata: parseResult.metadata,
    transactions,
    categoryTotals,
    dailyTrend,
    heatmapData,
    insights,
    warnings: parseResult.warnings,
  };
}
