"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category, Transaction } from "@/lib/types/transaction";
import { CATEGORY_COLORS } from "@/lib/types/transaction";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { X } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  selectedCategory: Category | null;
  onClearFilter: () => void;
}

export function TransactionTable({
  transactions,
  currency,
  selectedCategory,
  onClearFilter,
}: TransactionTableProps) {
  const filtered = selectedCategory
    ? transactions.filter((t) => t.category === selectedCategory)
    : transactions;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Transactions</h3>
          <span className="text-sm text-muted-foreground">
            ({filtered.length} of {transactions.length})
          </span>
          {selectedCategory && (
            <Badge
              variant="secondary"
              className="gap-1"
              style={{ borderColor: CATEGORY_COLORS[selectedCategory] }}
            >
              {selectedCategory}
              <button onClick={onClearFilter} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
        {selectedCategory && (
          <Button variant="ghost" size="sm" onClick={onClearFilter}>
            Clear filter
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px] rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((txn, index) => (
              <TableRow key={`${txn.id}-${index}`}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(txn.date)}
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-sm">
                  {txn.description}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: CATEGORY_COLORS[txn.category],
                      color: CATEGORY_COLORS[txn.category],
                    }}
                  >
                    {txn.category}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    txn.type === "Credit"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {txn.type === "Credit" ? "+" : "-"}
                  {formatCurrency(txn.amount, currency)}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatCurrency(txn.balance, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
