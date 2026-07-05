import { create } from "zustand";
import type { AnalysisResult, Category } from "@/lib/types/transaction";

export type AppStatus = "idle" | "loading" | "ready" | "error";

interface StatementState {
  status: AppStatus;
  analysis: AnalysisResult | null;
  error: string | null;
  selectedCategory: Category | null;
  loadingMessage: string;
  setLoading: (message?: string) => void;
  setAnalysis: (analysis: AnalysisResult) => void;
  setError: (error: string) => void;
  setSelectedCategory: (category: Category | null) => void;
  reset: () => void;
}

export const useStatementStore = create<StatementState>((set) => ({
  status: "idle",
  analysis: null,
  error: null,
  selectedCategory: null,
  loadingMessage: "Processing statement...",
  setLoading: (message = "Processing statement...") =>
    set({ status: "loading", error: null, loadingMessage: message }),
  setAnalysis: (analysis) =>
    set({ status: "ready", analysis, error: null, selectedCategory: null }),
  setError: (error) => set({ status: "error", error, analysis: null }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  reset: () =>
    set({
      status: "idle",
      analysis: null,
      error: null,
      selectedCategory: null,
    }),
}));
