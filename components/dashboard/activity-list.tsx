"use client";

import { TrendingUp, TrendingDown, Gift, RotateCcw, SlidersHorizontal } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { CreditTransaction } from "@/types";
import { EmptyState } from "../ui";

const ICONS: Record<string, React.ReactNode> = {
  EARNED: <TrendingUp size={15} />,
  SPENT: <TrendingDown size={15} />,
  BONUS: <Gift size={15} />,
  REFUND: <RotateCcw size={15} />,
  ADMIN_ADJUSTMENT: <SlidersHorizontal size={15} />,
};

export function ActivityList({ transactions }: { transactions: CreditTransaction[] }) {
  if (transactions.length === 0) {
    return <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="No activity yet" description="Teach your first session to earn Skill Credits." />;
  }
  return (
    <div className="space-y-1.5">
      {transactions.map((tx) => {
        const positive = tx.amount > 0;
        return (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-soft">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${positive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-500"}`}>
              {ICONS[tx.type] ?? null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{tx.description}</p>
              <p className="text-[11px] text-muted-foreground">{relativeTime(tx.createdAt)}</p>
            </div>
            <span className={`shrink-0 font-display text-sm font-extrabold tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {positive ? "+" : "−"}{Math.abs(tx.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
