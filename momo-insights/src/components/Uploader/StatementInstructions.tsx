"use client";

import { useState } from "react";
import { ChevronDown, Info, Smartphone, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface StatementStep {
  text: string;
  subItems?: { label: string; recommended?: boolean }[];
}

const AIRTEL_STEPS: StatementStep[] = [
  { text: "Dial *115# on your Airtel line" },
  { text: "Select option 6. Account/PIN" },
  { text: "Select option 6. Statements" },
  { text: "Select option 1. Statement" },
  {
    text: "Choose your statement period",
    subItems: [
      { label: "Current Month" },
      { label: "Last Month" },
      { label: "Last 2 Months" },
      { label: "Last 3 Months", recommended: true },
      { label: "Last 6 Months" },
    ],
  },
  { text: "Enter your email address" },
  { text: "The PDF statement will be sent to your email" },
  { text: "Download the PDF and upload it here" },
];

const MTN_STEPS: StatementStep[] = [
  { text: "Dial *115# on your MTN line" },
  { text: "Select option 9. My Account" },
  { text: 'Select "Statements" or "Account History"' },
  {
    text: "Choose your statement period",
    subItems: [
      { label: "Current Month" },
      { label: "Last Month" },
      { label: "Last 3 Months" },
      { label: "Last 6 Months" },
      { label: "Custom period" },
    ],
  },
  { text: "Enter your email address" },
  { text: "The PDF statement will be sent to your email" },
  { text: "Download the PDF and upload it here" },
];

const ZAMTEL_STEPS: StatementStep[] = [
  { text: "Dial *115# on your Zamtel line" },
  {
    text: 'Navigate to the account or statements section (look for options like "Account", "Statements", or "History")',
  },
  {
    text: "Select your statement period",
    subItems: [
      { label: "Current Month" },
      { label: "Last Month" },
      { label: "Last 3 Months" },
      { label: "Last 6 Months" },
    ],
  },
  { text: "Enter your email address" },
  { text: "The PDF statement will be sent to your email" },
  { text: "Download the PDF and upload it here" },
];

function StepList({ steps }: { steps: StatementStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.text} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
            {index + 1}
          </span>
          <div className="flex-1 pt-0.5">
            <p className="text-sm text-foreground">{step.text}</p>
            {step.subItems && (
              <ul className="mt-2 space-y-1.5">
                {step.subItems.map((item) => (
                  <li key={item.label} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span
                      className={
                        item.recommended
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {item.label}
                    </span>
                    {item.recommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        Recommended
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StatementInstructions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[14px] border border-border bg-card shadow-airbnb">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Smartphone className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Don&apos;t have your statement yet?
            </p>
            <p className="text-xs text-muted-foreground">
              See how to download it from your provider
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border p-5 pt-5">
            <Tabs defaultValue="airtel" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="airtel">Airtel</TabsTrigger>
                <TabsTrigger value="mtn">MTN</TabsTrigger>
                <TabsTrigger value="zamtel">Zamtel</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <TabsContent value="airtel" className="mt-5">
                <StepList steps={AIRTEL_STEPS} />
              </TabsContent>

              <TabsContent value="mtn" className="mt-5">
                <StepList steps={MTN_STEPS} />
              </TabsContent>

              <TabsContent value="zamtel" className="mt-5">
                <StepList steps={ZAMTEL_STEPS} />
              </TabsContent>

              <TabsContent value="other" className="mt-5 space-y-3">
                <p className="text-sm text-foreground">
                  Download the PDF statement from your bank, mobile money, or financial
                  service provider&apos;s app, USSD menu, or website, then upload it here.
                </p>
                <p className="text-xs text-muted-foreground">
                  MoMo Insights is tested on Airtel Money statements. Other formats may work
                  if the layout is similar — you can also paste the raw text instead of
                  uploading a PDF.
                </p>
              </TabsContent>
            </Tabs>

            <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Tip: Statements can also be downloaded from your mobile network operator&apos;s
                app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
