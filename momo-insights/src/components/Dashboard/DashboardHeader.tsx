"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatementMetadata } from "@/lib/types/transaction";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { TrendingDown, TrendingUp, Wallet, User } from "lucide-react";

interface DashboardHeaderProps {
  metadata: StatementMetadata;
}

export function DashboardHeader({ metadata }: DashboardHeaderProps) {
  const periodLabel = `${format(metadata.statementPeriod.from, "dd MMM yyyy")} — ${format(metadata.statementPeriod.to, "dd MMM yyyy")}`;

  const cards = [
    {
      title: "Opening Balance",
      value: formatCurrency(metadata.openingBalance, metadata.currency),
      icon: Wallet,
    },
    {
      title: "Closing Balance",
      value: formatCurrency(metadata.closingBalance, metadata.currency),
      icon: Wallet,
    },
    {
      title: "Total Credit",
      value: formatCurrency(metadata.totalCredit, metadata.currency),
      icon: TrendingUp,
      valueClass: "text-green-700 dark:text-green-400",
    },
    {
      title: "Total Debit",
      value: formatCurrency(metadata.totalDebit, metadata.currency),
      icon: TrendingDown,
      valueClass: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-airbnb">
          <User className="h-4 w-4 text-foreground" />
          <span className="font-semibold text-foreground">{metadata.customerName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{metadata.mobileNumber}</span>
        </div>
        <div className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {periodLabel}
        </div>
        {metadata.provider === "airtel" && (
          <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Airtel Money
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-[22px] font-semibold leading-tight ${card.valueClass ?? "text-foreground"}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[14px]" />
        ))}
      </div>
    </div>
  );
}
