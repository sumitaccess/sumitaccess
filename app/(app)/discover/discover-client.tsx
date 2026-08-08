"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { get } from "@/lib/client";
import { useDebounce } from "@/hooks/useDebounce";
import { PersonCard } from "@/components/people/person-card";
import { Button, Select, Skeleton } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABEL, SKILL_LEVELS, SKILL_LEVEL_LABEL } from "@/lib/constants";
import type { PersonCard as PersonCardType, Skill } from "@/types";

export function DiscoverClient() {
  const params = useSearchParams();
  const [allSkills, setAllSkills] = React.useState<Skill[]>([]);

  const [q, setQ] = React.useState(params.get("q") ?? "");
  const [category, setCategory] = React.useState(params.get("category") ?? "");
  const [skill, setSkill] = React.useState(params.get("skill") ?? "");
  const [level, setLevel] = React.useState("");
  const [language, setLanguage] = React.useState("");
  const [online, setOnline] = React.useState("");
  const [minRating, setMinRating] = React.useState("");

  const [cards, setCards] = React.useState<PersonCardType[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const debouncedQ = useDebounce(q, 350);

  React.useEffect(() => {
    get<{ skills: Skill[] }>("/api/skills")
      .then((res) => setAllSkills(res.skills))
      .catch(() => {});
  }, []);

  const load = React.useCallback(
    async (pageNum: number, reset: boolean) => {
      setLoading(true);
      try {
        const search = new URLSearchParams({ page: String(pageNum), pageSize: "8" });
        if (debouncedQ) search.set("q", debouncedQ);
        if (category) search.set("category", category);
        if (skill) search.set("skill", skill);
        if (level) search.set("level", level);
        if (language) search.set("language", language);
        if (online) search.set("online", online);
        if (minRating) search.set("minRating", minRating);
        const res = await get<{ cards: PersonCardType[]; hasMore: boolean }>(`/api/discover?${search.toString()}`);
        setCards((prev) => (reset ? res.cards : [...prev, ...res.cards]));
        setHasMore(res.hasMore);
        setPage(pageNum);
      } catch {
        // friendly no-op; page-level error state could go here
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, category, skill, level, language, online, minRating],
  );

  React.useEffect(() => {
    setPage(1);
    void load(1, true);
  }, [load]);

  const activeFilterCount = [category, skill, level, language, online, minRating].filter(Boolean).length;
  const clearFilters = () => {
    setCategory(""); setSkill(""); setLevel(""); setLanguage(""); setOnline(""); setMinRating("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Find your next skill swap.</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real people, real skills, scored by compatibility.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{activeFilterCount}</span>}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people, skills or cities…"
          aria-label="Search people"
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm shadow-soft transition-all placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      {/* Filters */}
      {filtersOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFilter label="Category" value={category} onChange={setCategory} placeholder="Any category">
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{CATEGORY_LABEL[c.key]}</option>)}
            </SelectFilter>
            <SelectFilter label="Skill" value={skill} onChange={setSkill} placeholder="Any skill">
              {allSkills.filter((s) => !category || s.category === category).map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
            </SelectFilter>
            <SelectFilter label="Experience" value={level} onChange={setLevel} placeholder="Any level">
              {SKILL_LEVELS.map((l) => <option key={l} value={l}>{SKILL_LEVEL_LABEL[l]}</option>)}
            </SelectFilter>
            <SelectFilter label="Language" value={language} onChange={setLanguage} placeholder="Any language">
              {["English", "Hindi", "Spanish", "French", "German", "Arabic", "Tamil", "Telugu"].map((l) => <option key={l} value={l}>{l}</option>)}
            </SelectFilter>
            <SelectFilter label="Session type" value={online} onChange={setOnline} placeholder="Any">
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In-person</option>
              <option value="BOTH">Both</option>
            </SelectFilter>
            <SelectFilter label="Min rating" value={minRating} onChange={setMinRating} placeholder="Any rating">
              <option value="4.8">4.8+</option>
              <option value="4.5">4.5+</option>
              <option value="4">4.0+</option>
            </SelectFilter>
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} /> Clear all
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {loading && cards.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-2xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="font-display text-base font-bold">We couldn't find your perfect match yet.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Try removing a filter, adding another skill to your profile, or expanding your availability.
          </p>
          <Button variant="outline" size="sm" className="mt-5" href="/settings">Add Skills</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((p) => (
              <PersonCard key={p.user.id} person={p} />
            ))}
          </div>
          {loading && <div className="mt-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {hasMore && !loading && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={() => void load(page + 1, false)}>
                Load more matches
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SelectFilter({ label, value, onChange, placeholder, children }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; children?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{placeholder}</option>
        {children}
      </Select>
    </label>
  );
}
