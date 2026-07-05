import type { ParseResult, Provider, StatementMetadata } from "@/lib/types/transaction";
import {
  normalizeCurrency,
  parseAirtelBalanceDateTime,
  parseAirtelBalancePeriodDate,
  parseAirtelPeriodDate,
  parseAirtelTransactionDate,
  parseAmount,
} from "@/utils/formatters";

type RawTransaction = Omit<
  import("@/lib/types/transaction").Transaction,
  "category" | "dayOfWeek" | "hour"
>;

export type StatementFormat = "detailed" | "balance" | "unknown";

/**
 * Detects which known Airtel Money statement template the raw text came from.
 * "detailed" — the classic "AIRTEL MONEY STATEMENT" export (Transaction ID / Date / Description / Status / Amount / Credit-Debit / Balance columns).
 * "balance" — the "Balance statement for the period" export (Date & Time / Details / Credited / Debited / Balance columns).
 */
export function detectStatementFormat(text: string): StatementFormat {
  if (/Balance statement for the period/i.test(text)) return "balance";
  if (/AIRTEL MONEY STATEMENT/i.test(text)) return "detailed";
  if (/Transaction Successful/i.test(text) && /Credit|Debit/i.test(text)) return "detailed";
  return "unknown";
}

export function detectProvider(text: string): Provider {
  const format = detectStatementFormat(text);
  if (format === "detailed" || format === "balance") return "airtel";
  return "unknown";
}

/* ------------------------------------------------------------------ */
/* Detailed statement format ("AIRTEL MONEY STATEMENT")                */
/* ------------------------------------------------------------------ */

const TRANSACTION_ID_ONLY = /^[A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]+$/i;
const TRANSACTION_ID_INLINE =
  /^([A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]+)\s+(\d{2}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(?:AM|PM))\s+(.+)$/i;
const DATE_ONLY = /^\d{2}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(?:AM|PM)$/i;
const STATUS_LINE = /^Transaction Successful$/i;
const TYPE_LINE = /^(Credit|Debit)$/i;

const DETAILED_NOISE_PATTERNS = [
  /^-- \d+ of \d+ --$/,
  /^AIRTEL MONEY STATEMENT$/,
  /^www\.airtel\.co\.zm/,
  /^Disclaimer:/,
  /^For self-service Dial/,
  /^Transaction ID$/,
  /^Transaction Date$/,
  /^Description$/,
  /^Status$/,
  /^Transaction$/,
  /^Amount$/,
  /^Credit\/Debit$/,
  /^Balance$/,
  /^DETAILED STATEMENT$/,
  /^SUMMARY$/,
  /^\d+$/,
];

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter((line) => line.length > 0)
    .filter((line) => !DETAILED_NOISE_PATTERNS.some((pattern) => pattern.test(line)));
}

function extractDetailedMetadata(lines: string[], provider: Provider): StatementMetadata {
  const fullText = lines.join("\n");

  const getField = (label: string): string | undefined => {
    const idx = lines.findIndex((l) =>
      new RegExp(`^${label}:?$`, "i").test(l),
    );
    if (idx === -1) {
      const inline = fullText.match(new RegExp(`${label}:\\s*(.+)`, "i"));
      return inline?.[1]?.trim();
    }
    const valueLine = lines[idx + 1];
    if (!valueLine || /^[A-Za-z ]+:$/.test(valueLine)) return undefined;
    return valueLine.replace(/^(Zmk|ZMW|ZMK)\s*/i, "").trim();
  };

  const openingRaw = fullText.match(/Opening Balance:\s*(?:\n\s*)?(?:Zmk|ZMW|ZMK)?\s*([\d,]+\.?\d*)/i);
  const closingRaw = fullText.match(/Closing Balance:\s*(?:\n\s*)?(?:Zmk|ZMW|ZMK)?\s*([\d,]+\.?\d*)/i);
  const creditRaw = fullText.match(/Total Credit:\s*(?:\n\s*)?(?:Zmk|ZMW|ZMK)?\s*([\d,]+\.?\d*)/i);
  const debitRaw = fullText.match(/Total Debit:\s*(?:\n\s*)?(?:Zmk|ZMW|ZMK)?\s*([\d,]+\.?\d*)/i);

  const nameMatch = fullText.match(/Customer Name:\s*(?:\n\s*)?(.+)/i);
  const mobileMatch = fullText.match(/Mobile Number:\s*(?:\n\s*)?(\d+)/i);
  const emailMatch = fullText.match(/Email Address:\s*(?:\n\s*)?(\S+)/i);
  const periodMatch = fullText.match(
    /Statement Period:\s*(?:\n\s*)?(\d{2}-\w{3}-\d{2})\s*to\s*(\d{2}-\w{3}-\d{2})/i,
  );
  const requestMatch = fullText.match(/Request Date:\s*(?:\n\s*)?(.+)/i);

  const currency = normalizeCurrency(
    fullText.match(/(Zmk|ZMW|ZMK)/i)?.[1],
  );

  return {
    customerName: nameMatch?.[1]?.trim() ?? getField("Customer Name") ?? "Unknown",
    mobileNumber: mobileMatch?.[1]?.trim() ?? getField("Mobile Number") ?? "",
    email: emailMatch?.[1]?.trim(),
    statementPeriod: {
      from: periodMatch ? parseAirtelPeriodDate(periodMatch[1]) : new Date(),
      to: periodMatch ? parseAirtelPeriodDate(periodMatch[2]) : new Date(),
    },
    requestDate: requestMatch
      ? parseAirtelPeriodDate(requestMatch[1].trim().split("\n")[0])
      : undefined,
    openingBalance: openingRaw ? parseAmount(openingRaw[1]) : 0,
    closingBalance: closingRaw ? parseAmount(closingRaw[1]) : 0,
    totalCredit: creditRaw ? parseAmount(creditRaw[1]) : 0,
    totalDebit: debitRaw ? parseAmount(debitRaw[1]) : 0,
    currency,
    provider,
  };
}

