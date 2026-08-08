"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Sparkles, X, CornerDownLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { get } from "@/lib/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "../ui";
import type { SafeUser, Skill } from "@/types";

interface Results {
  users: (SafeUser & { match: string })[];
  skills: Skill[];
  categories: { key: string; label: string; count: number }[];
}

export function GlobalSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Results | null>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const debounced = useDebounce(q, 250);
  const router = useRouter();
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    get<Results>(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debounced]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={boxRef} className={cn_("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search skills, people, categories…"
          aria-label="Search SkillSwap"
          className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-9 text-sm shadow-soft transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && q.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lift"
          >
            {loading ? (
              <div className="space-y-3 p-4">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ) : results ? (
              <div className="max-h-[70vh] overflow-y-auto p-2">
                {results.users.length === 0 && results.skills.length === 0 && results.categories.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No results for <span className="font-semibold text-foreground">"{q}"</span>
                  </p>
                ) : (
                  <>
                    {results.skills.length > 0 && (
                      <SearchGroup label="Skills" icon={<Sparkles size={13} />}>
                        {results.skills.map((s) => (
                          <button key={s.id} onClick={() => go(`/skills/${s.slug}`)} className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-secondary">
                            <span className="text-muted-foreground group-hover:text-foreground">{s.name}</span>
                            <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.category.replace("_", " ")}</span>
                          </button>
                        ))}
                      </SearchGroup>
                    )}
                    {results.users.length > 0 && (
                      <SearchGroup label="People" icon={<Users size={13} />}>
                        {results.users.map((u) => (
                          <button key={u.id} onClick={() => go(`/users/${u.username}`)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-secondary">
                            <Avatar src={u.image} name={u.name} size="sm" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{u.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{u.headline || u.location || `@${u.username}`}</span>
                            </span>
                          </button>
                        ))}
                      </SearchGroup>
                    )}
                    {results.categories.length > 0 && (
                      <SearchGroup label="Categories" icon={<Sparkles size={13} />}>
                        {results.categories.map((c) => (
                          <button key={c.key} onClick={() => go(`/discover?category=${encodeURIComponent(c.key)}`)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-secondary">
                            {c.label}
                            <span className="ml-auto text-xs text-muted-foreground">{c.count} skills</span>
                          </button>
                        ))}
                      </SearchGroup>
                    )}
                    <p className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                      <CornerDownLeft size={11} /> Enter to navigate · results update as you type
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function cn_(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
