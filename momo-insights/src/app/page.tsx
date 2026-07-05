"use client";

import { DashboardView } from "@/components/Dashboard/DashboardView";
import { DashboardSkeleton } from "@/components/Dashboard/DashboardGrid";
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
      {/* Hero header */}
      <header className="border-b border-white/10 bg-gradient-to-r from-indigo-950/80 via-slate-950 to-purple-950/80">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-400" />
                <h1 className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-3xl font-bold text-transparent">
                  MoMo Insights
                </h1>
              </div>
              <p className="max-w-xl text-muted-foreground">
                Upload your mobile money statement to visualize spending, uncover patterns,
                and get personalized financial advice.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
              <Lock className="h-4 w-4" />
              100% private — processed locally
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
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">
              v1 tested on Airtel Money statements. Other providers may work if the format is similar.
            </p>
          </div>
        ) : status === "loading" ? (
          <div className="space-y-6">
            <p className="text-center text-sm text-indigo-300">{loadingMessage}</p>
            <DashboardSkeleton />
          </div>
        ) : analysis ? (
          <DashboardView analysis={analysis} />
        ) : null}
      </div>
    </main>
  );
}
