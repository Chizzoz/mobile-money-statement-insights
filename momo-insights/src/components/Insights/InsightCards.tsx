"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Insight } from "@/lib/types/transaction";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  ShieldAlert,
  TrendingDown,
  Wallet,
} from "lucide-react";

const INSIGHT_ICONS: Record<Insight["type"], React.ElementType> = {
  debt_reduction: TrendingDown,
  fee_optimization: Wallet,
  build_savings: Lightbulb,
  reduce_spending: ShieldAlert,
  cash_flow: AlertTriangle,
};

const SEVERITY_STYLES: Record<
  Insight["severity"],
  { border: string; bg: string; icon: string }
> = {
  critical: {
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    icon: "text-destructive",
  },
  warning: {
    border: "border-border",
    bg: "bg-muted",
    icon: "text-foreground",
  },
  info: {
    border: "border-border",
    bg: "bg-card",
    icon: "text-primary",
  },
};

interface InsightCardsProps {
  insights: Insight[];
}

export function InsightCards({ insights }: InsightCardsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Financial Insights</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICONS[insight.type] ?? Info;
          const styles = SEVERITY_STYLES[insight.severity];

          return (
            <Card
              key={insight.type + insight.title}
              className={`border ${styles.border} ${styles.bg} shadow-none ring-0`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className={`h-4 w-4 ${styles.icon}`} />
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[var(--body-text,#3f3f3f)] dark:text-muted-foreground">
                  {insight.message}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
