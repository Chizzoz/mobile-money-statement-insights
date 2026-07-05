import type {
  Category,
  Insight,
  StatementMetadata,
  Transaction,
} from "@/lib/types/transaction";
import { SPENDING_CATEGORIES } from "@/lib/types/transaction";
import { format } from "date-fns";

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function generateInsights(
  metadata: StatementMetadata,
  transactions: Transaction[],
  categoryTotals: Record<Category, number>,
): Insight[] {
  const insights: Insight[] = [];

  const totalDebitOutflow = SPENDING_CATEGORIES.reduce(
    (sum, cat) => sum + categoryTotals[cat],
    0,
  );

  const loanTotal = categoryTotals["Loan Repayments"];
  const loanRatio = totalDebitOutflow > 0 ? loanTotal / totalDebitOutflow : 0;

  if (loanRatio > 0.4) {
    insights.push({
      type: "debt_reduction",
      title: "High Loan Repayment Load",
      message: `Your loan repayments account for ${(loanRatio * 100).toFixed(0)}% of total spending. Consider consolidating multiple small loans into one lower-interest loan to reduce costs.`,
      severity: loanRatio > 0.5 ? "critical" : "warning",
      metric: loanRatio * 100,
    });
  }

  const agentCount = transactions.filter(
    (t) => t.category === "Agent Cash-Out",
  ).length;

  if (agentCount > 20) {
    insights.push({
      type: "fee_optimization",
      title: "Frequent Agent Cash-Outs",
      message: `You made ${agentCount} agent cash-out transactions this period. Consider reducing withdrawal frequency or using bank transfers to save on fees.`,
      severity: agentCount > 30 ? "warning" : "info",
      metric: agentCount,
    });
  }

  const savingsRatio =
    metadata.totalCredit > 0
      ? metadata.closingBalance / metadata.totalCredit
      : 0;

  if (savingsRatio < 0.1 && metadata.totalCredit > 0) {
    insights.push({
      type: "build_savings",
      title: "Low Savings Buffer",
      message: `Your closing balance is only ${(savingsRatio * 100).toFixed(1)}% of total income. Consider transferring 10% of your monthly income into a savings account to build an emergency fund.`,
      severity: savingsRatio < 0.05 ? "critical" : "warning",
      metric: savingsRatio * 100,
    });
  }

  const merchantRatio =
    totalDebitOutflow > 0
      ? categoryTotals["Merchant Spending"] / totalDebitOutflow
      : 0;

  if (merchantRatio > 0.3) {
    insights.push({
      type: "reduce_spending",
      title: "High Merchant Spending",
      message: `Your merchant spending is ${(merchantRatio * 100).toFixed(0)}% of total outflows. Consider reviewing high-frequency purchases for optimisation.`,
      severity: "warning",
      metric: merchantRatio * 100,
    });
  }

  const dailyNet = new Map<string, number>();
  for (const txn of transactions) {
    const key = format(txn.date, "yyyy-MM-dd");
    const delta = txn.type === "Credit" ? txn.amount : -txn.amount;
    dailyNet.set(key, (dailyNet.get(key) ?? 0) + delta);
  }

  const netValues = Array.from(dailyNet.values());
  const meanNet =
    netValues.length > 0
      ? netValues.reduce((a, b) => a + b, 0) / netValues.length
      : 0;
  const volatility =
    meanNet !== 0 ? stdDev(netValues) / Math.abs(meanNet) : 0;

  if (volatility > 0.5 && netValues.length >= 3) {
    insights.push({
      type: "cash_flow",
      title: "Volatile Cash Flow",
      message: `Your daily income and expenses vary significantly (${(volatility * 100).toFixed(0)}% volatility). Consider creating a budget to smooth cash flow.`,
      severity: volatility > 1 ? "warning" : "info",
      metric: volatility * 100,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "build_savings",
      title: "Healthy Spending Pattern",
      message:
        "Your spending patterns look balanced this period. Keep tracking your transactions regularly to maintain good financial habits.",
      severity: "info",
    });
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return insights
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 5);
}
