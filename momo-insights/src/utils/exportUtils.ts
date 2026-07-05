import type { AnalysisResult, Transaction } from "@/lib/types/transaction";
import { formatCurrency, formatDate } from "@/utils/formatters";

export function exportTransactionsCsv(transactions: Transaction[]): void {
  const headers = [
    "ID",
    "Date",
    "Description",
    "Status",
    "Amount",
    "Type",
    "Balance",
    "Category",
  ];

  const rows = transactions.map((txn) => [
    txn.id,
    formatDate(txn.date),
    `"${txn.description.replace(/"/g, '""')}"`,
    txn.status,
    txn.amount.toFixed(2),
    txn.type,
    txn.balance.toFixed(2),
    txn.category,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadBlob(csv, "momo-insights-transactions.csv", "text/csv;charset=utf-8;");
}

export async function exportAnalysisPdf(analysis: AnalysisResult): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const { metadata, transactions, categoryTotals, insights } = analysis;
  const currency = metadata.currency;
  let y = 20;

  doc.setFontSize(18);
  doc.text("MoMo Insights — Analysis Report", 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Customer: ${metadata.customerName}`, 14, y);
  y += 6;
  doc.text(`Mobile: ${metadata.mobileNumber}`, 14, y);
  y += 6;
  doc.text(
    `Period: ${metadata.statementPeriod.from.toDateString()} — ${metadata.statementPeriod.to.toDateString()}`,
    14,
    y,
  );
  y += 10;

  doc.setFontSize(13);
  doc.text("Summary", 14, y);
  y += 7;
  doc.setFontSize(10);
  const summaryLines = [
    `Opening Balance: ${formatCurrency(metadata.openingBalance, currency)}`,
    `Closing Balance: ${formatCurrency(metadata.closingBalance, currency)}`,
    `Total Credit: ${formatCurrency(metadata.totalCredit, currency)}`,
    `Total Debit: ${formatCurrency(metadata.totalDebit, currency)}`,
    `Transactions: ${transactions.length}`,
  ];
  for (const line of summaryLines) {
    doc.text(line, 14, y);
    y += 5;
  }
  y += 5;

  doc.setFontSize(13);
  doc.text("Spending by Category", 14, y);
  y += 7;
  doc.setFontSize(10);
  for (const [cat, amount] of Object.entries(categoryTotals)) {
    if (amount <= 0) continue;
    doc.text(`${cat}: ${formatCurrency(amount, currency)}`, 14, y);
    y += 5;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }
  y += 5;

  doc.setFontSize(13);
  doc.text("Financial Insights", 14, y);
  y += 7;
  doc.setFontSize(10);
  for (const insight of insights) {
    const lines = doc.splitTextToSize(`${insight.title}: ${insight.message}`, 180);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 5;
    }
    y += 2;
  }

  doc.save("momo-insights-report.pdf");
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportChartAsPng(element: HTMLElement, filename: string): Promise<void> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
