"use client";

import { DashboardView } from "@/components/Dashboard/DashboardView";
import { DashboardSkeleton } from "@/components/Dashboard/DashboardGrid";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { FileUploader } from "@/components/Uploader/FileUploader";
import { analyzeStatement } from "@/lib/analyzers/aggregator";
import { parsePdfFile } from "@/lib/parsers/pdfParser";
import { parseTextStatement } from "@/lib/parsers/textParser";
import { useStatementStore } from "@/store/useStatementStore";
import { Lock, Sparkles } from "lucide-react";
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
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">MoMo Insights</h1>
              </div>
              <p className="max-w-xl text-muted-foreground">
                Upload your mobile money statement to visualize spending, uncover patterns,
                and get personalized financial advice.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                100% private — processed locally
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {status === "idle" || status === "error" ? (
          <div className="mx-auto max-w-2xl space-y-6">
            <FileUploader
              onFileSelect={handleFileSelect}
              onTextSubmit={processText}
              isLoading={false}
            />
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">
              v1 tested on Airtel Money statements. Other providers may work if the format is similar.
            </p>
          </div>
        ) : status === "loading" ? (
          <div className="space-y-6">
            <p className="text-center text-sm text-primary">{loadingMessage}</p>
            <DashboardSkeleton />
          </div>
        ) : analysis ? (
          <DashboardView analysis={analysis} />
        ) : null}
      </div>
    </main>
  );
}
