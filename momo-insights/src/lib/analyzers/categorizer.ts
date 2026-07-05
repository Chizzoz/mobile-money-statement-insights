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

// Merchant names checked regardless of verb phrasing (e.g. "Paid to X" vs "Money Sent to X"),
// since different statement templates describe merchant payments differently.
const MERCHANT_KEYWORDS = [
  "ZAM CASH",
  "NFS SETTLEMENT",
  "ZESCO",
  "PAWA PAY",
  "SPAR",
  "PRIMENET",
  "FUTURE VENTURES",
  "SPARGRIS",
];

// Different statement templates order these words differently
// ("Sent Money to X" vs "Money Sent to X").
const PERSONAL_TRANSFER_PHRASES = ["SENT MONEY TO", "MONEY SENT TO"];

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
    desc.includes("WITHDRAWN AT") ||
    desc.includes("WITHDRAWN FROM")
  ) {
    return "Agent Cash-Out";
  }

  if (isAirtimeBill(description, amount, type)) {
    return "Airtime / Bills";
  }

  if (desc.includes("PAID TO") || matchesKeywords(desc, MERCHANT_KEYWORDS)) {
    return "Merchant Spending";
  }

  if (matchesKeywords(desc, PERSONAL_TRANSFER_PHRASES)) {
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