function parseDetailedTransactions(lines: string[]): RawTransaction[] {
  const transactions: RawTransaction[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (TRANSACTION_ID_ONLY.test(line)) {
      const id = line;
      i++;
      if (i >= lines.length || !DATE_ONLY.test(lines[i])) continue;

      const dateStr = lines[i];
      i++;
      const descriptionParts: string[] = [];

      while (i < lines.length && !STATUS_LINE.test(lines[i])) {
        descriptionParts.push(lines[i]);
        i++;
      }

      if (i >= lines.length) break;
      i++; // skip "Transaction Successful"

      if (i + 2 >= lines.length) break;
      const amount = parseAmount(lines[i]);
      const type = lines[i + 1] as "Credit" | "Debit";
      const balance = parseAmount(lines[i + 2]);

      if (!TYPE_LINE.test(lines[i + 1])) {
        i++;
        continue;
      }

      transactions.push({
        id,
        date: parseAirtelTransactionDate(dateStr),
        description: descriptionParts.join(" ").replace(/\s+/g, " ").trim(),
        status: "Transaction Successful",
        amount,
        type: type === "Credit" ? "Credit" : "Debit",
        balance,
      });

      i += 3;
      continue;
    }

    const inlineMatch = line.match(TRANSACTION_ID_INLINE);
    if (inlineMatch) {
      const id = inlineMatch[1];
      const dateStr = inlineMatch[2];
      const descriptionParts = [inlineMatch[3]];
      i++;

      while (i < lines.length && !STATUS_LINE.test(lines[i])) {
        descriptionParts.push(lines[i]);
        i++;
      }

      if (i >= lines.length) break;
      i++;

      if (i + 2 >= lines.length) break;
      const amount = parseAmount(lines[i]);
      const type = lines[i + 1];
      const balance = parseAmount(lines[i + 2]);

      if (TYPE_LINE.test(type)) {
        transactions.push({
          id,
          date: parseAirtelTransactionDate(dateStr),
          description: descriptionParts.join(" ").replace(/\s+/g, " ").trim(),
          status: "Transaction Successful",
          amount,
          type: type as "Credit" | "Debit",
          balance,
        });
      }

      i += 3;
      continue;
    }

    i++;
  }

  return transactions;
}

export function parseAirtelDetailedStatement(text: string): ParseResult {
  const provider = detectProvider(text);
  const lines = normalizeLines(text);
  const metadata = extractDetailedMetadata(lines, provider === "unknown" ? "generic" : provider);
  const transactions = parseDetailedTransactions(lines).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return finalizeParseResult(metadata, transactions, provider);
}

/* ------------------------------------------------------------------ */
/* Balance statement format ("Balance statement for the period")       */
/* ------------------------------------------------------------------ */

const DATE_SLASH_ONLY = /^\d{2}\/\d{2}\/\d{2}$/;
const TIME_SUFFIXED = /^(\d{1,2}:\d{2})\s*(?:AM|PM)$/i;
const ID_PAREN_ONLY = /^\(([A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]+)\)$/i;
const AMOUNT_TOKEN = /^(--|[\d,]+\.?\d*)$/;
const FOOTER_NOISE = /^Need Help\??/i;

