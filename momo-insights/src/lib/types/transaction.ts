export type TransactionType = "Credit" | "Debit";

export type Category =
  | "Loan Repayments"
  | "Agent Cash-Out"
  | "Personal Transfers"
  | "Merchant Spending"
  | "Airtime / Bills"
  | "Incoming Receipts"
  | "Other";

export type Provider = "airtel" | "generic" | "unknown";

export interface StatementMetadata {
  customerName: string;
  mobileNumber: string;
  email?: string;
  statementPeriod: { from: Date; to: Date };
  requestDate?: Date;
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
  currency: string;
  provider: Provider;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  status: string;
  amount: number;
  type: TransactionType;
  balance: number;
  category: Category;
  dayOfWeek: number;
  hour: number;
}

export interface DailyTrendPoint {
  date: string;
  credit: number;
  debit: number;
}

export interface HeatmapPoint {
  day: number;
  hour: number;
  count: number;
}

export type InsightType =
  | "debt_reduction"
  | "fee_optimization"
  | "build_savings"
  | "reduce_spending"
  | "cash_flow";

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  type: InsightType;
  title: string;
  message: string;
  severity: InsightSeverity;
  metric?: number;
}

export interface AnalysisResult {
  metadata: StatementMetadata;
  transactions: Transaction[];
  categoryTotals: Record<Category, number>;
  dailyTrend: DailyTrendPoint[];
  heatmapData: HeatmapPoint[];
  insights: Insight[];
  warnings: string[];
}

export interface ParseResult {
  metadata: StatementMetadata;
  transactions: Omit<Transaction, "category" | "dayOfWeek" | "hour">[];
  warnings: string[];
}

export const SPENDING_CATEGORIES: Category[] = [
  "Loan Repayments",
  "Agent Cash-Out",
  "Personal Transfers",
  "Merchant Spending",
  "Airtime / Bills",
  "Other",
];

export const ALL_CATEGORIES: Category[] = [
  ...SPENDING_CATEGORIES,
  "Incoming Receipts",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  "Loan Repayments": "#ef4444",
  "Agent Cash-Out": "#f97316",
  "Personal Transfers": "#8b5cf6",
  "Merchant Spending": "#3b82f6",
  "Airtime / Bills": "#06b6d4",
  "Incoming Receipts": "#22c55e",
  Other: "#6b7280",
};
