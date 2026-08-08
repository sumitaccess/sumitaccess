"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, CATEGORY_ICON } from "@/lib/constants";
import { useCountUp } from "@/hooks/useCountUp";
import { Badge } from "./ui";
import type { Skill } from "@/types";
import { iconFor } from "@/lib/icons";

// ---------------------------------------------------------------------------
// Skill chip (used in profiles, cards, pickers)
// ---------------------------------------------------------------------------

export function SkillChip({
  skill,
  type,
  level,
  size = "sm",
  className,
}: {
  skill: Pick<Skill, "name" | "slug" | "icon" | "color" | "category">;
  type?: "TEACH" | "LEARN";
  level?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const Icon = iconFor(skill.icon);
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 font-semibold transition-all hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
        size === "xs" && "px-2 py-0.5 text-[11px]",
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <Icon className={cn("shrink-0", size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", skill.color)} />
      {skill.name}
      {type === "TEACH" && <span className="hidden rounded-full bg-emerald-500/10 px-1.5 text-[10px] font-bold text-emerald-600 sm:inline dark:text-emerald-400">teach</span>}
      {type === "LEARN" && <span className="hidden rounded-full bg-sky-500/10 px-1.5 text-[10px] font-bold text-sky-600 sm:inline dark:text-sky-400">learn</span>}
      {level && <span className="text-[10px] font-medium text-muted-foreground">{levelLabel(level)}</span>}
    </Link>
  );
}

export function levelLabel(level: string): string {
  return { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", EXPERT: "Expert" }[level] ?? level;
}

// ---------------------------------------------------------------------------
// Credit pill with animated count
// ---------------------------------------------------------------------------

export function CreditPill({ count, href = "/wallet", className, animate = true }: { count: number; href?: string; className?: string; animate?: boolean }) {
  const value = useCountUp(animate ? count : count);
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-bold text-primary transition-all hover:bg-primary/10 hover:shadow-glow",
        className,
      )}
      title={`${count} Skill Credits`}
    >
      <Coins className="h-4 w-4" aria-hidden />
      <span className="tabular-nums" aria-label={`${count} Skill Credits`}>
        {value}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Match ring — animated circular score
// ---------------------------------------------------------------------------

export function MatchRing({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const animated = useCountUp(score, 900);
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#4f46e5" : score >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" role="img" aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-secondary" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-extrabold tabular-nums" style={{ color, fontSize: size / 4.2 }}>
          {animated}%
        </span>
        {label && <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading used across dashboards
// ---------------------------------------------------------------------------

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category icon badge
// ---------------------------------------------------------------------------

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = iconFor(CATEGORY_ICON[category]);
  return (
    <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground", className)}>
      <Icon size={17} />
    </span>
  );
}

export { Badge };