function normalizeLinesBasic(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function extractBalanceStatementMetadata(lines: string[]): StatementMetadata {
  const anchorIdx = lines.findIndex((l) => /Balance statement for the period/i.test(l));
  const customerName = anchorIdx > 0 ? lines[anchorIdx - 1].trim() : "Unknown";
  const mobileNumber = anchorIdx >= 0 ? (lines[anchorIdx + 1] ?? "").trim() : "";
  const periodLine = anchorIdx >= 0 ? (lines[anchorIdx + 2] ?? "") : "";
  const periodMatch = periodLine.match(
    /(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  );

  const fullText = lines.join("\n");
  const currencyMatch = fullText.match(/Amount\(([A-Za-z]{2,4})\)/i);
  const debitedMatch = fullText.match(/Total Money Debited\s*\n?\s*([\d,]+\.?\d*)/i);
  const creditedMatch = fullText.match(/Total Money Credited\s*\n?\s*([\d,]+\.?\d*)/i);
  const openingMatch = fullText.match(/Opening Balance\s*\n?\s*([\d,]+\.?\d*)/i);
  const closingMatch = fullText.match(/Closing Balance\s*\n?\s*([\d,]+\.?\d*)/i);

  return {
    customerName: customerName || "Unknown",
    mobileNumber,
    email: undefined,
    statementPeriod: {
      from: periodMatch ? parseAirtelBalancePeriodDate(periodMatch[1]) : new Date(),
      to: periodMatch ? parseAirtelBalancePeriodDate(periodMatch[2]) : new Date(),
    },
    requestDate: undefined,
    openingBalance: openingMatch ? parseAmount(openingMatch[1]) : 0,
    closingBalance: closingMatch ? parseAmount(closingMatch[1]) : 0,
    totalCredit: creditedMatch ? parseAmount(creditedMatch[1]) : 0,
    totalDebit: debitedMatch ? parseAmount(debitedMatch[1]) : 0,
    currency: normalizeCurrency(currencyMatch?.[1]),
    provider: "airtel",
  };
}

/**
 * Groups lines into per-transaction blocks anchored on the "DD/MM/YY" date line
 * that starts each row. Within a block, fields (time, id, the three amount
 * columns, and description text) are classified individually rather than by
 * strict position — near PDF page breaks, the time and transaction-ID lines
 * can be emitted out of order by the PDF text layer, appearing after the
 * amount columns instead of before them.
 */
function splitBalanceStatementBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    if (DATE_SLASH_ONLY.test(line)) {
      if (current) blocks.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function parseBalanceBlock(block: string[]): RawTransaction | null {
  const dateStr = block[0];
  let time: string | undefined;
  let id: string | undefined;
  const amountTokens: string[] = [];
  const descriptionParts: string[] = [];

  for (const line of block.slice(1)) {
    if (FOOTER_NOISE.test(line)) continue;

    const timeMatch = line.match(TIME_SUFFIXED);
    if (timeMatch) {
      time = timeMatch[1];
      continue;
    }

    const idMatch = line.match(ID_PAREN_ONLY);
    if (idMatch) {
      id = idMatch[1];
      continue;
    }

    if (AMOUNT_TOKEN.test(line)) {
      amountTokens.push(line);
      continue;
    }

    descriptionParts.push(line);
  }

  if (!time || !id || amountTokens.length < 3) return null;

  const [creditedStr, debitedStr, balanceStr] = amountTokens;
  const isCredit = creditedStr !== "--";
  const amount = parseAmount(isCredit ? creditedStr : debitedStr);
  const balance = parseAmount(balanceStr);
  const description =
    descriptionParts.join(" ").replace(/\s+/g, " ").replace(/^null\s+/i, "").trim() ||
    "(No description)";

  return {
    id,
    date: parseAirtelBalanceDateTime(dateStr, time),
    description,
    status: "Transaction Successful",
    amount,
    type: isCredit ? "Credit" : "Debit",
    balance,
  };
}

export function parseAirtelBalanceStatement(text: string): ParseResult {
  const lines = normalizeLinesBasic(text);
  const metadata = extractBalanceStatementMetadata(lines);
  const blocks = splitBalanceStatementBlocks(lines);
  const transactions = blocks
    .map(parseBalanceBlock)
    .filter((txn): txn is RawTransaction => txn !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return finalizeParseResult(metadata, transactions, "airtel");
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                       */
/* ------------------------------------------------------------------ */

function finalizeParseResult(
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

export function parseAirtelStatement(text: string): ParseResult {
  return parseAirtelDetailedStatement(text);
}

export function parseStatementText(text: string): ParseResult {
  const format = detectStatementFormat(text);

  if (format === "balance") {
    return parseAirtelBalanceStatement(text);
  }

  return parseAirtelDetailedStatement(text);
}
