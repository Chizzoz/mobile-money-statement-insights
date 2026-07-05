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
    bg: "bg-destructive/10",
    icon: "text-destructive",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
  },
  info: {
    border: "border-primary/30",
    bg: "bg-primary/10",
    icon: "text-primary",
  },
};

interface InsightCardsProps {
  insights: Insight[];
}

export function InsightCards({ insights }: InsightCardsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Financial Insights</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICONS[insight.type] ?? Info;
          const styles = SEVERITY_STYLES[insight.severity];

          return (
            <Card
              key={insight.type + insight.title}
              className={`border ${styles.border} ${styles.bg}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className={`h-4 w-4 ${styles.icon}`} />
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
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
