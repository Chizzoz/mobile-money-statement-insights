import type { ParseResult, Provider, StatementMetadata, Transaction } from "@/lib/types/transaction";

export type RawTransaction = Omit<Transaction, "category" | "dayOfWeek" | "hour">;

/** Generates a stable, unique-enough synthetic ID for statement formats that don't expose a real transaction reference. */
export function makeSyntheticId(prefix: string, index: number, date: Date): string {
  const stamp = date.getTime() > 0 ? date.toISOString().slice(0, 10).replace(/-/g, "") : "00000000";
  return `${prefix}-${stamp}-${String(index + 1).padStart(4, "0")}`;
}

/** Fills in totals/balances that a statement format doesn't explicitly provide, using the parsed transactions. */
export function deriveMissingMetadata(
  metadata: StatementMetadata,
  transactions: RawTransaction[],
): StatementMetadata {
  if (transactions.length === 0) return metadata;

  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  const computedCredit = transactions
    .filter((t) => t.type === "Credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const computedDebit = transactions
    .filter((t) => t.type === "Debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const derivedOpeningBalance =
    oldest.type === "Debit" ? oldest.balance + oldest.amount : oldest.balance - oldest.amount;

  // Formats that don't expose an explicit statement period use the epoch as a
  // sentinel "unknown" value so we can safely fall back to the transaction range.
  const periodUnknown = metadata.statementPeriod.from.getTime() === 0;

  return {
    ...metadata,
    totalCredit: metadata.totalCredit > 0 ? metadata.totalCredit : computedCredit,
    totalDebit: metadata.totalDebit > 0 ? metadata.totalDebit : computedDebit,
    openingBalance: metadata.openingBalance !== 0 ? metadata.openingBalance : derivedOpeningBalance,
    closingBalance: metadata.closingBalance !== 0 ? metadata.closingBalance : newest.balance,
    statementPeriod: periodUnknown
      ? { from: oldest.date, to: newest.date }
      : metadata.statementPeriod,
  };
}

export function finalizeParseResult(
  metadata: StatementMetadata,
  transactions: RawTransaction[],
  provider: Provider,
): ParseResult {
  const warnings: string[] = [];

  if (provider === "unknown" && transactions.length === 0) {
    warnings.push(
      "Could not detect a known statement format. Try pasting the raw text from your PDF.",
    );
  }

  if (transactions.length === 0) {
    warnings.push("No transactions were found in the uploaded statement.");
  }

  const parsedDebitTotal = transactions
    .filter((t) => t.type === "Debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const parsedCreditTotal = transactions
    .filter((t) => t.type === "Credit")
    .reduce((sum, t) => sum + t.amount, 0);

  if (metadata.totalDebit > 0 && Math.abs(parsedDebitTotal - metadata.totalDebit) > 1) {
    warnings.push(
      `Parsed debit total (${parsedDebitTotal.toFixed(2)}) differs from statement total (${metadata.totalDebit.toFixed(2)}). Some transactions may be missing.`,
    );
  }

  if (metadata.totalCredit > 0 && Math.abs(parsedCreditTotal - metadata.totalCredit) > 1) {
    warnings.push(
      `Parsed credit total (${parsedCreditTotal.toFixed(2)}) differs from statement total (${metadata.totalCredit.toFixed(2)}). Some transactions may be missing.`,
    );
  }

  return { metadata, transactions, warnings };
}
