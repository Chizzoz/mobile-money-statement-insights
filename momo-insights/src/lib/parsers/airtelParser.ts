import type { ParseResult, Provider, StatementMetadata } from "@/lib/types/transaction";
import {
  normalizeCurrency,
  parseAirtelPeriodDate,
  parseAirtelTransactionDate,
  parseAmount,
} from "@/utils/formatters";

const TRANSACTION_ID_ONLY = /^[A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]+$/i;
const TRANSACTION_ID_INLINE =
  /^([A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]+)\s+(\d{2}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(?:AM|PM))\s+(.+)$/i;
const DATE_ONLY = /^\d{2}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+(?:AM|PM)$/i;
const STATUS_LINE = /^Transaction Successful$/i;
const TYPE_LINE = /^(Credit|Debit)$/i;

const NOISE_PATTERNS = [
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

export function detectProvider(text: string): Provider {
  if (/AIRTEL MONEY STATEMENT/i.test(text)) return "airtel";
  if (/Transaction Successful/i.test(text) && /Credit|Debit/i.test(text)) {
    return "generic";
  }
  return "unknown";
}

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter((line) => line.length > 0)
    .filter((line) => !NOISE_PATTERNS.some((pattern) => pattern.test(line)));
}

function extractMetadata(lines: string[], provider: Provider): StatementMetadata {
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

type RawTransaction = Omit<
  import("@/lib/types/transaction").Transaction,
  "category" | "dayOfWeek" | "hour"
>;

function parseMultilineFormat(lines: string[]): RawTransaction[] {
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

export function parseAirtelStatement(text: string): ParseResult {
  const provider = detectProvider(text);
  const lines = normalizeLines(text);
  const metadata = extractMetadata(lines, provider === "unknown" ? "generic" : provider);
  const transactions = parseMultilineFormat(lines).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
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

export function parseStatementText(text: string): ParseResult {
  return parseAirtelStatement(text);
}
