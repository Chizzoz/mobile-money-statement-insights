"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, Search } from "lucide-react";
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
      <TabsList variant="line" className="h-auto w-full justify-start gap-6 border-b border-border bg-transparent p-0">
        <TabsTrigger
          value="upload"
          className="rounded-none border-0 bg-transparent px-0 pb-3 after:bottom-0 after:h-[2px] after:bg-foreground data-active:font-semibold data-active:text-foreground"
        >
          Upload PDF
        </TabsTrigger>
        <TabsTrigger
          value="paste"
          className="rounded-none border-0 bg-transparent px-0 pb-3 after:bottom-0 after:h-[2px] after:bg-foreground data-active:font-semibold data-active:text-foreground"
        >
          Paste Text
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-8">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-[14px] border border-border bg-card p-12 shadow-airbnb transition-shadow",
            isDragging && "border-foreground ring-2 ring-foreground/20",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Parsing your statement...</p>
            </>
          ) : (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mb-1 text-base font-semibold text-foreground">Drop your statement here</p>
              <p className="mb-6 text-sm text-muted-foreground">
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

      <TabsContent value="paste" className="mt-8 space-y-6">
        <div className="flex items-start gap-3 rounded-[14px] border border-border bg-muted p-5">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm leading-relaxed text-[var(--body-text,#3f3f3f)] dark:text-muted-foreground">
            Copy the full text from your mobile money statement PDF and paste it below.
            v1 is tested on Airtel Money; other formats may work if the layout is similar.
          </p>
        </div>
        <Textarea
          placeholder="Paste statement text here..."
          className="min-h-[220px] resize-y rounded-lg border-border bg-background text-sm leading-relaxed"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          disabled={isLoading}
        />
        <Button
          onClick={() => onTextSubmit(pastedText)}
          disabled={!pastedText.trim() || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Analyze Statement
            </>
          )}
        </Button>
      </TabsContent>
    </Tabs>
  );
}
