"use client";

import { DashboardView } from "@/components/Dashboard/DashboardView";
import { DashboardSkeleton } from "@/components/Dashboard/DashboardGrid";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { FileUploader } from "@/components/Uploader/FileUploader";
import { StatementInstructions } from "@/components/Uploader/StatementInstructions";
import { analyzeStatement } from "@/lib/analyzers/aggregator";
import { parsePdfFile } from "@/lib/parsers/pdfParser";
import { parseTextStatement } from "@/lib/parsers/textParser";
import { useStatementStore } from "@/store/useStatementStore";
import { Lock } from "lucide-react";
import { useCallback } from "react";

export default function HomePage() {
  const { status, analysis, error, loadingMessage, setLoading, setAnalysis, setError } =
    useStatementStore();

  const processText = useCallback(
    async (text: string) => {
      setLoading("Parsing statement text...");
      try {
        await new Promise((r) => setTimeout(r, 100));
        const parsed = parseTextStatement(text);
        if (parsed.transactions.length === 0) {
          setError("No transactions found. Please check the statement format.");
          return;
        }
        setLoading("Analyzing transactions...");
        const result = analyzeStatement(parsed);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse statement");
      }
    },
    [setLoading, setAnalysis, setError],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setLoading(`Reading ${file.name}...`);
      try {
        let text: string;
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          setLoading("Extracting text from PDF...");
          text = await parsePdfFile(file);
        } else {
          text = await file.text();
        }
        await processText(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      }
    },
    [setLoading, setError, processText],
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-6 sm:px-10">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold leading-tight text-foreground sm:text-[28px] sm:font-bold">
              MoMo Insights
            </h1>
            <p className="hidden max-w-md truncate text-sm text-muted-foreground sm:block">
              Mobile money statement analysis
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-airbnb sm:flex">
              <Lock className="h-4 w-4 text-primary" />
              Processed locally
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-10 sm:px-10 sm:py-16">
        {status === "idle" || status === "error" ? (
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-[22px] font-medium leading-snug text-foreground">
                Understand your spending
              </h2>
              <p className="text-base text-[var(--body-text,#3f3f3f)] dark:text-muted-foreground">
                Upload your mobile money statement to visualize spending, uncover patterns,
                and get personalized financial advice.
              </p>
            </div>
            <FileUploader
              onFileSelect={handleFileSelect}
              onTextSubmit={processText}
              isLoading={false}
            />
            <StatementInstructions />
            {error && (
              <div className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              v1 tested on Airtel Money statements. Other providers may work if the format is similar.
            </p>
          </div>
        ) : status === "loading" ? (
          <div className="space-y-8">
            <p className="text-center text-base font-medium text-foreground">{loadingMessage}</p>
            <DashboardSkeleton />
          </div>
        ) : analysis ? (
          <DashboardView analysis={analysis} />
        ) : null}
      </div>
    </main>
  );
}
