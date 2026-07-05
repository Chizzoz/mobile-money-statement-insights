"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onTextSubmit: (text: string) => void;
  isLoading: boolean;
}

export function FileUploader({ onFileSelect, onTextSubmit, isLoading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/5">
        <TabsTrigger value="upload">Upload PDF</TabsTrigger>
        <TabsTrigger value="paste">Paste Text</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all",
            isDragging
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-white/20 bg-white/5 hover:border-indigo-400/50 hover:bg-white/10",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-indigo-400" />
              <p className="text-sm text-muted-foreground">Parsing your statement...</p>
            </>
          ) : (
            <>
              <Upload className="mb-4 h-12 w-12 text-indigo-400" />
              <p className="mb-1 text-lg font-medium">Drop your statement here</p>
              <p className="mb-4 text-sm text-muted-foreground">
                PDF or text — processed entirely in your browser
              </p>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const input = document.getElementById("file-input") as HTMLInputElement;
                    input?.click();
                  }}
                >
                  Browse files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.txt,text/plain,application/pdf"
                  className="hidden"
                  onChange={handleFileInput}
                />
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="paste" className="mt-4 space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
          <p className="text-sm text-muted-foreground">
            Copy the full text from your mobile money statement PDF and paste it below.
            v1 is tested on Airtel Money; other formats may work if the layout is similar.
          </p>
        </div>
        <Textarea
          placeholder="Paste statement text here..."
          className="min-h-[200px] resize-y bg-white/5 font-mono text-sm"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          disabled={isLoading}
        />
        <Button
          onClick={() => onTextSubmit(pastedText)}
          disabled={!pastedText.trim() || isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Statement"
          )}
        </Button>
      </TabsContent>
    </Tabs>
  );
}
