import type { Category, Transaction, TransactionType } from "@/lib/types/transaction";

const LOAN_KEYWORDS = [
  "JUMO",
  "EMERALD",
  "PREMIER CREDIT",
  "KONZA",
  "MICRO FINANCE",
  "SPECTRUM CREDIT",
];

const AGENT_KEYWORDS = ["FIKILIZA ZM"];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const upper = text.toUpperCase();
  return keywords.some((kw) => upper.includes(kw.toUpperCase()));
}

function isAirtimeBill(description: string, amount: number, type: TransactionType): boolean {
  if (type !== "Debit") return false;
  if (/Airtel Networks/i.test(description)) return true;
  return amount <= 100 && amount > 0 && amount % 10 === 0;
}

export function categorizeTransaction(
  description: string,
  type: TransactionType,
  amount: number,
): Category {
  if (type === "Credit") {
    return "Incoming Receipts";
  }

  const desc = description.toUpperCase();

  if (matchesKeywords(desc, LOAN_KEYWORDS)) {
    return "Loan Repayments";
  }

  if (
    matchesKeywords(desc, AGENT_KEYWORDS) ||
    desc.includes("WITHDRAWN AT")
  ) {
    return "Agent Cash-Out";
  }

  if (isAirtimeBill(description, amount, type)) {
    return "Airtime / Bills";
  }

  if (desc.includes("PAID TO")) {
    return "Merchant Spending";
  }

  if (desc.includes("SENT MONEY TO")) {
    return "Personal Transfers";
  }

  return "Other";
}

export function categorizeTransactions(
  transactions: Omit<Transaction, "category">[],
): Transaction[] {
  return transactions.map((txn) => ({
    ...txn,
    category: categorizeTransaction(txn.description, txn.type, txn.amount),
  }));
}
