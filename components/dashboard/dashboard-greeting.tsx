"use client";

import { Coins } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { motion } from "framer-motion";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ name, credits }: { name: string; credits: number }) {
  const count = useCountUp(credits, 800);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {greeting()}, {name} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your skill swaps today.</p>
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-soft">
        <Coins className="h-5 w-5 text-primary" aria-hidden />
        <p className="text-sm">
          <span className="font-display text-lg font-extrabold tabular-nums text-primary">{count}</span>{" "}
          <span className="text-muted-foreground">Skill Credit{credits === 1 ? "" : "s"}</span>
        </p>
      </div>
    </motion.div>
  );
}
