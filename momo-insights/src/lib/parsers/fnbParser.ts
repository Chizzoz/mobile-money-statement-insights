import type { ParseResult, StatementMetadata } from "@/lib/types/transaction";
import {
  normalizeCurrency,
  parseAmount,
  parseDayMonthYear,
  parseFullMonthDayYear,
  resolveYearForDayMonth,
} from "@/utils/formatters";
import {
  deriveMissingMetadata,
  finalizeParseResult,
  makeSyntheticId,
  type RawTransaction,
} from "@/lib/parsers/shared";

export type FnbFormat =
  | "transaction-history"
  | "recreated-statement"
  | "letter-statement"
  | "unknown";

export function detectFnbFormat(text: string): FnbFormat {
  if (/Transaction History/i.test(text) && /Selected Account/i.test(text)) {
    return "transaction-history";
  }
  if (/Recreated Statement/i.test(text)) {
    return "recreated-statement";
  }
  if (/Statement Period\s*:/i.test(text) && /Branch Number/i.test(text)) {
    return "letter-statement";
  }
  return "unknown";
}

function normalizeLinesBasic(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\t+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function valueAfterLabel(lines: string[], label: string, offset = 1): string | undefined {
  const idx = lines.findIndex((l) => l === label);
  return idx >= 0 ? lines[idx + offset] : undefined;
}

function signedByCrDr(raw: string, suffix: string): number {
  const value = Math.abs(parseAmount(raw));
  return /cr/i.test(suffix) ? value : -value;
}

function splitByLeadingAnchor(lines: string[], anchorRe: RegExp): string[][] {
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    if (anchorRe.test(line)) {
      if (current) blocks.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Format A: "Transaction History" (online banking export)              */
/* Columns: Date | Description | Service Fee | Amount (+CR/DR) | Balance (+CR/DR) */
/* ------------------------------------------------------------------ */

const DATE_LINE_A = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/;
const FEE_BARE = /^-?[\d,]+\.\d{2}$/;
const AMOUNT_CRDR = /^(-?[\d,]+\.\d{2})\s*(CR|DR)$/i;

const NOISE_A = [
  /^Printed \d{4}-\d{2}-\d{2}/i,
  /^fnb@fnbzambia\.co\.zm$/i,
  /^Address:/i,
  /^Tel:/i,
  /^© \d{4} First National Bank/i,
  /^Date$/i,
  /^Description$/i,
  /^Service Fee$/i,
  /^Amount$/i,
  /^Balance$/i,
  /^\.$/,
];

function extractTransactionHistoryMetadata(lines: string[]): StatementMetadata {
  const nicknameIdx = lines.findIndex((l) => l === "Nickname:");
  const nickname = nicknameIdx >= 0 ? lines[nicknameIdx + 1] : undefined;
  const currencyHint = nicknameIdx >= 0 ? lines[nicknameIdx + 2] : undefined;

  const accountNumber = valueAfterLabel(lines, "Selected Account:") ?? "";
  const currentBalanceRaw = valueAfterLabel(lines, "Current Balance:");

  let closingBalance = 0;
  if (currentBalanceRaw) {
    const match = currentBalanceRaw.match(/(-?[\d,]+\.?\d*)\s*(CR|DR)/i);
    if (match) closingBalance = signedByCrDr(match[1], match[2]);
  }

  return {
    customerName: nickname ?? "FNB Account",
    mobileNumber: accountNumber,
    email: undefined,
    statementPeriod: { from: new Date(0), to: new Date(0) },
    requestDate: undefined,
    openingBalance: 0,
    closingBalance,
    totalCredit: 0,
    totalDebit: 0,
    currency: normalizeCurrency(currencyHint),
    provider: "fnb",
  };
}

function extractTransactionSection(lines: string[]): string[] {
  const headerIdx = lines.findIndex((l, i) => l === "Balance" && lines[i - 1] === "Amount");
  const section = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;
  return section.filter((l) => !NOISE_A.some((pattern) => pattern.test(l)));
}

function parseTransactionHistoryBlock(block: string[], index: number): RawTransaction | null {
  const [dateStr, ...rest] = block;
  if (rest.length < 3) return null;

  const balanceLine = rest[rest.length - 1];
  const amountLine = rest[rest.length - 2];
  const feeLine = rest[rest.length - 3];
  const descriptionLines = rest.slice(0, rest.length - 3);

  const balanceMatch = balanceLine.match(AMOUNT_CRDR);
  const amountMatch = amountLine.match(AMOUNT_CRDR);
  if (!balanceMatch || !amountMatch || !FEE_BARE.test(feeLine)) return null;

  const isCredit = /^CR$/i.test(amountMatch[2]);
  const amount = Math.abs(parseAmount(amountMatch[1]));
  const balance = signedByCrDr(balanceMatch[1], balanceMatch[2]);
  const description =
    descriptionLines.join(" ").replace(/\s+/g, " ").trim() || "(No description)";
  const date = parseDayMonthYear(dateStr);

  return {
    id: makeSyntheticId("FNB-TXN", index, date),
    date,
    description,
    status: "Transaction Successful",
    amount,
    type: isCredit ? "Credit" : "Debit",
    balance,
  };
}

export function parseTransactionHistoryStatement(text: string): ParseResult {
  const lines = normalizeLinesBasic(text);
  const metadata = extractTransactionHistoryMetadata(lines);
  const sectionLines = extractTransactionSection(lines);
  const blocks = splitByLeadingAnchor(sectionLines, DATE_LINE_A);

  const transactions = blocks
    .map((block, index) => parseTransactionHistoryBlock(block, index))
    .filter((t): t is RawTransaction => t !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const finalMetadata = deriveMissingMetadata(metadata, transactions);
  return finalizeParseResult(finalMetadata, transactions, "fnb");
}

/* ------------------------------------------------------------------ */
/* Format B: "Recreated Statement" (reversed column order)             */
/* Columns: Balance | Amount | Service Fee | Reference | Description | Effective Date */
/* ------------------------------------------------------------------ */

const DATE_LINE_B = DATE_LINE_A; // same "DD Mon YYYY" shape, but appears at the END of each row
const BARE_DECIMAL = /^-?[\d,]+\.\d{2}$/;

function extractRecreatedStatementMetadata(lines: string[]): StatementMetadata {
  const accountNumber = valueAfterLabel(lines, "Account Number :", -1) ?? "";

  const nameIdx = lines.findIndex((l) => l === "Name :");
  const currency = nameIdx > 0 ? lines[nameIdx - 1] : undefined;
  const nickname = nameIdx > 1 ? lines[nameIdx - 2] : undefined;

  const openingRaw = valueAfterLabel(lines, "Opening Balance", -1);
  const closingRaw = valueAfterLabel(lines, "Closing Balance", -1);
  const debitsRaw = valueAfterLabel(lines, "Debits (-)", -1);
  const creditsRaw = valueAfterLabel(lines, "Credits (+)", -1);
  const statementDateRaw = valueAfterLabel(lines, "Statement Date", -1);

  return {
    customerName: nickname ?? "FNB Account",
    mobileNumber: accountNumber,
    email: undefined,
    statementPeriod: { from: new Date(0), to: new Date(0) },
    requestDate: statementDateRaw ? parseDayMonthYear(statementDateRaw) : undefined,
    openingBalance: openingRaw ? parseAmount(openingRaw) : 0,
    closingBalance: closingRaw ? parseAmount(closingRaw) : 0,
    totalCredit: creditsRaw ? parseAmount(creditsRaw) : 0,
    totalDebit: debitsRaw ? parseAmount(debitsRaw) : 0,
    currency: normalizeCurrency(currency),
    provider: "fnb",
  };
}

function splitByTrailingDate(lines: string[], dateRe: RegExp): { fields: string[]; dateStr: string }[] {
  const blocks: { fields: string[]; dateStr: string }[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    if (dateRe.test(line)) {
      blocks.push({ fields: buffer, dateStr: line });
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  return blocks;
}

function parseRecreatedBlock(
  fields: string[],
  dateStr: string,
  index: number,
): RawTransaction | null {
  if (fields.length < 3) return null;
  const [balanceRaw, amountRaw, feeRaw, ...descriptionParts] = fields;
  if (!BARE_DECIMAL.test(balanceRaw) || !BARE_DECIMAL.test(amountRaw) || !BARE_DECIMAL.test(feeRaw)) {
    return null;
  }

  const amountValue = parseAmount(amountRaw);
  const isCredit = amountValue >= 0;
  const amount = Math.abs(amountValue);
  const balance = parseAmount(balanceRaw);
  const description =
    descriptionParts.join(" ").replace(/\s+/g, " ").trim() || "(No description)";
  const date = parseDayMonthYear(dateStr);

  return {
    id: makeSyntheticId("FNB-RCS", index, date),
    date,
    description,
    status: "Transaction Successful",
    amount,
    type: isCredit ? "Credit" : "Debit",
    balance,
  };
}

export function parseRecreatedStatement(text: string): ParseResult {
  const lines = normalizeLinesBasic(text);
  const metadata = extractRecreatedStatementMetadata(lines);

  const headerIdx = lines.findIndex((l) => l === "Effective Date");
  const sectionLines = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;

  const blocks = splitByTrailingDate(sectionLines, DATE_LINE_B);
  const transactions = blocks
    .map((block, index) => parseRecreatedBlock(block.fields, block.dateStr, index))
    .filter((t): t is RawTransaction => t !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const finalMetadata = deriveMissingMetadata(metadata, transactions);
  return finalizeParseResult(finalMetadata, transactions, "fnb");
}

/* ------------------------------------------------------------------ */
/* Format C: Official mailed statement letter                          */
/* Columns: Date | Description | Amount (+Cr) | Balance (+Cr) | Accrued Bank Charges */
/* Dates have no year ("17 Feb") — resolved from the statement period. */
/* ------------------------------------------------------------------ */

const MONTH_ABBR = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const DATE_LINE_C = new RegExp(`^(\\d{1,2})\\s+(${MONTH_ABBR})$`, "i");
const PURE_NUMERIC_C = /^-?[\d,]+\.\d{2}(Cr)?$/i;

const NOISE_C = [
  /^Branch Number$/i,
  /^Account Number$/i,
  /^Date$/i,
  /^DDA\b/i,
  /^ZM$/,
  /^GOLD CHEQUE ACCOUNT$/i,
  /^Page \d+ of \d+$/i,
  /^Delivery Method/i,
  /^NS\/IQ\/WV/i,
  /^XSTZZM0:/i,
  /^BBST60$/i,
  /^Transactions in ZAMBIAN KWACHA/i,
  /^Description$/i,
  /^Amount$/i,
  /^Balance$/i,
  /^Accrued$/i,
  /^Bank$/i,
  /^Charges$/i,
  /^Closing Balance$/i,
  /^Turnover for Statement Period$/i,
  /^No\.\s*(Credit|Debit) Transactions/i,
  /^Please contact us/i,
  /^during this statement period/i,
  /^is correct\.$/i,
  /^First National Bank Zambia/i,
  /^\d{4}\/\d{2}\/\d{2}$/,
  /^\d{4}$/,
];

function extractLetterMetadata(lines: string[], fullText: string): StatementMetadata {
  const nameLine = lines.find((l) => /^(MR|MRS|MS|DR|MISS)\s+[A-Z][A-Z\s]+$/.test(l));
  const accountMatch = fullText.match(/Gold Cheque Account\s*:\s*(\d+)/i);
  const periodMatch = fullText.match(
    /Statement Period\s*:\s*(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  );
  const statementDateMatch = fullText.match(/Statement Date\s*:\s*(\d{1,2}\s+\w+\s+\d{4})/i);

  const openingRaw = valueAfterLabel(lines, "Opening Balance");
  const closingIdx = lines.findIndex((l) => l === "Closing Balance");
  const closingRaw = closingIdx >= 0 ? lines[closingIdx + 1] : undefined;

  const creditTotalIdx = lines.findIndex((l) => /^No\.\s*Credit Transactions/i.test(l));
  const debitTotalIdx = lines.findIndex((l) => /^No\.\s*Debit Transactions/i.test(l));
  const totalCreditRaw = creditTotalIdx >= 0 ? lines[creditTotalIdx + 1] : undefined;
  const totalDebitRaw = debitTotalIdx >= 0 ? lines[debitTotalIdx + 1] : undefined;

  const openingSplit = openingRaw?.match(/(-?[\d,]+\.?\d*)\s*(Dr|Cr)/i);
  const closingSplit = closingRaw?.match(/(-?[\d,]+\.?\d*)\s*(Dr|Cr)/i);

  return {
    customerName: nameLine ?? "Unknown",
    mobileNumber: accountMatch?.[1] ?? "",
    email: undefined,
    statementPeriod: {
      from: periodMatch ? parseFullMonthDayYear(periodMatch[1]) : new Date(0),
      to: periodMatch ? parseFullMonthDayYear(periodMatch[2]) : new Date(0),
    },
    requestDate: statementDateMatch ? parseFullMonthDayYear(statementDateMatch[1]) : undefined,
    openingBalance: openingSplit ? signedByCrDr(openingSplit[1], openingSplit[2]) : 0,
    closingBalance: closingSplit ? signedByCrDr(closingSplit[1], closingSplit[2]) : 0,
    totalCredit: totalCreditRaw ? parseAmount(totalCreditRaw) : 0,
    totalDebit: totalDebitRaw ? parseAmount(totalDebitRaw) : 0,
    currency: normalizeCurrency(/ZMW|ZAMBIAN KWACHA/i.test(fullText) ? "ZMW" : undefined),
    provider: "fnb",
  };
}

function parseLetterBlock(
  dateStr: string,
  rest: string[],
  index: number,
  periodFrom: Date,
  periodTo: Date,
): RawTransaction | null {
  const numericFields: string[] = [];
  const descriptionParts: string[] = [];

  for (const line of rest) {
    if (PURE_NUMERIC_C.test(line)) {
      numericFields.push(line);
    } else if (!NOISE_C.some((pattern) => pattern.test(line))) {
      descriptionParts.push(line);
    }
  }

  if (numericFields.length < 2) return null;

  const [amountRaw, balanceRaw] = numericFields;
  const isCredit = /cr$/i.test(amountRaw);
  const amount = Math.abs(parseAmount(amountRaw));
  const isBalanceCredit = /cr$/i.test(balanceRaw);
  const balance = isBalanceCredit
    ? Math.abs(parseAmount(balanceRaw))
    : -Math.abs(parseAmount(balanceRaw));

  // This letter-format PDF drops the description text for bank-to-wallet
  // transfer rows (the only rows with an "Accrued Bank Charges" value but no
  // description). Cross-referencing the same account's other statement
  // exports confirms every such row is a "Bank To Wallet Payment".
  const hasAccruedCharge = numericFields.length >= 3;
  const description =
    descriptionParts.join(" ").replace(/\s+/g, " ").trim() ||
    (hasAccruedCharge ? "Bank To Wallet Payment" : "(No description)");

  const match = dateStr.match(DATE_LINE_C);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthAbbr = match[2];
  const monthIndex = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec"
    .split(" ")
    .findIndex((m) => m.toLowerCase() === monthAbbr.toLowerCase());
  const year = resolveYearForDayMonth(monthIndex, periodFrom, periodTo);
  const date = new Date(year, monthIndex, day);

  return {
    id: makeSyntheticId("FNB-LTR", index, date),
    date,
    description,
    status: "Transaction Successful",
    amount,
    type: isCredit ? "Credit" : "Debit",
    balance,
  };
}

export function parseLetterStatement(text: string): ParseResult {
  const lines = normalizeLinesBasic(text);
  const fullText = lines.join("\n");
  const metadata = extractLetterMetadata(lines, fullText);

  const accruedIdx = lines.findIndex((l) => l === "Accrued");
  const sectionStart = accruedIdx >= 0 ? accruedIdx + 3 : 0;
  const sectionLines = lines.slice(sectionStart).filter((l) => !NOISE_C.some((p) => p.test(l)));

  const rawBlocks = splitByLeadingAnchor(sectionLines, DATE_LINE_C);
  const transactions = rawBlocks
    .map((block, index) =>
      parseLetterBlock(
        block[0],
        block.slice(1),
        index,
        metadata.statementPeriod.from,
        metadata.statementPeriod.to,
      ),
    )
    .filter((t): t is RawTransaction => t !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return finalizeParseResult(metadata, transactions, "fnb");
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                            */
/* ------------------------------------------------------------------ */

export function parseFnbStatement(text: string, format?: FnbFormat): ParseResult {
  const resolved = format ?? detectFnbFormat(text);

  switch (resolved) {
    case "transaction-history":
      return parseTransactionHistoryStatement(text);
    case "recreated-statement":
      return parseRecreatedStatement(text);
    case "letter-statement":
      return parseLetterStatement(text);
    default:
      return parseTransactionHistoryStatement(text);
  }
}
