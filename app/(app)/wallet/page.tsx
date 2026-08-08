"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Gift, RotateCcw, SlidersHorizontal, Coins, ArrowRightLeft } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { get } from "@/lib/client";
import { Card, Skeleton, Badge, EmptyState } from "@/components/ui";
import { relativeTime } from "@/lib/utils";
import type { WalletSummary } from "@/types";
import { useCountUp } from "@/hooks/useCountUp";


const TX_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  EARNED: { label: "Earned", icon: <TrendingUp size={15} />, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  SPENT: { label: "Spent", icon: <TrendingDown size={15} />, cls: "bg-red-500/10 text-red-500" },
  BONUS: { label: "Bonus", icon: <Gift size={15} />, cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  REFUND: { label: "Refund", icon: <RotateCcw size={15} />, cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  ADMIN_ADJUSTMENT: { label: "Adjustment", icon: <SlidersHorizontal size={15} />, cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

export default function WalletPage() {
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);

  React.useEffect(() => {
    get<WalletSummary>("/api/wallet").then(setWallet).catch(() => setWallet(null));
  }, []);

  if (!wallet) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Skill Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">Teach an hour, earn a credit. Learn an hour, spend one.</p>
        </div>
      </div>

      {/* Balance hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current balance</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Coins size={22} /></span>
              <CountUpBalance value={wallet.balance} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">1 credit = 1 hour of teaching</p>
          </div>
          <div className="flex gap-3">
            <Stat label="Total earned" value={`+${wallet.totalEarned}`} tone="text-emerald-600 dark:text-emerald-400" />
            <Stat label="Total spent" value={`−${wallet.totalSpent}`} tone="text-red-500" />
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Balance history</h2>
          <Badge variant="secondary">Every movement is recorded</Badge>
        </div>
        {wallet.history.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={wallet.history} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} formatter={(v) => [`${v} credits`, "Balance"]} labelFormatter={(d) => new Date(String(d) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
              <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#balanceFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Not enough history yet — teach your first session to get started.</p>
        )}
      </Card>

      {/* Transactions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Transaction history</h2>
          <Badge variant="outline"><ArrowRightLeft size={11} /> {wallet.transactions.length} recorded</Badge>
        </div>
        {wallet.transactions.length === 0 ? (
          <EmptyState icon={<Coins className="h-6 w-6" />} title="No transactions yet" description="Your first bonus credits arrive when you complete onboarding." />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {wallet.transactions.map((tx) => {
              const meta = TX_META[tx.type] ?? TX_META.ADMIN_ADJUSTMENT;
              const positive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-secondary/40">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{tx.description}</p>
                    <p className="text-[11px] text-muted-foreground">{meta.label} · {relativeTime(tx.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-display text-sm font-extrabold tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {positive ? "+" : "−"}{Math.abs(tx.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">bal. {tx.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 px-5 py-3 text-center">
      <p className={`font-display text-xl font-extrabold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function CountUpBalance({ value }: { value: number }) {
  const count = useCountUp(value, 800);
  return <span className="font-display text-5xl font-extrabold tabular-nums tracking-tight">{count}</span>;
}
