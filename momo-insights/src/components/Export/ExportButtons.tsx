"use client";

import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/types/transaction";
import { exportAnalysisPdf, exportTransactionsCsv } from "@/utils/exportUtils";
import { Download, FileSpreadsheet, RotateCcw } from "lucide-react";
import { useState } from "react";

interface ExportButtonsProps {
  analysis: AnalysisResult;
  onReset: () => void;
}

export function ExportButtons({ analysis, onReset }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  const handlePdfExport = async () => {
    setExporting(true);
    try {
      await exportAnalysisPdf(analysis);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => exportTransactionsCsv(analysis.transactions)}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="secondary"
        onClick={handlePdfExport}
        disabled={exporting}
      >
        <Download className="mr-2 h-4 w-4" />
        {exporting ? "Generating..." : "Export PDF Report"}
      </Button>
      <Button variant="outline" onClick={onReset}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Upload New Statement
      </Button>
    </div>
  );
}
